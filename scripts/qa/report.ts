/**
 * Generador de informes QA (estándar C:\workspace\QA-DOC-STANDARD.md §3).
 *
 *   ts-node scripts/qa/report.ts unit            # corre jest (con cobertura) y escribe el informe
 *   ts-node scripts/qa/report.ts e2e             # e2e up/seed -> test e2e real -> informe -> down
 *   ts-node scripts/qa/report.ts from <tipo> <jest.json> [comando]   # solo genera desde un JSON existente
 *
 * Sin dependencias nuevas. Las secciones 3-6 (defectos, desvíos, evidencia, veredicto) quedan con
 * marcadores para completarse a mano. Escribe test/qa/informes/AAAA-MM-DD_<tipo>_<rama-corta>.md.
 */
import { execFileSync, spawnSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { relative, resolve } from 'path';
import jestConfig from '../../jest.config';

const ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(ROOT, 'test', 'qa', 'informes');
const CASOS_DIR = resolve(ROOT, 'test', 'qa', 'casos');
const COVERAGE_DIR = resolve(ROOT, 'coverage');
const isWin = process.platform === 'win32';

type Kind = 'unit' | 'e2e';

interface AssertionResult {
  ancestorTitles: string[];
  title: string;
  fullName: string;
  status: string;
}
interface TestResult {
  name: string;
  status: string;
  message?: string;
  startTime: number;
  endTime: number;
  assertionResults: AssertionResult[];
}
interface JestJson {
  numFailedTestSuites: number;
  startTime: number;
  testResults: TestResult[];
}
interface Totals {
  suites: number;
  passed: number;
  failed: number;
  skipped: number;
}
interface CovMetric {
  pct: number;
  covered: number;
  total: number;
}

function sh(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, stdio: 'pipe', shell: isWin })
      .toString()
      .trim();
  } catch {
    return 'n/d';
  }
}

