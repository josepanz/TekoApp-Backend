import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  name = 'CreateInitialTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla de categorías profesionales
    await queryRunner.query(`
      CREATE TABLE "professional_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "icon" character varying(255),
        "color" character varying(7),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_professional_categories" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de usuarios
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100) NOT NULL,
        "phone" character varying(20),
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'client',
        "isVerified" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT false,
        "avatar" text,
        "lastLoginAt" TIMESTAMP,
        "emailVerifiedAt" TIMESTAMP,
        "phoneVerifiedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de profesionales
    await queryRunner.query(`
      CREATE TABLE "professionals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "categoryId" uuid NOT NULL,
        "description" text NOT NULL,
        "hourlyRate" decimal(10,2) NOT NULL,
        "fixedRate" decimal(10,2),
        "skills" character varying(100) array DEFAULT '{}',
        "certifications" character varying(100) array DEFAULT '{}',
        "yearsOfExperience" integer NOT NULL DEFAULT 0,
        "status" "public"."professionals_status_enum" NOT NULL DEFAULT 'pending',
        "verificationStatus" "public"."professionals_verification_status_enum" NOT NULL DEFAULT 'pending',
        "isAvailable" boolean NOT NULL DEFAULT false,
        "isOnline" boolean NOT NULL DEFAULT false,
        "currentLatitude" decimal(10,7),
        "currentLongitude" decimal(10,7),
        "lastLocationUpdate" TIMESTAMP,
        "profileImage" character varying(255),
        "portfolioImages" character varying(255) array DEFAULT '{}',
        "rejectionReason" text,
        "approvedAt" TIMESTAMP,
        "rejectedAt" TIMESTAMP,
        "suspendedAt" TIMESTAMP,
        "totalServices" integer NOT NULL DEFAULT 0,
        "averageRating" decimal(3,2) NOT NULL DEFAULT 0,
        "totalRatings" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_professionals" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de servicios
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientId" uuid NOT NULL,
        "professionalId" uuid,
        "categoryId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "type" "public"."services_type_enum" NOT NULL DEFAULT 'hourly',
        "status" "public"."services_status_enum" NOT NULL DEFAULT 'pending',
        "estimatedHours" decimal(10,2),
        "actualHours" decimal(10,2),
        "hourlyRate" decimal(10,2),
        "fixedPrice" decimal(10,2),
        "totalAmount" decimal(10,2),
        "finalAmount" decimal(10,2),
        "latitude" decimal(10,7) NOT NULL,
        "longitude" decimal(10,7) NOT NULL,
        "address" character varying(255) NOT NULL,
        "additionalNotes" text,
        "images" character varying(255) array DEFAULT '{}',
        "isUrgent" boolean NOT NULL DEFAULT false,
        "scheduledAt" TIMESTAMP,
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "cancelledAt" TIMESTAMP,
        "cancellationReason" text,
        "rejectionReason" text,
        "clientRating" decimal(3,2),
        "clientReview" text,
        "professionalRating" decimal(3,2),
        "professionalReview" text,
        "isPaid" boolean NOT NULL DEFAULT false,
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de solicitudes de servicio
    await queryRunner.query(`
      CREATE TABLE "service_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "serviceId" uuid NOT NULL,
        "professionalId" uuid NOT NULL,
        "status" "public"."service_requests_status_enum" NOT NULL DEFAULT 'pending',
        "proposedPrice" decimal(10,2),
        "proposedHours" decimal(10,2),
        "message" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_requests" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de calificaciones
    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fromUserId" uuid NOT NULL,
        "toUserId" uuid NOT NULL,
        "serviceId" uuid NOT NULL,
        "rating" integer NOT NULL,
        "review" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ratings" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de pagos
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "serviceId" uuid NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'PYG',
        "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending',
        "paymentMethod" "public"."payments_payment_method_enum" NOT NULL,
        "stripePaymentIntentId" character varying(255),
        "transactionId" character varying(255),
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de notificaciones
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "type" "public"."notifications_type_enum" NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "data" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de promociones
    await queryRunner.query(`
      CREATE TABLE "promotions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "discountPercentage" integer NOT NULL,
        "discountAmount" decimal(10,2),
        "validFrom" TIMESTAMP NOT NULL,
        "validTo" TIMESTAMP NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "maxUses" integer,
        "currentUses" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_promotions" PRIMARY KEY ("id")
      )
    `);

    // Crear índices
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_professionals_userId" ON "professionals" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_professionals_status" ON "professionals" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_professionals_isAvailable" ON "professionals" ("isAvailable")`);
    await queryRunner.query(`CREATE INDEX "IDX_services_status" ON "services" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_services_clientId" ON "services" ("clientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_services_professionalId" ON "services" ("professionalId")`);
    await queryRunner.query(`CREATE INDEX "IDX_services_categoryId" ON "services" ("categoryId")`);
    await queryRunner.query(`CREATE INDEX "IDX_services_createdAt" ON "services" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_ratings_fromUserId" ON "ratings" ("fromUserId")`);
    await queryRunner.query(`CREATE INDEX "IDX_ratings_toUserId" ON "ratings" ("toUserId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_serviceId" ON "payments" ("serviceId")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_isRead" ON "notifications" ("isRead")`);

    // Crear restricciones de clave foránea
    await queryRunner.query(`ALTER TABLE "professionals" ADD CONSTRAINT "FK_professionals_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "professionals" ADD CONSTRAINT "FK_professionals_categoryId" FOREIGN KEY ("categoryId") REFERENCES "professional_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_services_clientId" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_services_professionalId" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_services_categoryId" FOREIGN KEY ("categoryId") REFERENCES "professional_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_service_requests_serviceId" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_service_requests_professionalId" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_ratings_fromUserId" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_ratings_toUserId" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_ratings_serviceId" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_serviceId" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    // Insertar categorías iniciales
    await queryRunner.query(`
      INSERT INTO "professional_categories" (name, description, icon, color) VALUES
      ('Electricista', 'Servicios de electricidad e instalaciones eléctricas', '⚡', '#FFD700'),
      ('Plomero', 'Servicios de plomería y fontanería', '🔧', '#4169E1'),
      ('Pintor', 'Servicios de pintura y decoración', '🎨', '#FF6347'),
      ('Albañil', 'Servicios de construcción y albañilería', '🏗️', '#8B4513'),
      ('Jardinero', 'Servicios de jardinería y paisajismo', '🌱', '#228B22'),
      ('Limpieza', 'Servicios de limpieza y mantenimiento', '🧹', '#20B2AA'),
      ('Carpintero', 'Servicios de carpintería y muebles', '🪚', '#D2691E'),
      ('Técnico', 'Servicios técnicos y reparaciones', '🔌', '#32CD32')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar restricciones de clave foránea
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_userId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_serviceId"`);
    await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_ratings_serviceId"`);
    await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_ratings_toUserId"`);
    await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_ratings_fromUserId"`);
    await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_service_requests_professionalId"`);
    await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_service_requests_serviceId"`);
    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_services_categoryId"`);
    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_services_professionalId"`);
    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_services_clientId"`);
    await queryRunner.query(`ALTER TABLE "professionals" DROP CONSTRAINT "FK_professionals_categoryId"`);
    await queryRunner.query(`ALTER TABLE "professionals" DROP CONSTRAINT "FK_professionals_userId"`);

    // Eliminar tablas
    await queryRunner.query(`DROP TABLE "promotions"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "ratings"`);
    await queryRunner.query(`DROP TABLE "service_requests"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "professionals"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "professional_categories"`);
  }
}
