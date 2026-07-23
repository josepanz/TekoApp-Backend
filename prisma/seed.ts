import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_USER_EMAIL = 'admin@tekoapp.com.py';
const SEED_USER_PASSWORD = 'Tekoapp123!';

/**
 * Datos de ejemplo para desarrollo local — NUNCA usar estos valores (secretos, hash, contraseña)
 * en un ambiente real. El objetivo es dejar la base local en un estado usable de punta a punta:
 * login real, modo admin, modo profesional y catálogo mínimo para el modo cliente.
 */
async function main() {
  // ─── Cliente BFF (Basic Auth) ──────────────────────────────────────────────
  // El secretKey se guarda HASHEADO (bcrypt); el guard compara con
  // CryptoHelper.compareHashes. `update` también refresca el hash para que
  // re-ejecutar el seed sobre una DB existente lo deje consistente.
  const clientSecretHash = bcrypt.hashSync(
    process.env.WEB_CLIENT_SECRET ?? 'dev-only-change-me',
    bcrypt.genSaltSync(),
  );
  await prisma.apiClientCredential.upsert({
    where: { clientId: 'tekoapp-web' },
    update: { secretKey: clientSecretHash, isActive: true },
    create: {
      clientId: 'tekoapp-web',
      clientName: 'TekoApp-Frontend-Web',
      secretKey: clientSecretHash,
      isActive: true,
      createdBy: 'seed',
    },
  });

  // ─── Tablas de referencia ───────────────────────────────────────────────────
  // `documents_type` id=1 es un bloqueante duro: todo el código de creación de usuarios
  // (onboarding, admin) asume que existe (ver users-db.service.ts, onboarding.service.ts).
  const documentType = await prisma.documentsType.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Cédula de Identidad', isActive: true },
  });

  const accessLevel = await prisma.accessLevel.upsert({
    where: { name: 'STANDARD' },
    update: {},
    create: { name: 'STANDARD', createdBy: 'seed' },
  });

  // ─── Rol admin con permiso admin:all ────────────────────────────────────────
  const adminAllPermission = await prisma.permissions.upsert({
    where: { name: 'admin:all' },
    update: {},
    create: {
      name: 'admin:all',
      displayName: 'Administrador (todo)',
      description: 'Acceso total al backoffice',
      createdBy: 'seed',
    },
  });

  const adminRole = await prisma.roles.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      displayName: 'Administrador',
      description: 'Rol con acceso completo al backoffice',
      createdBy: 'seed',
    },
  });

  await prisma.rolePermissions.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: adminAllPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: adminAllPermission.id,
      createdBy: 'seed',
    },
  });

  // ─── Categoría y tipo de servicio (catálogo mínimo para /solicitar) ────────
  const category = await prisma.category.upsert({
    where: { slug: 'plomeria' },
    update: {},
    create: {
      name: 'Plomería',
      slug: 'plomeria',
      description: 'Servicios de reparación e instalaciones sanitarias',
      icon: 'wrench-outline',
      color: '#2ecc71',
      isVisible: true,
      createdBy: 'seed',
    },
  });

  await prisma.serviceType.upsert({
    where: { name: 'Instalación' },
    update: {},
    create: { name: 'Instalación', createdBy: 'seed' },
  });

  // ─── Usuario de prueba (admin + profesional a la vez, para probar los 3 modos) ──
  const passwordHash = bcrypt.hashSync(
    SEED_USER_PASSWORD,
    bcrypt.genSaltSync(),
  );

  const testUser = await prisma.users.upsert({
    where: { email: SEED_USER_EMAIL },
    update: {},
    create: {
      email: SEED_USER_EMAIL,
      firstName: 'Admin',
      lastName: 'TekoApp',
      documentTypeId: documentType.id,
      documentNumber: '1234567',
      phoneNumber: '+595981234567',
      status: 'ACTIVE',
      profileStatus: 'COMPLETE',
      isEmployee: true,
      accessLevelId: accessLevel.id,
      createdBy: 'seed',
    },
  });

  const existingCredentials = await prisma.userCredentials.findFirst({
    where: { userId: testUser.id },
  });
  if (existingCredentials) {
    await prisma.userCredentials.update({
      where: { id: existingCredentials.id },
      data: { passwordHash, isActive: true, attempts: 0 },
    });
  } else {
    await prisma.userCredentials.create({
      data: { userId: testUser.id, passwordHash, isActive: true },
    });
  }

  await prisma.userRoles.upsert({
    where: { userId_roleId: { userId: testUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: testUser.id, roleId: adminRole.id, createdBy: 'seed' },
  });

  // Perfil profesional del mismo usuario — permite probar /pro sin crear un segundo usuario.
  await prisma.professionals.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      categoryId: category.id,
      description: 'Plomero con 10 años de experiencia (usuario de prueba)',
      hourlyRate: 50000,
      yearsOfExperience: 10,
      status: 'APPROVED',
      isAvailable: true,
      verificationStatus: 'verified',
    },
  });

  console.log('\nSeed completo. Usuario de prueba:');
  console.log(`  email:    ${SEED_USER_EMAIL}`);
  console.log(`  password: ${SEED_USER_PASSWORD}`);
  console.log(
    '  roles: ADMIN (admin:all) + perfil profesional (categoría Plomería)\n',
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