function branchShort(branch: string): string {
  return (
    branch
      .replace(/^(feat|fix|chore|docs|refactor|test)\//, '')
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'sin-rama'
  );
}

const rel = (p: string): string => relative(ROOT, p).split('\\').join('/');

function domainOf(absPath: string): string {
  const parts = rel(absPath).split('/');
  if (
    parts[0] === 'src' &&
    (parts[1] === 'api' || parts[1] === 'modules') &&
    parts[2]
  ) {
    return `src/${parts[1]}/${parts[2]}`;
  }
  if (parts[0] === 'src' && parts[1]) return `src/${parts[1]}`;
  return parts[0] ?? '';
}

function cell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/** it-title -> CP-ID, leído de la fila `| Automatizado en | ... |` de cada caso en casos/CP-*.md. */
function loadCaseMap(): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(CASOS_DIR)) return map;
  for (const f of readdirSync(CASOS_DIR).filter((n) => /^CP-.*\.md$/.test(n))) {
    let current = '';
    for (const line of readFileSync(resolve(CASOS_DIR, f), 'utf8').split(
      /\r?\n/,
    )) {
      const h = /^###\s+(CP-[A-Z]+-[A-Z]+-\d+)/.exec(line);
      if (h) current = h[1];
      if (current && /^\|\s*Automatizado en\s*\|/.test(line)) {
        for (const m of line.matchAll(/`([^`]+)`/g)) {
          if (!/\.ts$/.test(m[1])) map.set(m[1], current);
        }
      }
    }
  }
  return map;
}

function totalsOf(results: TestResult[]): Totals {
  const t: Totals = { suites: results.length, passed: 0, failed: 0, skipped: 0 };
  for (const r of results) {
    // suite que no compiló o no arrancó: cuenta como un fallo
    if (r.assertionResults.length === 0 && r.status === 'failed') t.failed += 1;
    for (const a of r.assertionResults) {
      if (a.status === 'passed') t.passed += 1;
      else if (a.status === 'failed') t.failed += 1;
      else t.skipped += 1;
    }
  }
  return t;
}

function fmtDuration(ms: number): string {
  return ms < 60000
    ? `${(ms / 1000).toFixed(1)} s`
    : `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`;
}

function coverageSection(): string {
  const file = resolve(COVERAGE_DIR, 'coverage-summary.json');
  if (!existsSync(file)) return '_Cobertura no medida en esta ejecución._\n';
  const total = (
    JSON.parse(readFileSync(file, 'utf8')) as Record<
      string,
      Record<string, CovMetric>
    >
  ).total;
  const thr = (jestConfig.coverageThreshold?.global ?? {}) as Record<
    string,
    number
  >;
  const rows = ['statements', 'branches', 'functions', 'lines'].map((k) => {
    const m = total[k];
    const t = thr[k];
    const ok = t === undefined ? '-' : m.pct >= t ? 'cumple' : 'INCUMPLE';
    return `| ${k} | ${m.pct}% | ${m.covered}/${m.total} | ${t ?? '-'}% | ${ok} |`;
  });
  return [
    '| Métrica | Cobertura | Cubiertos/Total | Umbral (jest.config.ts) | Estado |',
    '|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}

export function buildReport(
  kind: Kind,
  json: JestJson,
  command: string,
  withCoverage: boolean,
): { name: string; body: string } {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  const commit = sh('git', ['rev-parse', '--short', 'HEAD']);
  const dirty = sh('git', ['status', '--porcelain'])
    ? ' (árbol con cambios sin commitear)'
    : '';
  const dockerV =
    kind === 'e2e'
      ? `, Docker ${sh('docker', ['--version']).replace(/^Docker version /, '')}`
      : '';
  const entorno =
    kind === 'e2e'
      ? `compose e2e (docker-compose.e2e.yml, .env.e2e), Node ${process.version}${dockerV}`
      : `local, Jest con mocks (sin infraestructura), Node ${process.version}`;
  const executor =
    process.env.QA_EXECUTOR ?? 'agente Claude Code (modelo claude-sonnet-5-5)';
  const caseMap = loadCaseMap();

  const t = totalsOf(json.testResults);
  const wallMs =
    Math.max(0, ...json.testResults.map((r) => r.endTime)) - json.startTime;
  const title = kind === 'unit' ? 'Pruebas unitarias' : 'E2E real (smoke)';
  const L: string[] = [];
  L.push(`# Informe de ejecución QA — ${title} — ${branch}`, '');
  L.push('| Campo | Valor |', '|---|---|');
  L.push(`| Fecha y hora | ${date} ${time} |`, '| Repo | TekoApp-Backend |');
  L.push(`| Rama | \`${branch}\` |`, `| Commit | \`${commit}\`${dirty} |`);
  L.push(`| Entorno | ${entorno} |`, `| Comando | \`${command}\` |`);
  L.push(`| Ejecutor | ${executor} |`, '');

  L.push('## 1. Resumen', '');
  L.push(
    '| Suites | Casos | Pasaron | Fallaron | Omitidos | Duración |',
    '|---|---|---|---|---|---|',
  );
  L.push(
    `| ${t.suites} (${json.numFailedTestSuites} con fallo) | ${t.passed + t.failed + t.skipped} | ${t.passed} | ${t.failed} | ${t.skipped} | ${fmtDuration(wallMs)} |`,
    '',
  );
  if (withCoverage) L.push('### Cobertura', '', coverageSection());

  const sorted = [...json.testResults].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  L.push(
    `## 2. Resultados por ${kind === 'unit' ? 'suite (agrupadas por dominio)' : 'caso'}`,
    '',
  );
  if (kind === 'unit') {
    const byDomain = new Map<string, TestResult[]>();
    for (const r of sorted) {
      const d = domainOf(r.name);
      byDomain.set(d, [...(byDomain.get(d) ?? []), r]);
    }
    const domains = [...byDomain.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    L.push(
      '### Totales por dominio',
      '',
      '| Dominio | Suites | Pasaron | Fallaron | Omitidos |',
      '|---|---|---|---|---|',
    );
    for (const [d, rs] of domains) {
      const dt = totalsOf(rs);
      L.push(
        `| \`${d}\` | ${dt.suites} | ${dt.passed} | ${dt.failed} | ${dt.skipped} |`,
      );
    }
    L.push('', '### Detalle por suite', '');
    for (const [d, rs] of domains) {
      L.push(
        `#### \`${d}\``,
        '',
        '| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |',
        '|---|---|---|---|---|---|',
      );
      for (const r of rs) {
        const st = totalsOf([r]);
        const n = st.passed + st.failed + st.skipped;
        L.push(
          `| \`${rel(r.name)}\` | ${n} | ${st.passed} | ${st.failed} | ${st.skipped} | ${r.status === 'passed' ? 'OK' : r.status} |`,
        );
      }
      L.push('');
    }
  } else {
    L.push('| Caso CP | Suite | Caso (it) | Estado |', '|---|---|---|---|');
    for (const r of sorted) {
      for (const a of r.assertionResults) {
        L.push(
          `| ${caseMap.get(a.title) ?? '-'} | \`${rel(r.name)}\` | ${cell(a.fullName)} | ${a.status} |`,
        );
      }
    }
    L.push('');
  }

  const bad = sorted.flatMap((r) =>
    r.assertionResults
      .filter((a) => a.status !== 'passed')
      .map((a) => ({ r, a })),
  );
  const crashed = sorted.filter(
    (r) => r.assertionResults.length === 0 && r.status === 'failed',
  );
  L.push('### Casos fallidos u omitidos', '');
  if (bad.length === 0 && crashed.length === 0) L.push('Ninguno.', '');
  else {
    L.push('| Estado | Suite | Caso | CP |', '|---|---|---|---|');
    for (const { r, a } of bad) {
      L.push(
        `| ${a.status} | \`${rel(r.name)}\` | ${cell(a.fullName)} | ${caseMap.get(a.title) ?? '-'} |`,
      );
    }
    for (const r of crashed) {
      const msg = cell((r.message ?? '').trim().split('\n')[0] ?? '');
      L.push(`| suite fallida | \`${rel(r.name)}\` | ${msg} | - |`);
    }
    L.push('');
  }

  L.push(
    '## 3. Defectos encontrados',
    '',
    '_COMPLETAR A MANO: ID `DEF-BE-NNN`, severidad, caso que lo detectó, repro y estado (o "Ninguno")._',
    '',
  );
  L.push(
    '## 4. Desvíos y observaciones',
    '',
    '_COMPLETAR A MANO: flakies, timeouts, entorno y omitidos con su motivo._',
    '',
  );
  L.push(
    '## 5. Evidencia',
    '',
    kind === 'unit'
      ? '- `coverage/lcov-report/index.html` y `coverage/coverage-summary.json` (ignorados por git; se regeneran con el comando).'
      : '- Salida JSON de jest en `coverage/jest-e2e.json` (ignorado por git).',
    '',
  );
  L.push(
    '## 6. Veredicto',
    '',
    '_COMPLETAR A MANO: APROBADO / APROBADO CON OBSERVACIONES / RECHAZADO, con su criterio._',
    '',
  );
  return {
    name: `${date}_${kind}_${branchShort(branch)}.md`,
    body: L.join('\n'),
  };
}

function writeReport(
  kind: Kind,
  jsonPath: string,
  command: string,
  withCoverage: boolean,
): string {
  const json = JSON.parse(readFileSync(jsonPath, 'utf8')) as JestJson;
  const { name, body } = buildReport(kind, json, command, withCoverage);
  mkdirSync(OUT_DIR, { recursive: true });
  const out = resolve(OUT_DIR, name);
  writeFileSync(out, body, 'utf8');
  console.log(`[qa] informe escrito: ${rel(out)}`);
  return out;
}

function runInherit(
  cmd: string,
  args: string[],
  extraEnv: Record<string, string> = {},
): number {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, ...extraEnv },
  });
  return r.status ?? 1;
}

