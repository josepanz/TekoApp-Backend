/**
 * CLI del entorno E2E aislado: `ts-node scripts/e2e/cli.ts <up|seed|down|test>`.
 * Todos los comandos cargan SOLO `.env.e2e` y abortan ante cualquier rastro de Supabase.
 */
import { execFileSync, spawnSync } from 'child_process';
import { resolve } from 'path';
import { loadE2eEnv } from './env';

const ROOT = resolve(__dirname, '..', '..');
const COMPOSE = ['compose', '-f', 'docker-compose.e2e.yml'];
const isWin = process.platform === 'win32';

function run(cmd: string, args: string[]): void {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
    shell: isWin,
  });
  if (r.status !== 0) throw new Error(`[e2e] falló: ${cmd} ${args.join(' ')}`);
}

function dockerOk(): void {
  try {
    execFileSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
      stdio: 'pipe',
    });
  } catch {
    throw new Error(
      '[e2e] Docker no está disponible (docker info falló). Abortando sin improvisar otra DB.',
    );
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(
  label: string,
  check: () => Promise<boolean> | boolean,
  timeoutMs = 120_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if (await check()) return;
    } catch {
      /* reintentar */
    }
    await sleep(1500);
  }
  throw new Error(`[e2e] timeout esperando ${label}`);
}

function inspect(container: string, format: string): string {
  try {
    return execFileSync('docker', ['inspect', '-f', format, container], {
      stdio: 'pipe',
    })
      .toString()
      .trim();
  } catch {
    return 'missing';
  }
}

async function http200(url: string): Promise<boolean> {
  const res = await fetch(url);
  return res.ok;
}

function seed(): void {
  run('npx', ['ts-node', 'prisma/seed.ts']);
  run('npx', ['ts-node', 'prisma/seed-e2e.ts']);
}

async function up(): Promise<void> {
  dockerOk();
  run('docker', [...COMPOSE, 'up', '-d']);
  for (const c of ['postgres', 'mongo', 'redis']) {
    await waitFor(
      `healthcheck de tekoapp-e2e-${c}`,
      () =>
        inspect(`tekoapp-e2e-${c}`, '{{.State.Health.Status}}') === 'healthy',
    );
  }
  await waitFor('MinIO', () =>
    http200('http://localhost:59000/minio/health/live'),
  );
  await waitFor('MailHog', () =>
    http200('http://localhost:58025/api/v2/messages'),
  );
  run('npx', ['prisma', 'migrate', 'deploy']);
  seed();
  console.log('[e2e] stack arriba y sembrado.');
}

function down(): void {
  dockerOk();
  run('docker', [...COMPOSE, 'down', '-v', '--remove-orphans']);
}

function test(): void {
  run('npx', [
    'jest',
    '--config',
    './test/jest-e2e-real.json',
    '--runInBand',
    '--forceExit',
  ]);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  loadE2eEnv();
  if (cmd === 'up') await up();
  else if (cmd === 'seed') seed();
  else if (cmd === 'down') down();
  else if (cmd === 'test') test();
  else throw new Error(`Comando desconocido: ${cmd} (up|seed|down|test)`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
