// Prüft alle Lerninhalte gegen die echten Compiler:
//   - jedes Codebeispiel läuft fehlerfrei
//   - jede Musterlösung besteht alle Tests, der Startcode besteht sie nicht
//   - „Ausgabe vorhersagen" stimmt in jeder Sprache
//   - jede Animation lässt sich berechnen, ihre Schritt-Markierungen existieren im Code
//   - jede Lektion verweist nur auf vorhandene Beispiele, Animationen und Aufgaben
//
// Nutzung: npm run verify [-- lektion-id ...] [--lang rust]

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CHAPTERS } from '../content/curriculum.ts';
import { DATASETS } from '../content/datasets.ts';
import { GENERAL_LANGS, LANG_LABEL } from '../content/types.ts';
import type { Lang, LessonCode, Track } from '../content/types.ts';
import { trackInfo } from '../content/types.ts';
import { normalizeOutput, parseSnippet, perLang, splitExercise, trimBlock } from '../content/util.ts';
import { check, disassemble, runOnce } from '../server/runner.ts';
import type { RunLang } from '../server/runner.ts';
import { checkShell, runShell } from '../server/shell.ts';
import { checkSql, runSql } from '../server/sql.ts';

const args = process.argv.slice(2);
const langFlag = args.indexOf('--lang');
const onlyLang = langFlag >= 0 ? (args[langFlag + 1] as Lang) : null;
const onlyLessons = args.filter((a, i) => !a.startsWith('--') && (langFlag < 0 || i !== langFlag + 1));

const errors: string[] = [];
const warnings: string[] = [];
let checks = 0;

const tasks: (() => Promise<void>)[] = [];
const task = (fn: () => Promise<void>) => tasks.push(fn);

function short(text: string, max = 700): string {
  const t = text.trim();
  return (t.length > max ? `${t.slice(0, max)} …` : t).replace(/^/gm, '      ');
}

