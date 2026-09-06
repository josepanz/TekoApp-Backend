import {
  PrismaClient,
  DocumentCategory,
  LegalDocumentType,
  CommissionTarget,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PERMISSIONS } from '../src/common/enum/permissions.enum';

const prisma = new PrismaClient();

/**
 * Aplana el objeto anidado de `PERMISSIONS` (namespaces por dominio) a la lista plana de
 * códigos que existe como fila en la tabla `permissions`. Recursivo porque hay namespaces de
 * dos niveles (ej. `USER.PASSWORD.CREATE`).
 */
function flattenPermissionCodes(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(flattenPermissionCodes);
  }
  return [];
}

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

  // Cliente móvil (Basic Auth) — TekoApp-Frontend-Mobile no tiene BFF, así que este secreto vive
  // embebido en el binario/config de la app (ver TekoApp-Frontend-Mobile/.claude/rules/auth.md,
  // "Qué NO replicar del BFF de TekoApp-Web"). Faltaba: sin este registro, `POST /auth/nonce` y
  // `/auth/login` rechazan a mobile con INVALID_CLIENT_ID pese a que el código Flutter ya lee
  // BASIC_AUTH_CLIENT_ID/SECRET vía --dart-define desde la Fase 0002.
  const mobileClientSecretHash = bcrypt.hashSync(
    process.env.MOBILE_CLIENT_SECRET ?? 'dev-only-change-me',
    bcrypt.genSaltSync(),
  );
  await prisma.apiClientCredential.upsert({
    where: { clientId: 'tekoapp-mobile' },
    update: { secretKey: mobileClientSecretHash, isActive: true },
    create: {
      clientId: 'tekoapp-mobile',
      clientName: 'TekoApp-Frontend-Mobile',
      secretKey: mobileClientSecretHash,
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

  // ─── Catálogo completo de permisos (RBAC) ───────────────────────────────────
  // Sembrar el catálogo es un paso técnico y seguro; asignar cada permiso a un rol es una
  // decisión de negocio aparte (fuera de alcance acá, ver WORKPLAN T-04). El rol ADMIN sigue
  // solo con `admin:all`.
  for (const code of flattenPermissionCodes(PERMISSIONS)) {
    await prisma.permissions.upsert({
      where: { name: code },
      update: {},
      create: { name: code, createdBy: 'seed' },
    });
  }

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

  // ─── Catálogos de internacionalización (i18n) ──────────────────────────────
  // Estructura preparada para expansión futura; hoy el negocio es Paraguay-only.
  // `countries` no tiene columna única natural más allá del PK => upsert por `id` fijo
  // (mismo patrón que `documents_type` arriba). `currencies` (PK natural alphaCode) y
  // `languages` (code @unique) permiten upsert por su clave natural.
  const paraguay = await prisma.country.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      commonName: 'Paraguay',
      officialName: 'República del Paraguay',
      iso2: 'PY',
      iso3: 'PRY',
      numericCode: '600',
      phonePrefixCode: '+595',
      isActive: true,
      createdBy: 'seed',
    },
  });

  await prisma.currency.upsert({
    where: { alphaCode: 'PYG' },
    update: {},
    create: {
      alphaCode: 'PYG',
      numberCode: '600', // ISO 4217
      decimalQuantity: 0, // El Guaraní no usa decimales
      name: 'Guaraní paraguayo',
      symbol: '₲',
      countryId: paraguay.id,
      isActive: true,
      createdBy: 'seed',
    },
  });

  await prisma.language.upsert({
    where: { code: 'es' },
    update: {},
    create: { code: 'es', name: 'Español', isActive: true, createdBy: 'seed' },
  });

  await prisma.language.upsert({
    where: { code: 'en' },
    update: {},
    create: { code: 'en', name: 'English', isActive: true, createdBy: 'seed' },
  });

  // ─── Catálogo de tipos de documento profesional ─────────────────────────────
  // El dominio no define un enum cerrado de "tipo de documento" (`ProfessionalDocumentTypes.code`
  // es texto libre parametrizable, ver openspec/specs/professional-documents.md). Criterio usado
  // para este seed: un tipo representativo por cada valor de `DocumentCategory`
  // (BACKGROUND_CHECK, QUALIFICATION, PORTFOLIO) — cubre las 3 secciones que "Mis documentos" de
  // Mobile agrupa (`my_documents_screen.dart`), sin scoping de país/categoría (aplican a todos),
  // para que el listado nunca quede vacío en ningún grupo.
  const professionalDocumentTypesSeed = [
    {
      code: 'BG_CHECK_CRIMINAL_PY',
      name: 'Antecedente Policial',
      description: 'Certificado de antecedente policial vigente',
      category: DocumentCategory.BACKGROUND_CHECK,
      isRequired: true,
      validityDays: 180,
      isVisibleToClient: false,
      sortOrder: 1,
    },
    {
      code: 'BG_CHECK_JUDICIAL_PY',
      name: 'Antecedente Judicial',
      description: 'Certificado de antecedente judicial vigente',
      category: DocumentCategory.BACKGROUND_CHECK,
      isRequired: true,
      validityDays: 180,
      isVisibleToClient: false,
      sortOrder: 2,
    },
    {
      code: 'QUALIFICATION_CERTIFICATE',
      name: 'Título o certificado',
      description: 'Título técnico o certificado de capacitación en el oficio',
      category: DocumentCategory.QUALIFICATION,
      isRequired: false,
      validityDays: null,
      isVisibleToClient: true,
      sortOrder: 3,
    },
    {
      code: 'PORTFOLIO_WORK_EVIDENCE',
      name: 'Evidencia de trabajo previo',
      description: 'Fotos o documentación de trabajos previos realizados',
      category: DocumentCategory.PORTFOLIO,
      isRequired: false,
      validityDays: null,
      isVisibleToClient: true,
      sortOrder: 4,
    },
  ];

  for (const docType of professionalDocumentTypesSeed) {
    await prisma.professionalDocumentTypes.upsert({
      where: { code: docType.code },
      update: {},
      create: { ...docType, requiresStaffReview: true, createdBy: 'seed' },
    });
  }

  // ─── Documentos legales con consentimiento activo ───────────────────────────
  // Sembrar solo los `LegalDocumentType` que algún guard exige de verdad hoy
  // (`grep -rn "RequiresActiveConsent(" src/`): `professional-documents` y
  // `professional-portfolio`. No sembrar el enum completo — el resto no bloquea ningún flujo.
  // Contenido: placeholder honesto marcado como tal, no texto legal real (lo redacta José con
  // asesoría legal).
  const legalDocumentTypesRequiredByGuards = [
    LegalDocumentType.DATA_PROCESSING_CONSENT,
    LegalDocumentType.IMAGE_USAGE_CONSENT,
  ];

  for (const documentType of legalDocumentTypesRequiredByGuards) {
    const existingActiveVersion = await prisma.legalDocumentVersions.findFirst({
      where: { documentType, countryId: paraguay.id, isActive: true },
    });
    if (!existingActiveVersion) {
      await prisma.legalDocumentVersions.create({
        data: {
          documentType,
          countryId: paraguay.id,
          version: 'v1-dev-placeholder',
          contentUrl: `https://dev.tekoapp.local/legal-placeholder/${documentType.toLowerCase()}`,
          publishedAt: new Date(),
          isActive: true,
          createdBy: 'seed',
        },
      });
    }
  }

  // ─── Comisión de plataforma ──────────────────────────────────────────────────
  // 5% — valor confirmado por José (2026-09-06), no un placeholder.
  const existingDefaultCommission =
    await prisma.platformCommissionConfig.findFirst({
      where: { isDefault: true },
    });
  if (!existingDefaultCommission) {
    await prisma.platformCommissionConfig.create({
      data: {
        name: 'Comisión estándar de plataforma',
        description: 'Comisión por defecto aplicada a todos los servicios',
        percentage: 5,
        target: CommissionTarget.ALL,
        isDefault: true,
        createdBy: 'seed',
      },
    });
  }

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
