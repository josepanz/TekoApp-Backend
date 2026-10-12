/**
 * Seed E2E (SOLO local, stack `docker-compose.e2e.yml`). Corre DESPUES de `prisma/seed.ts`
 * (roles, permisos, clientes Basic Auth `tekoapp-web`/`tekoapp-mobile`, catalogos y admin
 * `admin@tekoapp.com.py`) y agrega lo propio del E2E. 100% idempotente (upserts).
 * Lo lanza `pnpm e2e:seed` via scripts/e2e/cli.ts, que ya valido que el entorno no es Supabase.
 */
import { PrismaClient, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PERMISSIONS } from '../src/common/enum/permissions.enum';

const prisma = new PrismaClient();

const E2E_PASSWORD = 'E2e-Passw0rd!';

const FIXTURES = [
  {
    key: 'cliente_a',
    email: 'cliente_a@e2e.tekoapp.local',
    first: 'Cliente',
    last: 'A',
  },
  {
    key: 'cliente_b',
    email: 'cliente_b@e2e.tekoapp.local',
    first: 'Cliente',
    last: 'B',
  },
  {
    key: 'pro_aprobado',
    email: 'pro_aprobado@e2e.tekoapp.local',
    first: 'Pro',
    last: 'Aprobado',
  },
  {
    key: 'pro_pendiente',
    email: 'pro_pendiente@e2e.tekoapp.local',
    first: 'Pro',
    last: 'Pendiente',
  },
  {
    key: 'compliance',
    email: 'compliance@e2e.tekoapp.local',
    first: 'Compliance',
    last: 'E2E',
  },
] as const;

async function upsertCredentials(userId: number): Promise<void> {
  const passwordHash = bcrypt.hashSync(E2E_PASSWORD, bcrypt.genSaltSync());
  const existing = await prisma.userCredentials.findFirst({
    where: { userId },
  });
  if (existing) {
    await prisma.userCredentials.update({
      where: { id: existing.id },
      data: { passwordHash, isActive: true, attempts: 0 },
    });
  } else {
    await prisma.userCredentials.create({
      data: { userId, passwordHash, isActive: true },
    });
  }
}

async function main(): Promise<void> {
  const documentType = await prisma.documentsType.findUniqueOrThrow({
    where: { id: 1 },
  });
  const accessLevel = await prisma.accessLevel.findUniqueOrThrow({
    where: { name: 'STANDARD' },
  });
  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: 'plomeria' },
  });

  // Rol COMPLIANCE: mismo upsert que prisma/seed.ts de la rama fix/hallazgos-exploracion-e2e;
  // duplicado a proposito para que el merge de ambas ramas no genere conflicto (es idempotente).
  const complianceRole = await prisma.roles.upsert({
    where: { name: 'COMPLIANCE' },
    update: {},
    create: {
      name: 'COMPLIANCE',
      displayName: 'Compliance',
      description:
        'Auditoría legal: versiones de documentos, retención y consentimientos',
      createdBy: 'seed',
    },
  });
  for (const code of [
    PERMISSIONS.LEGAL.CONFIG_MANAGE,
    PERMISSIONS.LEGAL.CONSENT_AUDIT_VIEW,
  ]) {
    const permission = await prisma.permissions.findUniqueOrThrow({
      where: { name: code },
    });
    await prisma.rolePermissions.upsert({
      where: {
        roleId_permissionId: {
          roleId: complianceRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: complianceRole.id,
        permissionId: permission.id,
        createdBy: 'seed',
      },
    });
  }

  for (const [index, fx] of FIXTURES.entries()) {
    const user = await prisma.users.upsert({
      where: { email: fx.email },
      update: { status: 'ACTIVE' },
      create: {
        email: fx.email,
        firstName: fx.first,
        lastName: fx.last,
        documentTypeId: documentType.id,
        documentNumber: `E2E${1000 + index}`,
        phoneNumber: `+5959810000${index}0`,
        status: 'ACTIVE',
        profileStatus: 'COMPLETE',
        accessLevelId: accessLevel.id,
        createdBy: 'seed-e2e',
      },
    });
    await upsertCredentials(user.id);

    if (fx.key === 'compliance') {
      await prisma.userRoles.upsert({
        where: {
          userId_roleId: { userId: user.id, roleId: complianceRole.id },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: complianceRole.id,
          createdBy: 'seed-e2e',
        },
      });
    }

    if (fx.key === 'pro_aprobado' || fx.key === 'pro_pendiente') {
      const approved = fx.key === 'pro_aprobado';
      const verification = approved
        ? VerificationStatus.VERIFIED
        : VerificationStatus.UNVERIFIED;
      await prisma.professionals.upsert({
        where: { userId: user.id },
        update: {
          status: approved ? 'APPROVED' : 'PENDING',
          verificationStatus: verification,
          isAvailable: approved,
        },
        create: {
          userId: user.id,
          categoryId: category.id,
          description: `Profesional fixture E2E (${fx.key})`,
          hourlyRate: 40000,
          yearsOfExperience: 5,
          status: approved ? 'APPROVED' : 'PENDING',
          isAvailable: approved,
          verificationStatus: verification,
        },
      });
    }
  }

  console.log(
    `Seed E2E completo. ${FIXTURES.length} usuarios fixture (password: ${E2E_PASSWORD}).`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