const CLI = ['ts-node', 'scripts/e2e/cli.ts'];

function main(): void {
  const [mode, a1, a2, a3] = process.argv.slice(2);
  mkdirSync(COVERAGE_DIR, { recursive: true });
  if (mode === 'from' && a1 && a2) {
    const kind = a1 as Kind;
    writeReport(kind, resolve(a2), a3 ?? `pnpm qa:${kind}`, kind === 'unit');
    return;
  }
  if (mode === 'unit') {
    const json = resolve(COVERAGE_DIR, 'jest-unit.json');
    const code = runInherit(
      'npx',
      [
        'jest',
        '--forceExit',
        '--coverage',
        '--coverageReporters=json-summary',
        '--coverageReporters=lcov',
        '--coverageReporters=text-summary',
        '--maxWorkers=50%',
        '--json',
        `--outputFile=${json}`,
      ],
      { NODE_OPTIONS: '--max-old-space-size=8192' },
    );
    if (!existsSync(json)) throw new Error('[qa] jest no produjo el JSON.');
    writeReport('unit', json, 'pnpm qa:unit', true);
    process.exit(code);
  }
  if (mode === 'e2e') {
    const json = resolve(COVERAGE_DIR, 'jest-e2e.json');
    let code = 1;
    try {
      if (runInherit('npx', [...CLI, 'up']) !== 0) throw new Error('e2e up');
      if (runInherit('npx', [...CLI, 'seed']) !== 0) throw new Error('e2e seed');
      code = runInherit('npx', [
        ...CLI,
        'test',
        '--json',
        `--outputFile=${json}`,
      ]);
      if (existsSync(json)) writeReport('e2e', json, 'pnpm qa:e2e', false);
    } finally {
      runInherit('npx', [...CLI, 'down']);
    }
    process.exit(code);
  }
  throw new Error('Uso: report.ts <unit|e2e|from <tipo> <json> [comando]>');
}

if (require.main === module) main();
