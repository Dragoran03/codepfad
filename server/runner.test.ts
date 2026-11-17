import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { handleApi } from './api.ts';
import { check, runOnce } from './runner.ts';
import type { RunLang } from './runner.ts';
import { checkShell, runShell } from './shell.ts';
import { checkSql, runSql } from './sql.ts';

const HELLO: Record<RunLang, string> = {
  python: 'print("Hallo Größe")\n',
  java: 'public class Main { public static void main(String[] a) { System.out.println("Hallo Größe"); } }\n',
  c: '#include <stdio.h>\nint main(void) { printf("Hallo Größe\\n"); return 0; }\n',
  cpp: '#include <iostream>\nint main() { std::cout << "Hallo Größe\\n"; }\n',
  rust: 'fn main() { println!("Hallo Größe"); }\n',
};

for (const lang of Object.keys(HELLO) as RunLang[]) {
  test(`Hallo Welt läuft in ${lang} (inkl. Umlauten)`, async () => {
    const r = await runOnce(lang, HELLO[lang]);
    assert.equal(r.ok, true, r.compileOutput + r.stderr);
    assert.equal(r.stdout, 'Hallo Größe\n');
  });
}

test('Eingabe wird durchgereicht', async () => {
  const r = await runOnce('python', 'print(int(input()) * 2)\n', '21\n');
  assert.equal(r.stdout.trim(), '42');
});

test('Endlosschleife wird abgebrochen', async () => {
  const r = await runOnce('python', 'while True:\n    pass\n');
  assert.equal(r.ok, false);
  assert.equal(r.timedOut, true);
});

test('Ausgabeflut wird gedeckelt', async () => {
  const r = await runOnce('python', 'while True:\n    print("x" * 1000)\n');
  assert.equal(r.ok, false);
  assert.equal(r.truncated, true);
});

test('Compilerfehler kommen an', async () => {
  const r = await runOnce('rust', 'fn main() { let x: i32 = "nein"; }\n');
  assert.equal(r.phase, 'compile');
  assert.equal(r.ok, false);
  assert.match(r.compileOutput, /mismatched types/);
});

test('Sanitizer meldet Zugriff außerhalb eines Arrays in C', async () => {
  const code =
    '#include <stdio.h>\nint main(void) { int a[3] = {1, 2, 3}; int i = 3; printf("%d\\n", a[i]); return 0; }\n';
  const r = await runOnce('c', code);
  assert.equal(r.ok, false);
  assert.match(r.stderr, /out of bounds|AddressSanitizer/);
});

test('Prüfung vergleicht Ausgaben je Testfall', async () => {
  const r = await check('python', 'n = int(input())\nprint(n * n)\n', [
    { stdin: '3\n', expected: '9' },
    { stdin: '4\n', expected: '15' },
  ]);
  assert.equal(r.compileOk, true);
  assert.deepEqual(
    r.results.map((t) => t.passed),
    [true, false],
  );
  assert.equal(r.passed, false);
});

const SETUP = "CREATE TABLE t (id INTEGER, name TEXT); INSERT INTO t VALUES (1, 'a;b'), (2, 'c');";

test('SQL liefert Ergebnistabellen', async () => {
  const r = await runSql(SETUP, 'SELECT name FROM t ORDER BY id; -- Kommentar\nSELECT COUNT(*) AS n FROM t;');
  assert.equal(r.error, null);
  assert.equal(r.statements.length, 2);
  assert.deepEqual(r.statements[0].rows, [['a;b'], ['c']]);
  assert.deepEqual(r.statements[1].columns, ['n']);
});

test('SQL-Fehler werden gemeldet', async () => {
  const r = await runSql(SETUP, 'SELECT * FROM gibtsnicht;');
  assert.match(r.error ?? '', /no such table/);
});

