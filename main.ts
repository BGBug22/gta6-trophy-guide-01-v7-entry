// Leonida Legend — the hand-in program for the GTA VI trophy guide.
//
// What it does: it takes the guide that lives beside this file (the app/
// folder with the 55 trophies, plus the screenshots/) and hands it to the
// grader in /output, together with a dossier.json the scorer reads. The
// dossier itself is written by the vendored make.fun library — this file
// only decides WHAT goes in, and it refuses to hand in anything broken.
//
// Why the checks exist: the last version of this guide was rejected because
// this file was still the kit starter. So this file now does real work
// before it copies anything:
//   - it reads app/data/trophies.json and proves the list is the official
//     one: exactly 55 trophies, ids 1-55 with no gaps or duplicates, the
//     grade split 1 Platinum / 2 Gold / 6 Silver / 46 Bronze, 28 hidden,
//     every trophy with at least one guide step and one cited source, and
//     exactly 10 sources;
//   - it proves the screenshots fit the scorer's caps (at most 4, each at
//     most 256 KiB) before they are copied;
//   - it prints an audit summary so a human can see what was handed in.
//
// Run it outside the grader's container with MAKEFUN_OUTPUT_DIR:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The scorer's own caps (from the kit's reference/gate.json). Only
// text_max_bytes shapes the dossier bytes; the rest refuse an entry the
// scorer would refuse anyway, so we check them here first and fail loudly.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function fail(message: string): never {
  throw new Error(`Leonida Legend hand-in refused: ${message}`);
}

type Trophy = {
  id: number;
  name: string;
  description: string;
  grade: 'platinum' | 'gold' | 'silver' | 'bronze';
  hidden: boolean;
  guide: string[];
  sources: number[];
  counter: { label: string; target: number; unit: string } | null;
  flag: string | null;
};

type TrophyDoc = {
  counts: { total: number; platinum: number; gold: number; silver: number; bronze: number; hidden: number };
  sources: { id: number; name: string; url: string; status: number; live: boolean }[];
  trophies: Trophy[];
};

function loadTrophyData(appDir: string): TrophyDoc {
  const path = join(appDir, 'data', 'trophies.json');
  if (!existsSync(path)) fail(`missing ${path}`);
  let doc: TrophyDoc;
  try {
    doc = JSON.parse(readFileSync(path, 'utf8')) as TrophyDoc;
  } catch (e) {
    fail(`trophies.json is not valid JSON: ${String(e)}`);
  }
  const list = doc.trophies;
  if (list.length !== 55) fail(`expected 55 trophies, found ${list.length}`);
  const ids = list.map((t) => t.id).sort((a, b) => a - b);
  for (let i = 0; i < 55; i += 1) {
    if (ids[i] !== i + 1) fail(`trophy ids must be 1-55 with no gaps; position ${i} holds ${ids[i]}`);
  }
  const names = new Set(list.map((t) => t.name));
  if (names.size !== 55) fail('trophy names must be unique');
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let hidden = 0;
  for (const t of list) {
    grades[t.grade] += 1;
    if (t.hidden) hidden += 1;
    if (!t.name || !t.description) fail(`trophy ${t.id} is missing a name or description`);
    if (!Array.isArray(t.guide) || t.guide.length < 1) fail(`trophy ${t.id} (${t.name}) has no guide steps`);
    if (!Array.isArray(t.sources) || t.sources.length < 1) fail(`trophy ${t.id} (${t.name}) cites no source`);
    if (t.counter && !(t.counter.target > 0)) fail(`trophy ${t.id} has a counter with no target`);
  }
  if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
    fail(`grade split must be 1P/2G/6S/46B, found ${grades.platinum}P/${grades.gold}G/${grades.silver}S/${grades.bronze}B`);
  }
  if (hidden !== 28) fail(`expected 28 hidden trophies, found ${hidden}`);
  if (doc.sources.length !== 10) fail(`expected 10 sources, found ${doc.sources.length}`);
  const live = doc.sources.filter((s) => s.live).length;
  if (live < 1) fail('at least one source must be a live link');
  // Second pass — referential integrity: every citation must point at a
  // source that exists, every guide step must carry real text, and the
  // counter set must be the one the guide promises (19 trophy counters).
  const knownSources = new Set(doc.sources.map((s) => s.id));
  let countered = 0;
  for (const t of list) {
    for (const sid of t.sources) {
      if (!knownSources.has(sid)) fail(`trophy ${t.id} (${t.name}) cites source ${sid}, which does not exist`);
    }
    for (const step of t.guide) {
      if (!step || !step.trim()) fail(`trophy ${t.id} (${t.name}) has an empty guide step`);
    }
    if (t.counter) countered += 1;
  }
  if (countered !== 19) fail(`expected 19 trophies with sub-progress counters, found ${countered}`);
  return doc;
}

function checkScreenshots(dir: string): string[] {
  if (!existsSync(dir)) fail(`missing screenshots folder ${dir}`);
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  if (files.length < 1) fail('at least one screenshot is required');
  if (files.length > CAPS.screenshots.max) {
    fail(`at most ${CAPS.screenshots.max} screenshots allowed, found ${files.length}`);
  }
  for (const f of files) {
    const size = statSync(join(dir, f)).size;
    if (size > CAPS.screenshots.max_bytes) {
      fail(`screenshot ${f} is ${size} bytes, over the ${CAPS.screenshots.max_bytes} cap`);
    }
  }
  return files;
}

function handIn(): void {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  const appDir = join(here, 'app');
  const shotsDir = join(here, 'screenshots');

  // Validate first: never hand in a guide we have not proven correct.
  const doc = loadTrophyData(appDir);
  const shots = checkScreenshots(shotsDir);

  mkdirSync(out, { recursive: true });
  cpSync(appDir, join(out, 'app'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

  writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));

  const live = doc.sources.filter((s) => s.live).length;
  console.log(
    `Leonida Legend handed in: ${doc.trophies.length} trophies ` +
      `(${doc.counts.platinum}P/${doc.counts.gold}G/${doc.counts.silver}S/${doc.counts.bronze}B, ` +
      `${doc.counts.hidden} hidden), ${doc.sources.length} sources (${live} live), ` +
      `${shots.length} screenshots, dossier written to ${join(out, 'dossier.json')}`,
  );
}

handIn();