async function verifyLesson(id: string, track: Track): Promise<void> {
  const dir = path.resolve('content/lessons', id);
  const codeFile = path.join(dir, 'code.ts');
  const mdxFile = path.join(dir, 'lesson.mdx');
  if (!existsSync(mdxFile)) {
    warnings.push(`${id}: lesson.mdx fehlt (Lektion noch nicht geschrieben)`);
    return;
  }
  const mdx = await readFile(mdxFile, 'utf8');
  const code: LessonCode = existsSync(codeFile)
    ? ((await import(pathToFileURL(codeFile).href)) as { default: LessonCode }).default
    : {};
  const langs: Lang[] = trackInfo(track).langs.filter((l) => !onlyLang || l === onlyLang);
  const setup = DATASETS[code.dataset ?? 'laden'].setup;
  const snippets = code.snippets ?? {};
  const exercises = code.exercises ?? [];
  const scenes = code.scenes ?? {};

  // --- Verweise in der Lektion ---
  const refs = (re: RegExp) => [...mdx.matchAll(re)].map((m) => m[1]);
  for (const name of refs(/<Code\s+name="([^"]+)"/g)) {
    if (!snippets[name]) errors.push(`${id}: <Code name="${name}"> – Beispiel fehlt in code.ts`);
  }
  for (const name of refs(/<Uebersetzen\s+name="([^"]+)"/g)) {
    if (!snippets[name]) errors.push(`${id}: <Uebersetzen name="${name}"> – Beispiel fehlt in code.ts`);
    else if (!code.asm?.includes(name)) errors.push(`${id}: <Uebersetzen name="${name}"> – Beispiel fehlt in "asm"`);
  }
  for (const name of refs(/<Szene\s+name="([^"]+)"/g)) {
    if (!scenes[name]) errors.push(`${id}: <Szene name="${name}"> – Animation fehlt in code.ts`);
  }
  const usedExercises = refs(/<Aufgabe\s+id="([^"]+)"/g);
  for (const exId of usedExercises) {
    if (!exercises.some((e) => e.id === exId)) errors.push(`${id}: <Aufgabe id="${exId}"> – Aufgabe fehlt in code.ts`);
  }
  for (const ex of exercises) {
    if (!usedExercises.includes(ex.id)) errors.push(`${id}: Aufgabe "${ex.id}" wird in lesson.mdx nicht angezeigt`);
  }
  if (exercises.length === 0) warnings.push(`${id}: keine Aufgaben`);

  // --- Codebeispiele ---
  for (const [name, snippet] of Object.entries(snippets)) {
    for (const lang of langs) {
      const src = snippet[lang];
      if (!src) {
        if (track === 'general' && Object.keys(snippet).length > 1) warnings.push(`${id}: Beispiel "${name}" fehlt für ${LANG_LABEL[lang]}`);
        continue;
      }
      if (code.fragments?.includes(name) || code.noVerify?.includes(name)) continue;
      if (code.asm?.includes(name)) {
        task(async () => {
          checks++;
          for (const opt of [0, 2] as const) {
            const r = await disassemble(lang as RunLang, parseSnippet(src).code, opt);
            if (!r.ok || !r.output.trim()) errors.push(`${id}: Übersetzungs-Beispiel "${name}" (${LANG_LABEL[lang]}, O${opt}) scheitert:\n${short(r.error)}`);
          }
        });
        continue;
      }
      const parsed = parseSnippet(src);
      task(async () => {
        checks++;
        if (lang === 'sql') {
          const r = await runSql(setup, parsed.code);
          if (r.error) errors.push(`${id}: SQL-Beispiel "${name}" schlägt fehl: ${r.error}`);
          return;
        }
        if (lang === 'bash') {
          const r = await runShell(code.shellSetup ?? '', parsed.code);
          if (!r.ok) errors.push(`${id}: Terminal-Beispiel "${name}" schlägt fehl (Exit ${r.exitCode}):\n${short(r.error ?? r.setupError ?? r.output)}`);
          return;
        }
        const r = await runOnce(lang as RunLang, parsed.code, code.stdin?.[name] ?? '');
        if (!r.ok) {
          errors.push(`${id}: Beispiel "${name}" (${LANG_LABEL[lang]}) läuft nicht:\n${short(r.compileOutput + r.stderr || 'Zeitlimit/Abbruch')}`);
        }
      });
    }
  }

  // --- Aufgaben ---
  for (const ex of exercises) {
    if (ex.kind === 'quiz') {
      if (ex.correct < 0 || ex.correct >= ex.options.length) errors.push(`${id}/${ex.id}: richtige Antwort außerhalb der Optionen`);
    } else if (ex.kind === 'predict') {
      const snippet = snippets[ex.code];
      if (!snippet) {
        errors.push(`${id}/${ex.id}: Beispiel "${ex.code}" fehlt`);
        continue;
      }
      for (const lang of langs) {
        const src = snippet[lang];
        if (!src) {
          errors.push(`${id}/${ex.id}: kein Code für ${LANG_LABEL[lang]}`);
          continue;
        }
        task(async () => {
          checks++;
          const r =
            lang === 'sql'
              ? { ok: true, stdout: '', compileOutput: '', stderr: '' }
              : await runOnce(lang as RunLang, parseSnippet(src).code, code.stdin?.[ex.code] ?? '');
          const expected = perLang(ex.expected, lang);
          if (expected === undefined || perLang(ex.explain, lang) === undefined) {
            errors.push(`${id}/${ex.id}: "expected" oder "explain" fehlt für ${LANG_LABEL[lang]}`);
          } else if (!r.ok || normalizeOutput(r.stdout) !== normalizeOutput(expected)) {
            errors.push(
              `${id}/${ex.id} (${LANG_LABEL[lang]}): tatsächliche Ausgabe weicht von "expected" ab:\n${short(r.stdout + r.compileOutput + r.stderr)}`,
            );
          }
        });
      }
    } else if (ex.kind === 'code') {
      if (ex.tests.length === 0) errors.push(`${id}/${ex.id}: keine Tests`);
      for (const lang of langs) {
        const src = ex.code[lang];
        if (!src) {
          errors.push(`${id}/${ex.id}: kein Code für ${LANG_LABEL[lang]}`);
          continue;
        }
        const { starter, solution } = splitExercise(src);
        if (starter === solution) errors.push(`${id}/${ex.id} (${LANG_LABEL[lang]}): Startcode und Lösung sind identisch (Marker fehlen?)`);
        task(async () => {
          checks++;
          const r = await check(lang as RunLang, solution, ex.tests);
          if (!r.compileOk) {
            errors.push(`${id}/${ex.id} (${LANG_LABEL[lang]}): Musterlösung kompiliert nicht:\n${short(r.compileOutput)}`);
          } else if (!r.passed) {
            const f = r.results.find((t) => !t.passed)!;
            errors.push(
              `${id}/${ex.id} (${LANG_LABEL[lang]}): Musterlösung fällt durch "${f.name}":\n      erwartet: ${JSON.stringify(f.expected)}\n      erhalten: ${JSON.stringify(f.actual)}\n${short(f.stderr)}`,
            );
          }
        });
        task(async () => {
          checks++;
          const r = await check(lang as RunLang, starter, ex.tests);
          if (!r.compileOk) {
            if (!ex.starterBroken) errors.push(`${id}/${ex.id} (${LANG_LABEL[lang]}): Startcode kompiliert nicht:\n${short(r.compileOutput)}`);
          } else if (r.passed) {
            errors.push(`${id}/${ex.id} (${LANG_LABEL[lang]}): Startcode besteht bereits alle Tests`);
          }
        });
      }
    } else if (ex.kind === 'shell') {
      const shSetup = ex.setup ?? code.shellSetup ?? '';
      const solution = trimBlock(ex.solution);
      task(async () => {
        checks++;
        const r = await checkShell({ setup: shSetup, code: solution, solution, check: ex.check });
        if (!r.passed) errors.push(`${id}/${ex.id}: Musterlösung besteht nicht: ${r.message}`);
        else if (!r.user.ok) errors.push(`${id}/${ex.id}: Musterlösung endet mit Fehler (Exit ${r.user.exitCode}):\n${short(r.user.output)}`);
        else if (!r.expected.trim()) warnings.push(`${id}/${ex.id}: Prüfbefehl liefert keine Ausgabe`);
      });
      task(async () => {
        checks++;
        const starter = trimBlock(ex.starter ?? '# Deine Befehle');
        const r = await checkShell({ setup: shSetup, code: starter, solution, check: ex.check });
        if (r.passed) errors.push(`${id}/${ex.id}: Startcode besteht die Prüfung bereits`);
      });
    } else if (ex.kind === 'sql') {
      if (onlyLang && onlyLang !== 'sql') continue;
      const exSetup = DATASETS[ex.dataset ?? code.dataset ?? 'laden'].setup;
      const solution = trimBlock(ex.solution);
      task(async () => {
        checks++;
        const r = await checkSql({ setup: exSetup, code: solution, solution, ordered: ex.ordered, check: ex.check });
        if (!r.passed) errors.push(`${id}/${ex.id}: Musterlösung besteht nicht: ${r.message} ${r.error ?? ''}`);
        else if (r.expected && r.expected.rows.length === 0) warnings.push(`${id}/${ex.id}: Musterlösung liefert keine Zeilen`);
      });
      task(async () => {
        checks++;
        const starter = trimBlock(ex.starter ?? '-- Deine Abfrage');
        const r = await checkSql({ setup: exSetup, code: starter, solution, ordered: ex.ordered, check: ex.check });
        if (r.passed) errors.push(`${id}/${ex.id}: Startcode besteht die Prüfung bereits`);
      });
    }
  }

  // --- Animationen ---
  for (const [name, scene] of Object.entries(scenes)) {
    const params = Object.fromEntries((scene.params ?? []).map((p) => [p.name, p.value]));
    for (const lang of langs) {
      try {
        const steps = scene.build(params, lang);
        if (steps.length === 0) {
          errors.push(`${id}: Animation "${name}" hat für ${LANG_LABEL[lang]} keine Schritte`);
          continue;
        }
        if (!scene.code) continue;
        const src = snippets[scene.code]?.[lang];
        if (!src) {
          errors.push(`${id}: Animation "${name}" – Beispiel "${scene.code}" fehlt für ${LANG_LABEL[lang]}`);
          continue;
        }
        const tags = parseSnippet(src).tags;
        const missing = [...new Set(steps.map((s) => s.tag).filter((t): t is string => !!t && !tags[t]))];
        if (missing.length) {
          errors.push(`${id}: Animation "${name}" (${LANG_LABEL[lang]}) – Markierungen fehlen im Code: ${missing.join(', ')}`);
        }
        // SQL: Die Ergebnistabelle der Animation muss zum echten Abfrageergebnis passen.
        const last = steps[steps.length - 1];
        if (lang === 'sql' && last.result) {
          const expectedRows = last.result.rows;
          const expectedCols = last.result.columns;
          task(async () => {
            checks++;
            const r = await runSql(setup, parseSnippet(src).code);
            const real = [...r.statements].reverse().find((st) => st.columns.length > 0);
            const norm = (rows: unknown[][]) =>
              JSON.stringify(rows.map((row) => row.map((v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v))));
            if (r.error || !real) {
              errors.push(`${id}: Animation "${name}" – Abfrage schlägt fehl: ${r.error ?? 'kein Ergebnis'}`);
            } else if (norm(real.rows) !== norm(expectedRows) || JSON.stringify(real.columns) !== JSON.stringify(expectedCols)) {
              errors.push(
                `${id}: Animation "${name}" zeigt ein anderes Ergebnis als die echte Abfrage:\n      simuliert: ${JSON.stringify(expectedCols)} ${norm(expectedRows)}\n      echt:      ${JSON.stringify(real.columns)} ${norm(real.rows)}`,
              );
            }
          });
        }
        // Die simulierte Ausgabe muss zur echten Ausgabe des Programms passen.
        const simulated = steps[steps.length - 1].out;
        if (simulated !== undefined && lang !== 'sql' && lang !== 'bash' && !code.fragments?.includes(scene.code) && !code.noVerify?.includes(scene.code)) {
          const snippetName = scene.code;
          task(async () => {
            checks++;
            const r = await runOnce(lang as RunLang, parseSnippet(src).code, code.stdin?.[snippetName] ?? '');
            if (normalizeOutput(r.stdout) !== normalizeOutput(simulated)) {
              errors.push(
                `${id}: Animation "${name}" (${LANG_LABEL[lang]}) zeigt eine andere Ausgabe als das echte Programm:\n      simuliert: ${JSON.stringify(simulated)}\n      echt:      ${JSON.stringify(r.stdout)}`,
              );
            }
          });
        }
        // Auch die Grenzwerte der Regler ausprobieren.
        for (const p of scene.params ?? []) {
          scene.build({ ...params, [p.name]: p.min }, lang);
          scene.build({ ...params, [p.name]: p.max }, lang);
        }
      } catch (err) {
        errors.push(`${id}: Animation "${name}" (${LANG_LABEL[lang]}) wirft einen Fehler: ${String(err)}`);
      }
    }
  }
}

const started = performance.now();
for (const chapter of CHAPTERS) {
  for (const lesson of chapter.lessons) {
    if (onlyLessons.length && !onlyLessons.includes(lesson.id)) continue;
    await verifyLesson(lesson.id, chapter.track);
  }
}

// Aufgaben parallel abarbeiten (der Runner begrenzt die Zahl gleichzeitiger Prozesse selbst).
let done = 0;
const total = tasks.length;
async function worker(): Promise<void> {
  for (;;) {
    const next = tasks.shift();
    if (!next) return;
    await next();
    done++;
    if (process.stdout.isTTY) process.stdout.write(`\r  ${done}/${total} Prüfungen …`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
if (process.stdout.isTTY) process.stdout.write('\r');

for (const w of warnings) console.log(`  Hinweis: ${w}`);
for (const e of errors) console.log(`  FEHLER:  ${e}`);
const secs = ((performance.now() - started) / 1000).toFixed(1);
console.log(`\n${checks} Programme ausgeführt in ${secs} s – ${errors.length} Fehler, ${warnings.length} Hinweise.`);
process.exit(errors.length ? 1 : 0);