test('SQL-Prüfung vergleicht mit der Musterlösung', async () => {
  const good = await checkSql({ setup: SETUP, code: 'SELECT id FROM t', solution: 'SELECT id FROM t ORDER BY id' });
  assert.equal(good.passed, true);
  const order = await checkSql({
    setup: SETUP,
    code: 'SELECT id FROM t ORDER BY id DESC',
    solution: 'SELECT id FROM t ORDER BY id',
    ordered: true,
  });
  assert.equal(order.passed, false);
  const dml = await checkSql({
    setup: SETUP,
    code: "UPDATE t SET name = 'z' WHERE id = 2",
    solution: "UPDATE t SET name = 'z' WHERE id = 2",
    check: 'SELECT * FROM t ORDER BY id',
  });
  assert.equal(dml.passed, true);
});

test('Endlose SQL-Abfrage wird abgebrochen', async () => {
  const r = await runSql('', 'WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r) SELECT COUNT(*) FROM r;');
  assert.match(r.error ?? '', /zu lange/);
});

// ---------- Terminal ----------
test('Shell: Befehle laufen im Übungsordner', async () => {
  const r = await runShell('echo inhalt > vorhanden.txt', 'mkdir neu && cp vorhanden.txt neu/ && ls neu');
  assert.equal(r.ok, true, r.output + (r.error ?? ''));
  assert.equal(r.output.trim(), 'vorhanden.txt');
  assert.deepEqual(r.tree, ['neu/', 'neu/vorhanden.txt', 'vorhanden.txt']);
});

test('Shell: Schreiben außerhalb des Übungsordners ist gesperrt', async () => {
  const ziel = path.join(process.cwd(), 'data', 'sandbox-test.txt');
  const r = await runShell('', `echo leck > '${ziel}'; echo "status $?"`);
  assert.match(r.output, /Operation not permitted/);
  assert.equal(existsSync(ziel), false);
});

test('Shell: Netzwerk ist gesperrt', async () => {
  const r = await runShell('', 'curl -s -m 3 https://example.org > /dev/null && echo offen || echo gesperrt');
  assert.equal(r.output.trim(), 'gesperrt');
});

test('Shell: Git funktioniert und wird ausgewertet', async () => {
  const r = await runShell('', 'git init -q && echo a > a.txt && git add a.txt && git commit -q -m "Erster Commit" && git switch -q -c neu');
  assert.equal(r.ok, true, r.output);
  assert.equal(r.git?.branch, 'neu');
  assert.equal(r.git?.commits.length, 1);
  assert.equal(r.git?.commits[0].subject, 'Erster Commit');
});

test('Shell: Prüfung vergleicht mit der Musterlösung', async () => {
  const ok = await checkShell({ setup: '', code: 'mkdir a', solution: 'mkdir a', check: 'ls' });
  assert.equal(ok.passed, true);
  const falsch = await checkShell({ setup: '', code: 'mkdir b', solution: 'mkdir a', check: 'ls' });
  assert.equal(falsch.passed, false);
});

// ---------- API-Schutz ----------
let base = '';
let host = '';
const server = createServer((req, res) => void handleApi(req, res));
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  host = `127.0.0.1:${(server.address() as AddressInfo).port}`;
  base = `http://${host}`;
});
after(() => server.close());

const post = (headers: Record<string, string>) =>
  fetch(`${base}/api/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ language: 'python', code: 'print(1)' }),
  });

test('API: eigene Seite darf Code ausführen', async () => {
  const r = await post({ 'Content-Type': 'application/json', Origin: base });
  assert.equal(r.status, 200);
  assert.equal(((await r.json()) as { stdout: string }).stdout, '1\n');
});

test('API: fremde Webseite wird abgelehnt', async () => {
  const r = await post({ 'Content-Type': 'application/json', Origin: 'https://boese.example' });
  assert.equal(r.status, 403);
});

test('API: Formular-Anfragen ohne JSON werden abgelehnt', async () => {
  const r = await post({ 'Content-Type': 'text/plain' });
  assert.equal(r.status, 403);
});

test('API: unbekannte Sprache wird abgelehnt', async () => {
  const r = await fetch(`${base}/api/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'bash', code: 'echo hi' }),
  });
  assert.equal(r.status, 400);
});
