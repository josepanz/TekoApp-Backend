import {
  PrismaClient,
  ProfessionalStatus,
  ServiceStatus,
  RequestStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentProvider,
  TransactionType,
  TransactionStatus,
  RatingType,
  PromotionType,
  PromotionStatus,
  PaymentChannelType,
  CommissionTarget,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

/**
 * Seed de datos DUMMY para navegar el front con la app "cargada" (no reemplaza a `seed.ts`,
 * que deja el mínimo indispensable para que la app arranque). Pensado para correrse una sola vez
 * sobre una DB ya inicializada con `pnpm run seed` — no es idempotente estricto (no hay upserts
 * por clave natural en la mayoría de las tablas de negocio, que no tienen una clave natural real
 * más allá del id autogenerado), así que re-ejecutarlo duplica los registros de negocio. Seguro
 * de correr en una DB de desarrollo local; NUNCA correr contra un ambiente compartido.
 */
const prisma = new PrismaClient();

const DUMMY_PASSWORD = 'Tekoapp123!';
const ASUNCION_LAT = -25.2637;
const ASUNCION_LNG = -57.5759;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function jitter(base: number, spread: number): number {
  return base + (Math.random() - 0.5) * spread;
}

const FIRST_NAMES = [
  'María',
  'José',
  'Ana',
  'Carlos',
  'Lucía',
  'Diego',
  'Valentina',
  'Miguel',
  'Camila',
  'Fernando',
  'Rocío',
  'Ricardo',
  'Sofía',
  'Gustavo',
  'Patricia',
  'Rodrigo',
  'Gabriela',
  'Sergio',
  'Verónica',
  'Hugo',
];
const LAST_NAMES = [
  'González',
  'Benítez',
  'Ramírez',
  'Duarte',
  'Cáceres',
  'Rojas',
  'Ayala',
  'Vera',
  'Martínez',
  'Ortiz',
  'Villalba',
  'Acosta',
  'Fernández',
  'Ferreira',
  'Bogado',
  'Franco',
  'Aquino',
  'Insfrán',
  'Sanabria',
  'Godoy',
];

function fullName(): { first: string; last: string } {
  return { first: pick(FIRST_NAMES), last: pick(LAST_NAMES) };
}

async function main() {
  console.log('Buscando datos base sembrados por seed.ts...');
  const documentType = await prisma.documentsType.findUniqueOrThrow({
    where: { id: 1 },
  });
  const plomeria = await prisma.category.findUniqueOrThrow({
    where: { slug: 'plomeria' },
  });
  const adminUser = await prisma.users.findUniqueOrThrow({
    where: { email: 'admin@tekoapp.com.py' },
  });
  const adminProfessional = await prisma.professionals.findUniqueOrThrow({
    where: { userId: adminUser.id },
  });
  const accessLevel = await prisma.accessLevel.findUniqueOrThrow({
    where: { name: 'STANDARD' },
  });
  const currency = await prisma.currency.findUniqueOrThrow({
    where: { alphaCode: 'PYG' },
  });

  // ─── Tipos de documento adicionales ─────────────────────────────────────────
  await prisma.documentsType.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'RUC', isActive: true },
  });
  await prisma.documentsType.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Pasaporte', isActive: true },
  });

  // ─── Categorías + subcategorías ─────────────────────────────────────────────
  const categoryDefs = [
    {
      name: 'Electricidad',
      slug: 'electricidad',
      icon: 'zap',
      color: '#f1c40f',
      subs: ['Instalaciones eléctricas', 'Reparación de cortocircuitos'],
    },
    {
      name: 'Limpieza del hogar',
      slug: 'limpieza-hogar',
      icon: 'sparkles',
      color: '#3498db',
      subs: ['Limpieza profunda', 'Limpieza de vidrios'],
    },
    {
      name: 'Jardinería',
      slug: 'jardineria',
      icon: 'flower-2',
      color: '#2ecc71',
      subs: ['Poda de árboles', 'Diseño de jardines'],
    },
    {
      name: 'Carpintería',
      slug: 'carpinteria',
      icon: 'hammer',
      color: '#a0522d',
      subs: [] as string[],
    },
    {
      name: 'Pintura',
      slug: 'pintura',
      icon: 'paint-bucket',
      color: '#e67e22',
      subs: [] as string[],
    },
    {
      name: 'Mudanzas',
      slug: 'mudanzas',
      icon: 'truck',
      color: '#9b59b6',
      subs: [] as string[],
    },
  ];

  const categories = [plomeria];
  for (const def of categoryDefs) {
    const parent = await prisma.category.upsert({
      where: { slug: def.slug },
      update: {},
      create: {
        name: def.name,
        slug: def.slug,
        description: `Servicios de ${def.name.toLowerCase()}`,
        icon: def.icon,
        color: def.color,
        isVisible: true,
        createdBy: 'seed-dummy',
      },
    });
    categories.push(parent);

    for (const subName of def.subs) {
      const subSlug = `${def.slug}-${subName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const sub = await prisma.category.upsert({
        where: { slug: subSlug },
        update: {},
        create: {
          name: subName,
          slug: subSlug,
          description: subName,
          parentCategoryId: parent.id,
          isVisible: true,
          createdBy: 'seed-dummy',
        },
      });
      categories.push(sub);
    }
  }

  // ─── Tipos de servicio adicionales ──────────────────────────────────────────
  const serviceTypeNames = [
    'Reparación',
    'Mantenimiento',
    'Emergencia',
    'Instalación',
  ];
  const serviceTypes = [];
  for (const name of serviceTypeNames) {
    serviceTypes.push(
      await prisma.serviceType.upsert({
        where: { name },
        update: {},
        create: { name, createdBy: 'seed-dummy' },
      }),
    );
  }

  // ─── Config de proveedores de pago y comisión de plataforma ────────────────
  const providerConfigs: {
    provider: PaymentProvider;
    displayName: string;
    channelType: PaymentChannelType;
    feePercentage: number;
  }[] = [
    {
      provider: PaymentProvider.BANCARD,
      displayName: 'Bancard',
      channelType: PaymentChannelType.CHECKOUT,
      feePercentage: 3.5,
    },
    {
      provider: PaymentProvider.MERCADO_PAGO,
      displayName: 'Mercado Pago',
      channelType: PaymentChannelType.QR,
      feePercentage: 4.0,
    },
    {
      provider: PaymentProvider.CASH,
      displayName: 'Efectivo',
      channelType: PaymentChannelType.DIRECT,
      feePercentage: 0,
    },
    {
      provider: PaymentProvider.PAGOFACIL,
      displayName: 'Pago Fácil',
      channelType: PaymentChannelType.LINK,
      feePercentage: 2.8,
    },
  ];
  for (const cfg of providerConfigs) {
    await prisma.paymentProviderConfig.upsert({
      where: { provider: cfg.provider },
      update: {},
      create: {
        provider: cfg.provider,
        displayName: cfg.displayName,
        channelType: cfg.channelType,
        feePercentage: cfg.feePercentage,
        feeFixed: 0,
        isActive: true,
        createdBy: 'seed-dummy',
      },
    });
  }

  const existingCommission = await prisma.platformCommissionConfig.findFirst({
    where: { isDefault: true },
  });
  if (!existingCommission) {
    await prisma.platformCommissionConfig.create({
      data: {
        name: 'Comisión estándar de plataforma',
        description: 'Comisión por defecto aplicada a todos los servicios',
        percentage: 10,
        target: CommissionTarget.ALL,
        isDefault: true,
        createdBy: 'seed-dummy',
      },
    });
  }

  // ─── Usuarios dummy (clientes + profesionales) ─────────────────────────────
  const passwordHash = bcrypt.hashSync(DUMMY_PASSWORD, bcrypt.genSaltSync());
  const professionalCategories = categories.filter(
    (c) => c.parentCategoryId === null,
  );

  type DummyUser = { id: number; isProfessional: boolean };
  const dummyUsers: DummyUser[] = [];

  const TOTAL_USERS = 16;
  const PROFESSIONAL_COUNT = 10;

  for (let i = 0; i < TOTAL_USERS; i++) {
    const { first, last } = fullName();
    const email =
      `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`.replace(
        /[íóá é ú ñ]/g,
        (m) =>
          ({ í: 'i', ó: 'o', á: 'a', é: 'e', ú: 'u', ñ: 'n', ' ': '' })[m] ?? m,
      );
    const documentNumber = `${randInt(1000000, 6999999)}`;

    const user = await prisma.users.create({
      data: {
        email,
        firstName: first,
        lastName: last,
        documentTypeId: documentType.id,
        documentNumber,
        phoneNumber: `+5959${randInt(70000000, 99999999)}`,
        status: 'ACTIVE',
        profileStatus: 'COMPLETE',
        isEmployee: false,
        accessLevelId: accessLevel.id,
        createdBy: 'seed-dummy',
      },
    });

    await prisma.userCredentials.create({
      data: { userId: user.id, passwordHash, isActive: true },
    });

    const isProfessional = i < PROFESSIONAL_COUNT;
    dummyUsers.push({ id: user.id, isProfessional });

    if (isProfessional) {
      const category = pick(professionalCategories);
      const statusPool: ProfessionalStatus[] = [
        ProfessionalStatus.APPROVED,
        ProfessionalStatus.APPROVED,
        ProfessionalStatus.APPROVED,
        ProfessionalStatus.PENDING,
        ProfessionalStatus.SUSPENDED,
      ];
      const status = statusPool[i % statusPool.length];
      const isOnline =
        status === ProfessionalStatus.APPROVED && Math.random() > 0.4;

      await prisma.professionals.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          description: `Profesional de ${category.name.toLowerCase()} con ${randInt(1, 15)} años de experiencia. Trabajo prolijo y puntual.`,
          hourlyRate: randInt(30, 120) * 1000,
          skills: [
            category.name,
            'Trabajo a domicilio',
            'Presupuesto sin cargo',
          ],
          yearsOfExperience: randInt(1, 15),
          status,
          isAvailable: status === ProfessionalStatus.APPROVED,
          isOnline,
          verificationStatus:
            status === ProfessionalStatus.APPROVED ? 'verified' : 'unverified',
          currentLatitude: isOnline ? jitter(ASUNCION_LAT, 0.1) : null,
          currentLongitude: isOnline ? jitter(ASUNCION_LNG, 0.1) : null,
          lastLocationUpdate: isOnline ? new Date() : null,
          createdBy: 'seed-dummy',
        },
      });
    }
  }

  const professionalRows = await prisma.professionals.findMany({
    where: {
      userId: {
        in: dummyUsers.filter((u) => u.isProfessional).map((u) => u.id),
      },
    },
  });
  // Incluye también el perfil profesional del admin en el pool para asignar servicios.
  const allProfessionals = [...professionalRows, adminProfessional];
  const clientUserIds = [
    ...dummyUsers.filter((u) => !u.isProfessional).map((u) => u.id),
    adminUser.id,
  ];

  // ─── Métodos de pago ────────────────────────────────────────────────────────
  const paymentMethodTypePool: PaymentMethod[] = [
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.QR,
    PaymentMethod.WALLET,
  ];
  for (const userId of clientUserIds.slice(0, 10)) {
    const type = pick(paymentMethodTypePool);
    await prisma.paymentMethodEntity.create({
      data: {
        userId,
        type,
        provider:
          type === PaymentMethod.QR
            ? PaymentProvider.MERCADO_PAGO
            : PaymentProvider.BANCARD,
        name:
          type === PaymentMethod.CREDIT_CARD
            ? 'Visa •••• 4242'
            : type === PaymentMethod.QR
              ? 'QR Mercado Pago'
              : 'Billetera Bancard',
        isDefault: true,
        isActive: true,
        details:
          type === PaymentMethod.CREDIT_CARD
            ? { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2028 }
            : { alias: `alias.${userId}.tekoapp` },
        createdAt: new Date(),
      },
    });
  }

  // ─── Servicios, solicitudes, pagos y calificaciones ────────────────────────
  const statusPool: ServiceStatus[] = [
    ServiceStatus.PENDING,
    ServiceStatus.ACCEPTED,
    ServiceStatus.IN_PROGRESS,
    ServiceStatus.COMPLETED,
    ServiceStatus.COMPLETED,
    ServiceStatus.COMPLETED,
    ServiceStatus.CANCELLED,
  ];

  const reviewTexts = [
    'Excelente trabajo, muy prolijo y puntual.',
    'Cumplió con lo acordado, lo recomiendo.',
    'Buen servicio, aunque tardó un poco más de lo esperado.',
    'Muy profesional, resolvió todo rápido.',
    'Precio justo y buena atención.',
  ];

  const TOTAL_SERVICES = 26;
  let completedCount = 0;

  for (let i = 0; i < TOTAL_SERVICES; i++) {
    // Reserva las primeras iteraciones para asegurar datos propios del usuario admin
    // (tanto como cliente que pide servicios, como profesional que los recibe).
    const forceAdminAsClient = i < 3;
    const forceAdminAsProfessional = i >= 3 && i < 6;

    const userId = forceAdminAsClient ? adminUser.id : pick(clientUserIds);
    const status = statusPool[i % statusPool.length];
    const category = pick(
      categories.filter((c) => c.parentCategoryId === null),
    );
    const serviceType = pick(serviceTypes);

    const assignProfessional =
      status !== ServiceStatus.PENDING || Math.random() > 0.5;
    const professional = forceAdminAsProfessional
      ? adminProfessional
      : assignProfessional
        ? pick(allProfessionals)
        : null;

    const hourlyRate = randInt(30, 120) * 1000;
    const estimatedHours = randInt(1, 6);
    const totalAmount = hourlyRate * estimatedHours;

    const createdAt = new Date(
      Date.now() - randInt(1, 60) * 24 * 60 * 60 * 1000,
    );
    const isCompleted = status === ServiceStatus.COMPLETED;
    const isCancelled = status === ServiceStatus.CANCELLED;

    const service = await prisma.services.create({
      data: {
        userId,
        professionalId: professional?.id ?? null,
        categoryId: category.id,
        title: `${serviceType.name} de ${category.name.toLowerCase()}`,
        description: `Necesito ${serviceType.name.toLowerCase()} de ${category.name.toLowerCase()} en mi domicilio.`,
        serviceTypeId: serviceType.id,
        status,
        estimatedHours,
        hourlyRate,
        totalAmount,
        finalAmount: isCompleted ? totalAmount : null,
        latitude: jitter(ASUNCION_LAT, 0.15),
        longitude: jitter(ASUNCION_LNG, 0.15),
        address: `Calle ${pick(LAST_NAMES)} ${randInt(100, 2500)}, Asunción`,
        isUrgent: Math.random() > 0.85,
        scheduledAt: status === ServiceStatus.PENDING ? null : createdAt,
        startedAt: ['IN_PROGRESS', 'COMPLETED'].includes(status)
          ? createdAt
          : null,
        completedAt: isCompleted
          ? new Date(createdAt.getTime() + estimatedHours * 60 * 60 * 1000)
          : null,
        cancelledAt: isCancelled ? createdAt : null,
        cancellationReason: isCancelled
          ? 'El cliente reprogramó para otra fecha'
          : null,
        createdAt,
        createdBy: 'seed-dummy',
      },
    });

    if (professional) {
      const requestStatus: RequestStatus =
        status === ServiceStatus.PENDING
          ? RequestStatus.PENDING
          : RequestStatus.ACCEPTED;
      await prisma.serviceRequests.create({
        data: {
          serviceId: service.id,
          professionalId: professional.id,
          status: requestStatus,
          proposedPrice: totalAmount,
          proposedHours: estimatedHours,
          message: 'Puedo hacerlo en la fecha solicitada.',
          createdBy: 'seed-dummy',
        },
      });

      // Un par de solicitudes competidoras para servicios PENDING sin asignar aún.
      if (status === ServiceStatus.PENDING && Math.random() > 0.5) {
        const competitor = pick(
          allProfessionals.filter((p) => p.id !== professional.id),
        );
        if (competitor) {
          await prisma.serviceRequests.create({
            data: {
              serviceId: service.id,
              professionalId: competitor.id,
              status: RequestStatus.PENDING,
              proposedPrice: totalAmount * 0.9,
              proposedHours: estimatedHours,
              message: 'Tengo disponibilidad inmediata y buen precio.',
              createdBy: 'seed-dummy',
            },
          });
        }
      }
    }

    if (isCompleted && professional) {
      completedCount += 1;
      const transactionId = `seed-txn-${service.id}-${Date.now()}`;
      const provider = pick([
        PaymentProvider.BANCARD,
        PaymentProvider.MERCADO_PAGO,
        PaymentProvider.PAGOFACIL,
      ]);
      const method =
        provider === PaymentProvider.MERCADO_PAGO
          ? PaymentMethod.QR
          : PaymentMethod.CREDIT_CARD;
      const fee = Math.round(totalAmount * 0.035);

      const payment = await prisma.payments.create({
        data: {
          userId,
          professionalId: professional.id,
          serviceId: service.id,
          amount: totalAmount,
          currencyCode: currency.alphaCode,
          fee,
          totalAmount: totalAmount + fee,
          status: PaymentStatus.COMPLETED,
          paymentMethod: method,
          paymentProvider: provider,
          transactionId,
          description: `Pago por ${service.title}`,
          platformFee: Math.round(totalAmount * 0.1),
          professionalNetAmount: totalAmount - Math.round(totalAmount * 0.1),
          processedAt: service.completedAt,
          paidAt: service.completedAt,
          createdAt: service.completedAt ?? createdAt,
          createdBy: 'seed-dummy',
        },
      });

      await prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          type: TransactionType.PAYMENT,
          status: TransactionStatus.COMPLETED,
          amount: totalAmount + fee,
          externalTransactionId: `ext-${transactionId}`,
          description: 'Pago procesado exitosamente',
          processedAt: payment.processedAt,
        },
      });

      // Calificación del cliente hacia el profesional (siempre) y, a veces, la recíproca.
      await prisma.rating.create({
        data: {
          userId,
          professionalId: professional.id,
          serviceId: service.id,
          type: RatingType.CLIENT_TO_PROFESSIONAL,
          rating: randInt(35, 50) / 10,
          review: pick(reviewTexts),
          createdBy: 'seed-dummy',
          createdAt: service.completedAt ?? createdAt,
        },
      });

      if (Math.random() > 0.5) {
        await prisma.rating.create({
          data: {
            userId,
            professionalId: professional.id,
            serviceId: service.id,
            type: RatingType.PROFESSIONAL_TO_CLIENT,
            rating: randInt(40, 50) / 10,
            review: 'Cliente puntual y buena comunicación.',
            createdBy: 'seed-dummy',
            createdAt: service.completedAt ?? createdAt,
          },
        });
      }
    }
  }

  // ─── Recalcular totales de reputación por profesional (no hay trigger que lo haga) ──
  for (const professional of allProfessionals) {
    const agg = await prisma.rating.aggregate({
      where: {
        professionalId: professional.id,
        type: RatingType.CLIENT_TO_PROFESSIONAL,
      },
      _avg: { rating: true },
      _count: { id: true },
    });
    const totalServicesCount = await prisma.services.count({
      where: {
        professionalId: professional.id,
        status: ServiceStatus.COMPLETED,
      },
    });
    await prisma.professionals.update({
      where: { id: professional.id },
      data: {
        averageRating: agg._avg.rating ?? 0,
        totalRatings: agg._count.id,
        totalServices: totalServicesCount,
      },
    });
  }

  console.log(
    `Servicios creados: ${TOTAL_SERVICES} (completados con pago+rating: ${completedCount})`,
  );

  // ─── Promociones ────────────────────────────────────────────────────────────
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const promo1 = await prisma.promotion.upsert({
    where: { code: 'BIENVENIDA10' },
    update: {},
    create: {
      code: 'BIENVENIDA10',
      name: 'Bienvenida 10%',
      description: '10% de descuento en tu primer servicio',
      type: PromotionType.PERCENTAGE,
      status: PromotionStatus.ACTIVE,
      discountPercentage: 10,
      maximumDiscount: 50000,
      maxUsage: 500,
      maxUsagePerUser: 1,
      validFrom: past30Days,
      validUntil: in30Days,
      createdBy: 'seed-dummy',
    },
  });

  await prisma.promotion.upsert({
    where: { code: 'FIJO20K' },
    update: {},
    create: {
      code: 'FIJO20K',
      name: 'Descuento fijo ₲20.000',
      description: 'Descuento fijo para servicios de mantenimiento',
      type: PromotionType.FIXED_AMOUNT,
      status: PromotionStatus.ACTIVE,
      discountAmount: 20000,
      minimumAmount: 100000,
      maxUsage: 200,
      maxUsagePerUser: 2,
      validFrom: past30Days,
      validUntil: in30Days,
      createdBy: 'seed-dummy',
    },
  });

  await prisma.promotion.upsert({
    where: { code: 'VERANO2026' },
    update: {},
    create: {
      code: 'VERANO2026',
      name: 'Promo Verano 2026 (vencida)',
      description:
        'Promoción de temporada ya expirada, útil para probar el filtro de expiradas',
      type: PromotionType.PERCENTAGE,
      status: PromotionStatus.EXPIRED,
      discountPercentage: 15,
      maxUsage: 100,
      maxUsagePerUser: 1,
      validFrom: past30Days,
      validUntil: yesterday,
      createdBy: 'seed-dummy',
    },
  });

  for (const userId of clientUserIds.slice(0, 3)) {
    await prisma.promotionUsage.create({
      data: {
        promotionId: promo1.id,
        userId,
        originalAmount: 100000,
        discountAmount: 10000,
        finalAmount: 90000,
      },
    });
  }
  await prisma.promotion.update({
    where: { id: promo1.id },
    data: { currentUsage: { increment: 3 } },
  });

  console.log('Datos dummy de Postgres listos.\n');

  // ============================ MONGODB ============================
  const mongoUri =
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/tekoapp';
  await mongoose.connect(mongoUri);

  const notificationSchema = new mongoose.Schema(
    {
      userId: { type: Number, required: true, index: true },
      type: { type: String, required: true },
      title: { type: String, required: true },
      message: { type: String, required: true },
      data: { type: Object },
      status: { type: String, default: 'pending' },
      readAt: { type: Date },
      sentAt: { type: Date },
      channels: { type: [String], default: ['in_app'] },
      metadata: { type: Object },
    },
    { timestamps: true, collection: 'notifications' },
  );
  const NotificationModel =
    mongoose.models.NotificationDocument ??
    mongoose.model('NotificationDocument', notificationSchema);

  const notificationDefs = [
    {
      type: 'service_request',
      title: 'Nueva solicitud de servicio',
      message: 'Tenés una nueva solicitud de servicio de Plomería.',
      status: 'pending',
    },
    {
      type: 'service_accepted',
      title: 'Solicitud aceptada',
      message: 'Un profesional aceptó tu solicitud de servicio.',
      status: 'read',
    },
    {
      type: 'payment_received',
      title: 'Pago recibido',
      message: 'Recibiste un pago por ₲350.000.',
      status: 'sent',
    },
    {
      type: 'rating_received',
      title: 'Nueva calificación',
      message: 'Un cliente te calificó con 5 estrellas.',
      status: 'read',
    },
    {
      type: 'promotion',
      title: 'Promoción disponible',
      message: 'Usá el código BIENVENIDA10 en tu próximo servicio.',
      status: 'pending',
    },
    {
      type: 'system',
      title: 'Bienvenido a TekoApp',
      message: 'Completá tu perfil para empezar a recibir solicitudes.',
      status: 'read',
    },
  ];

  const notificationTargets = [
    adminUser.id,
    ...dummyUsers.slice(0, 6).map((u) => u.id),
  ];
  let notifCount = 0;
  for (const userId of notificationTargets) {
    for (const def of notificationDefs.slice(
      0,
      randInt(3, notificationDefs.length),
    )) {
      await new NotificationModel({
        userId,
        type: def.type,
        title: def.title,
        message: def.message,
        status: def.status,
        readAt: def.status === 'read' ? new Date() : null,
        sentAt: def.status !== 'pending' ? new Date() : null,
        channels: ['in_app'],
      }).save();
      notifCount += 1;
    }
  }
  console.log(`Notificaciones creadas en Mongo: ${notifCount}`);

  const geoSchema = new mongoose.Schema(
    {
      professionalId: { type: Number, required: true },
      serviceId: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
      heading: Number,
      speed: Number,
    },
    { timestamps: true, collection: 'geo_tracking_logs', versionKey: false },
  );
  const GeoModel =
    mongoose.models.GeoTrackingLog ??
    mongoose.model('GeoTrackingLog', geoSchema);

  const onlineProfessionals = await prisma.professionals.findMany({
    where: { isOnline: true },
    take: 5,
  });
  let geoCount = 0;
  for (const professional of onlineProfessionals) {
    const activeService = await prisma.services.findFirst({
      where: {
        professionalId: professional.id,
        status: { in: [ServiceStatus.IN_PROGRESS, ServiceStatus.ACCEPTED] },
      },
    });
    if (!activeService) continue;

    for (let step = 0; step < 5; step++) {
      await new GeoModel({
        professionalId: professional.id,
        serviceId: activeService.referenceId,
        location: {
          type: 'Point',
          coordinates: [jitter(ASUNCION_LNG, 0.02), jitter(ASUNCION_LAT, 0.02)],
        },
        heading: randInt(0, 359),
        speed: randInt(0, 60),
      }).save();
      geoCount += 1;
    }
  }
  console.log(`Puntos de geolocalización creados en Mongo: ${geoCount}`);

  await mongoose.disconnect();

  console.log('\nSeed dummy completo.');
  console.log(
    `Usuarios dummy creados: ${dummyUsers.length} (contraseña para todos: ${DUMMY_PASSWORD})`,
  );
  console.log(
    'Todos los usuarios de prueba usan la misma contraseña para facilitar el login manual.',
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
