/**
 * CLI del entorno E2E aislado: `ts-node scripts/e2e/cli.ts <up|seed|down|test|serve>`.
 * Todos los comandos cargan SOLO `.env.e2e` y abortan ante cualquier rastro de Supabase.
 */
import { execFileSync, spawn, spawnSync } from 'child_process';
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
    ...process.argv.slice(3),
  ]);
}

/**
 * Levanta el backend HTTP real (ts-node src/main.ts) contra el stack e2e, en 0.0.0.0:3100
 * (el emulador Android entra por 10.0.2.2). Espera el health antes de declararse listo y
 * baja el proceso hijo con Ctrl+C. Requiere `pnpm e2e:up` previo.
 */
async function serve(): Promise<void> {
  const port = process.env.E2E_SERVE_PORT ?? '3100';
  const child = spawn(
    'npx',
    ['ts-node', '-r', 'tsconfig-paths/register', 'src/main.ts'],
    {
      cwd: ROOT,
      stdio: 'inherit',
      shell: isWin,
      env: {
        ...process.env,
        PORT: port,
        BASE_URL: `http://localhost:${port}`,
      },
    },
  );
  const stop = () => {
    if (isWin && child.pid) {
      spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    } else child.kill('SIGTERM');
  };
  process.on('SIGINT', () => {
    stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    stop();
    process.exit(0);
  });
  child.on('exit', (code) => process.exit(code ?? 1));
  const base = `http://localhost:${port}/tekoapp-backend/api`;
  await waitFor(
    'backend HTTP (healthcheck)',
    async () => {
      const res = await fetch(`${base}/healthcheck`);
      // 503 válido si solo falla storage_disk (ver README)
      return res.status === 200 || res.status === 503;
    },
    180_000,
  );
  console.log(
    `[e2e] backend LISTO en 0.0.0.0:${port} -> ${base} (swagger-json: ${base}/swagger-json)`,
  );
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  loadE2eEnv();
  if (cmd === 'up') await up();
  else if (cmd === 'seed') seed();
  else if (cmd === 'down') down();
  else if (cmd === 'test') test();
  else if (cmd === 'serve') await serve();
  else throw new Error(`Comando desconocido: ${cmd} (up|seed|down|test|serve)`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
