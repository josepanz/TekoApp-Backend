/* eslint-disable */
/**
 * Suite: M3 Onboarding profesional contra el stack real (postulación, documentos con subida real a MinIO,
 * cola y revisión de admin, consentimiento, verify/suspend con efecto real, portafolio, job de expiración).
 * Casos: CP-BE-ONB-001..032 (ver test/qa/casos/CP-ONB.md)
 * Tipo: e2e   Prioridad: P1
 * Precondiciones: pnpm e2e:up + e2e:seed (versiones legales sembradas con countryId null); fixtures admin y
 *        cliente_a. Los usuarios/profesionales se crean por API en cada corrida (email único).
 * Trazabilidad: M3 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3); openspec/specs/e2e-test-plan.md Tier 3;
 *        DEF-BE-014..018.
 */
import { PrismaClient } from '@prisma/client';
import { ProfessionalDocumentsExpirationJob } from '../../src/api/professional-documents/jobs/professional-documents-expiration.job';
import {
  bearer,
  bootApp,
  E2eApp,
  FIXTURE,
  login,
  PREFIX,
  uniqueSuffix,
  unwrap,
} from './helpers/e2e-app';
import {
  acceptConsent,
  applyAsProfessional,
  plomeriaCategoryId,
  registerUser,
  tinyPdf,
  tinyPng,
} from './helpers/w2';

describe('M3 Onboarding profesional (e2e real)', () => {
  let ctx: E2eApp;
  let http: E2eApp['http'];
  let admin: string;
  let clienteA: string;
  let categoryId: number;
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  beforeAll(async () => {
    ctx = await bootApp();
    http = ctx.http;
    admin = (await login(http, FIXTURE.admin.email, FIXTURE.admin.password))
      .accessToken;
    clienteA = (
      await login(http, FIXTURE.clienteA.email, FIXTURE.clienteA.password)
    ).accessToken;
    categoryId = await plomeriaCategoryId(http);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await ctx?.close();
  });

  /** Usuario nuevo ya postulado (PENDING). */
  const newPro = async (consents: string[] = []) => {
    const user = await registerUser(http, 'onb');
    const res = await applyAsProfessional(http, user.token, categoryId).expect(
      201,
    );
    const pro = unwrap(res.body);
    for (const c of consents) await acceptConsent(http, user.token, c);
    return { user, pro: pro as { id: number; referenceId: string } };
  };

  const docTypes = async (token: string) =>
    (
      unwrap(
        (
          await http
            .get(`${PREFIX}/professional-document-types`)
            .set(bearer(token))
            .expect(200)
        ).body,
      ).data as any[]
    ).filter((t) => t.isActive);
  const typeByCode = async (token: string, code: string) =>
    (await docTypes(token)).find((t) => t.code === code);

  const uploadDoc = (
    token: string,
    typeRef: string,
    file: Buffer = tinyPdf(),
    meta = { filename: 'doc.pdf', contentType: 'application/pdf' },
  ) =>
    http
      .post(`${PREFIX}/professionals/me/documents`)
      .set(bearer(token))
      .field('professionalDocumentTypeReferenceId', typeRef)
      .attach('file', file, meta);

  const review = (
    docRef: string,
    body: Record<string, unknown>,
    token = admin,
  ) =>
    http
      .patch(`${PREFIX}/admin/professional-documents/${docRef}/review`)
      .set(bearer(token))
      .send(body);

  const myProfile = async (token: string) =>
    unwrap(
      (
        await http
          .get(`${PREFIX}/professionals/me`)
          .set(bearer(token))
          .expect(200)
      ).body,
    );

  describe('Postulación POST /professionals', () => {
    // CP-BE-ONB-001
    it('un usuario registrado se postula y queda PENDING, no disponible', async () => {
      const user = await registerUser(http, 'onb');
      const res = await applyAsProfessional(http, user.token, categoryId, {
        skills: ['cañerías'],
        yearsOfExperience: 3,
      }).expect(201);
      const pro = unwrap(res.body);
      expect(pro.status).toBe('PENDING');
      expect(pro.isAvailable).toBe(false);
      expect(pro.verificationStatus).toBe('UNVERIFIED');
      expect(pro.requiredDocumentsVerified).toBe(false);
      const me = await myProfile(user.token);
      expect(me.referenceId).toBe(pro.referenceId);
    });

    // CP-BE-ONB-002
    it.failing('DEF-BE-015: la doble postulación (USER_ALREADY_PROFESSIONAL) debe responder 409', async () => {
      const { user } = await newPro();
      const res = await applyAsProfessional(http, user.token, categoryId);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/ya es un profesional/i);
    });

    // CP-BE-ONB-003
    it('una categoría inexistente se rechaza con 400 y mensaje claro', async () => {
      const user = await registerUser(http, 'onb');
      const res = await applyAsProfessional(http, user.token, 999999);
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/categor/i);
      // y el usuario no quedó como profesional
      await http
        .get(`${PREFIX}/professionals/me`)
        .set(bearer(user.token))
        .expect(404);
    });

    // CP-BE-ONB-004
    it('body inválido (sin categoryId, tarifa negativa, descripción vacía) -> 400 con detalle por campo', async () => {
      const user = await registerUser(http, 'onb');
      const res = await http
        .post(`${PREFIX}/professionals`)
        .set(bearer(user.token))
        .send({ description: '', hourlyRate: -5 })
        .expect(400);
      const fields = (res.body.error.errors as any[]).map((e) => e.field);
      expect(fields).toEqual(
        expect.arrayContaining(['categoryId', 'description', 'hourlyRate']),
      );
    });

    // CP-BE-ONB-005
    it('sin JWT -> 401', async () => {
      await http
        .post(`${PREFIX}/professionals`)
        .send({ categoryId, description: 'x', hourlyRate: 1 })
        .expect(401);
    });

    // CP-BE-ONB-006
    it('un usuario sin perfil profesional recibe 404 en GET /professionals/me', async () => {
      const res = await http
        .get(`${PREFIX}/professionals/me`)
        .set(bearer(clienteA))
        .expect(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Consentimiento previo a subir documentos', () => {
    // CP-BE-ONB-007
    it.failing('DEF-BE-014: las versiones legales activas aparecen como pendientes para un usuario nuevo', async () => {
      const user = await registerUser(http, 'onb');
      const pending = unwrap(
        (
          await http
            .get(`${PREFIX}/legal/consents/pending`)
            .set(bearer(user.token))
            .expect(200)
        ).body,
      ) as any[];
      const types = pending.map((v) => v.documentType);
      expect(types).toEqual(
        expect.arrayContaining([
          'DATA_PROCESSING_CONSENT',
          'IMAGE_USAGE_CONSENT',
        ]),
      );
    });

    // CP-BE-ONB-008
    it('sin DATA_PROCESSING_CONSENT subir un documento da 403 CONSENT_REQUIRED; tras aceptarlo funciona', async () => {
      const { user } = await newPro();
      const t = await typeByCode(user.token, 'QUALIFICATION_CERTIFICATE');
      const blocked = await uploadDoc(user.token, t.referenceId);
      expect(blocked.status).toBe(403);
      expect(blocked.body.error.errorCode).toBe('CONSENT_REQUIRED');

      await acceptConsent(http, user.token, 'DATA_PROCESSING_CONSENT');
      const ok = await uploadDoc(user.token, t.referenceId);
      expect(ok.status).toBe(201);
      expect(unwrap(ok.body).status).toBe('PENDING');
    });

    // CP-BE-ONB-009
    it('aceptar dos veces la misma versión -> 409 y deja de figurar como pendiente', async () => {
      const user = await registerUser(http, 'onb');
      await acceptConsent(http, user.token, 'DATA_PROCESSING_CONSENT');
      const pending = unwrap(
        (
          await http
            .get(`${PREFIX}/legal/consents/pending`)
            .set(bearer(user.token))
            .expect(200)
        ).body,
      ) as any[];
      expect(pending.map((v) => v.documentType)).not.toContain(
        'DATA_PROCESSING_CONSENT',
      );
      const version = await prisma.legalDocumentVersions.findFirstOrThrow({
        where: {
          documentType: 'DATA_PROCESSING_CONSENT',
          isActive: true,
          countryId: null,
        },
      });
      await http
        .post(`${PREFIX}/legal/consents/${version.referenceId}/accept`)
        .set(bearer(user.token))
        .expect(409);
    });
  });

  describe('Documentos: subida real a MinIO, listado, cola y revisión', () => {
    let proA: Awaited<ReturnType<typeof newPro>>;
    let crim: any;
    let qual: any;

    beforeAll(async () => {
      proA = await newPro(['DATA_PROCESSING_CONSENT']);
      crim = await typeByCode(proA.user.token, 'BG_CHECK_CRIMINAL_PY');
      qual = await typeByCode(proA.user.token, 'QUALIFICATION_CERTIFICATE');
    });

    // CP-BE-ONB-010
    it('el listado propio muestra cada tipo aplicable sin documento al inicio', async () => {
      const res = await http
        .get(`${PREFIX}/professionals/me/documents`)
        .set(bearer(proA.user.token))
        .expect(200);
      const rows = unwrap(res.body).data as any[];
      expect(rows.length).toBeGreaterThanOrEqual(4);
      expect(rows.every((r) => r.document === null)).toBe(true);
      expect(
        rows.find((r) => r.documentType.code === 'BG_CHECK_CRIMINAL_PY')
          .documentType.isRequired,
      ).toBe(true);
    });

    // CP-BE-ONB-011
    it('la subida llega a MinIO: el URL presignado devuelve los mismos bytes', async () => {
      const file = tinyPdf();
      const up = await uploadDoc(
        proA.user.token,
        crim.referenceId,
        file,
      ).expect(201);
      const doc = unwrap(up.body);
      expect(doc.status).toBe('PENDING');
      expect(doc.fileKey).toMatch(/\.pdf$/);
      expect(doc.expiresAt).toBeTruthy(); // validityDays=180
      const presigned = unwrap(
        (
          await http
            .get(`${PREFIX}/uploads/presigned-url`)
            .query({ key: doc.fileKey })
            .set(bearer(proA.user.token))
            .expect(200)
        ).body,
      ).url as string;
      const got = await fetch(presigned);
      expect(got.status).toBe(200);
      expect(Buffer.from(await got.arrayBuffer()).equals(file)).toBe(true);
    });

    // CP-BE-ONB-012
    it('rechaza archivo inválido: tipo no permitido, > 5 MB, sin archivo, tipo de documento desconocido o UUID inválido', async () => {
      const exe = await uploadDoc(
        proA.user.token,
        qual.referenceId,
        Buffer.from('MZ'),
        { filename: 'x.exe', contentType: 'application/x-msdownload' },
      );
      expect(exe.status).toBe(400);
      const big = await uploadDoc(
        proA.user.token,
        qual.referenceId,
        Buffer.alloc(5 * 1024 * 1024 + 1, 1),
      );
      expect(big.status).toBe(400);
      const nofile = await http
        .post(`${PREFIX}/professionals/me/documents`)
        .set(bearer(proA.user.token))
        .field('professionalDocumentTypeReferenceId', qual.referenceId);
      expect(nofile.status).toBe(400);
      const unknown = await uploadDoc(
        proA.user.token,
        '11111111-1111-4111-8111-111111111111',
      );
      expect(unknown.status).toBe(404);
      const badUuid = await uploadDoc(proA.user.token, 'no-es-uuid');
      expect(badUuid.status).toBe(400);
      for (const r of [exe, big, nofile, unknown, badUuid]) {
        expect(r.body.success).toBe(false);
        expect(typeof r.body.error.message).toBe('string');
      }
    });

    // CP-BE-ONB-013
    it('un usuario sin perfil profesional (con consentimiento) no puede subir documentos: 4xx, nunca 500', async () => {
      const user = await registerUser(http, 'onb');
      await acceptConsent(http, user.token, 'DATA_PROCESSING_CONSENT');
      const res = await uploadDoc(user.token, qual.referenceId);
      expect([403, 404]).toContain(res.status);
    });

    // CP-BE-ONB-014
    it('la cola de admin lista el documento PENDING con filtros y un usuario común recibe 403', async () => {
      const q = await http
        .get(`${PREFIX}/admin/professional-documents`)
        .query({ status: 'PENDING', pageSize: 100 })
        .set(bearer(admin))
        .expect(200);
      const body = unwrap(q.body);
      expect(body.pagination.pageSize).toBe(100);
      expect((body.data as any[]).length).toBeGreaterThanOrEqual(1);
      await http
        .get(`${PREFIX}/admin/professional-documents`)
        .set(bearer(clienteA))
        .expect(403);
      await http
        .get(`${PREFIX}/admin/professionals/${proA.pro.referenceId}/documents`)
        .set(bearer(clienteA))
        .expect(403);
      const byPro = await http
        .get(`${PREFIX}/admin/professionals/${proA.pro.referenceId}/documents`)
        .set(bearer(admin))
        .expect(200);
      expect((unwrap(byPro.body).data as any[]).length).toBeGreaterThanOrEqual(
        1,
      );
    });

    // CP-BE-ONB-015
    it('rechazar sin motivo -> 400 con el campo rejectionReason y el documento sigue PENDING', async () => {
      const up = unwrap(
        (await uploadDoc(proA.user.token, qual.referenceId).expect(201)).body,
      );
      const noReason = await review(up.referenceId, { status: 'REJECTED' });
      expect(noReason.status).toBe(400);
      expect((noReason.body.error.errors as any[]).map((e) => e.field)).toContain(
        'rejectionReason',
      );
      const rows = unwrap(
        (
          await http
            .get(`${PREFIX}/professionals/me/documents`)
            .set(bearer(proA.user.token))
        ).body,
      ).data as any[];
      expect(
        rows.find((r) => r.documentType.code === 'QUALIFICATION_CERTIFICATE')
          .document.status,
      ).toBe('PENDING');
      await review(up.referenceId, {
        status: 'REJECTED',
        rejectionReason: 'ilegible',
      }).expect(200);
    });

    // CP-BE-ONB-031
    it.failing('DEF-BE-016: rechazar con motivo vacío o solo espacios debe dar 400 y no cambiar el estado', async () => {
      const up = unwrap(
        (await uploadDoc(proA.user.token, qual.referenceId).expect(201)).body,
      );
      const empty = await review(up.referenceId, {
        status: 'REJECTED',
        rejectionReason: '',
      });
      const blank = await review(up.referenceId, {
        status: 'REJECTED',
        rejectionReason: '   ',
      });
      const row = await prisma.professionalDocuments.findUniqueOrThrow({
        where: { referenceId: up.referenceId },
      });
      // limpieza: si el defecto existe el documento quedó REJECTED; no afecta a otros casos
      expect([empty.status, blank.status]).toEqual([400, 400]);
      expect(row.status).toBe('PENDING');
    });

    // CP-BE-ONB-016
    it('un usuario común no puede revisar (403); estado inválido 400, inexistente 404 y doble revisión 409', async () => {
      const up = unwrap(
        (await uploadDoc(proA.user.token, qual.referenceId).expect(201)).body,
      );
      await review(
        up.referenceId,
        { status: 'APPROVED' },
        proA.user.token,
      ).expect(403);
      expect((await review(up.referenceId, { status: 'PENDING' })).status).toBe(
        400,
      );
      expect(
        (
          await review('11111111-1111-4111-8111-111111111111', {
            status: 'APPROVED',
          })
        ).status,
      ).toBe(404);
      await review(up.referenceId, { status: 'APPROVED' }).expect(200);
      const again = await review(up.referenceId, {
        status: 'REJECTED',
        rejectionReason: 'tarde',
      });
      expect(again.status).toBe(409);
    });

    // CP-BE-ONB-017
    it('el rechazo con motivo se refleja en el listado propio y no verifica al profesional', async () => {
      const { user } = await newPro(['DATA_PROCESSING_CONSENT']);
      const t = await typeByCode(user.token, 'BG_CHECK_CRIMINAL_PY');
      const up = unwrap(
        (await uploadDoc(user.token, t.referenceId).expect(201)).body,
      );
      const rej = await review(up.referenceId, {
        status: 'REJECTED',
        rejectionReason: 'Documento vencido',
      }).expect(200);
      expect(unwrap(rej.body).status).toBe('REJECTED');
      expect(unwrap(rej.body).rejectionReason).toBe('Documento vencido');
      const mine = unwrap(
        (
          await http
            .get(`${PREFIX}/professionals/me/documents`)
            .set(bearer(user.token))
        ).body,
      ).data as any[];
      const row = mine.find(
        (r) => r.documentType.code === 'BG_CHECK_CRIMINAL_PY',
      );
      expect(row.document.status).toBe('REJECTED');
      expect(row.document.rejectionReason).toBe('Documento vencido');
      expect((await myProfile(user.token)).requiredDocumentsVerified).toBe(
        false,
      );
    });

    // CP-BE-ONB-018
    it('requiredDocumentsVerified se recalcula tras cada revisión: false con 1 de N aprobados, true con todos, estable al rechazar uno no requerido', async () => {
      const { user } = await newPro(['DATA_PROCESSING_CONSENT']);
      const required = (await docTypes(user.token)).filter((t) => t.isRequired);
      expect(required.length).toBeGreaterThanOrEqual(2);
      const uploaded: string[] = [];
      for (const t of required) {
        uploaded.push(
          unwrap(
            (await uploadDoc(user.token, t.referenceId).expect(201)).body,
          ).referenceId,
        );
      }
      expect((await myProfile(user.token)).requiredDocumentsVerified).toBe(
        false,
      );
      for (let i = 0; i < uploaded.length; i++) {
        await review(uploaded[i], { status: 'APPROVED' }).expect(200);
        const verified = (await myProfile(user.token))
          .requiredDocumentsVerified;
        expect(verified).toBe(i === uploaded.length - 1);
      }
      const opt = await typeByCode(user.token, 'QUALIFICATION_CERTIFICATE');
      const o = unwrap(
        (await uploadDoc(user.token, opt.referenceId).expect(201)).body,
      );
      await review(o.referenceId, {
        status: 'REJECTED',
        rejectionReason: 'borroso',
      }).expect(200);
      expect((await myProfile(user.token)).requiredDocumentsVerified).toBe(
        true,
      );
    });

    // CP-BE-ONB-019
    it('el endpoint público solo muestra documentos APROBADOS de tipos visibles al cliente', async () => {
      const { user, pro } = await newPro(['DATA_PROCESSING_CONSENT']);
      const q = await typeByCode(user.token, 'QUALIFICATION_CERTIFICATE');
      const c = await typeByCode(user.token, 'BG_CHECK_CRIMINAL_PY');
      const dq = unwrap(
        (await uploadDoc(user.token, q.referenceId).expect(201)).body,
      );
      const dc = unwrap(
        (await uploadDoc(user.token, c.referenceId).expect(201)).body,
      );
      const pub = async () =>
        (
          unwrap(
            (
              await http
                .get(
                  `${PREFIX}/professionals/${pro.referenceId}/documents/public`,
                )
                .set(bearer(clienteA))
                .expect(200)
            ).body,
          ).data as any[]
        ).map((d) => d.referenceId);
      expect(await pub()).toEqual([]);
      await review(dq.referenceId, { status: 'APPROVED' }).expect(200);
      await review(dc.referenceId, { status: 'APPROVED' }).expect(200);
      const ids = await pub();
      expect(ids).toContain(dq.referenceId);
      expect(ids).not.toContain(dc.referenceId);
    });

    // CP-BE-ONB-020
    it('expiración: el job vence el documento aprobado y recalcula requiredDocumentsVerified (run() invocado directo)', async () => {
      const { user } = await newPro(['DATA_PROCESSING_CONSENT']);
      const required = (await docTypes(user.token)).filter((t) => t.isRequired);
      const ids: string[] = [];
      for (const t of required) {
        const d = unwrap(
          (await uploadDoc(user.token, t.referenceId).expect(201)).body,
        );
        await review(d.referenceId, { status: 'APPROVED' }).expect(200);
        ids.push(d.referenceId);
      }
      expect((await myProfile(user.token)).requiredDocumentsVerified).toBe(
        true,
      );
      await prisma.professionalDocuments.update({
        where: { referenceId: ids[0] },
        data: { expiresAt: new Date(Date.now() - 24 * 3600 * 1000) },
      });
      await ctx.app.get(ProfessionalDocumentsExpirationJob).run();
      const row = await prisma.professionalDocuments.findUniqueOrThrow({
        where: { referenceId: ids[0] },
      });
      expect(row.status).toBe('EXPIRED');
      const others = await prisma.professionalDocuments.findUniqueOrThrow({
        where: { referenceId: ids[1] },
      });
      expect(others.status).toBe('APPROVED');
      expect((await myProfile(user.token)).requiredDocumentsVerified).toBe(
        false,
      );
    });
  });

  describe('verify / suspend de profesionales', () => {
    const verify = (
      id: number,
      token: string,
      body: Record<string, unknown> = { isVerified: true },
    ) =>
      http
        .post(`${PREFIX}/professionals/${id}/verify`)
        .set(bearer(token))
        .send(body);
    const suspend = (
      id: number,
      token: string,
      body: Record<string, unknown> = { reason: 'Incumplimiento' },
    ) =>
      http
        .post(`${PREFIX}/professionals/${id}/suspend`)
        .set(bearer(token))
        .send(body);

    // CP-BE-ONB-021
    it('sin permiso (cliente, el propio profesional postulado) verify y suspend -> 403 y el estado no cambia', async () => {
      const { user, pro } = await newPro();
      for (const token of [clienteA, user.token]) {
        expect((await verify(pro.id, token)).status).toBe(403);
        expect((await suspend(pro.id, token)).status).toBe(403);
      }
      const me = await myProfile(user.token);
      expect(me.status).toBe('PENDING');
      expect(me.verificationStatus).toBe('UNVERIFIED');
    });

    // CP-BE-ONB-022
    it('admin verifica: APPROVED + VERIFIED; admin rechaza: REJECTED; id inexistente 404; sin JWT 401', async () => {
      const { user, pro } = await newPro();
      const ok = await verify(pro.id, admin, {
        isVerified: true,
        notes: 'ok',
      }).expect(201);
      expect(unwrap(ok.body).status).toBe('APPROVED');
      expect(unwrap(ok.body).verificationStatus).toBe('VERIFIED');
      expect((await myProfile(user.token)).status).toBe('APPROVED');

      const other = await newPro();
      const rej = await verify(other.pro.id, admin, {
        isVerified: false,
        notes: 'docs falsos',
      }).expect(201);
      expect(unwrap(rej.body).status).toBe('REJECTED');
      expect(unwrap(rej.body).verificationStatus).toBe('REJECTED');

      expect((await verify(99999999, admin)).status).toBe(404);
      await http
        .post(`${PREFIX}/professionals/${pro.id}/verify`)
        .send({ isVerified: true })
        .expect(401);
    });

    // CP-BE-ONB-023
    it('suspender exige motivo (400) y deja SUSPENDED/isActive=false', async () => {
      const { user, pro } = await newPro();
      await verify(pro.id, admin).expect(201);
      expect((await suspend(pro.id, admin, {})).status).toBe(400);
      const s = await suspend(pro.id, admin, {
        reason: 'Conducta inapropiada',
      }).expect(201);
      expect(unwrap(s.body).status).toBe('SUSPENDED');
      expect(unwrap(s.body).isActive).toBe(false);
      expect(unwrap(s.body).changedReason).toBe('Conducta inapropiada');
      expect((await myProfile(user.token)).status).toBe('SUSPENDED');
    });

    // CP-BE-ONB-032
    it.failing('DEF-BE-017: suspender con motivo solo espacios debe dar 400 y no suspender', async () => {
      const { user, pro } = await newPro();
      await verify(pro.id, admin).expect(201);
      const res = await suspend(pro.id, admin, { reason: '   ' });
      const status = (await myProfile(user.token)).status;
      expect(res.status).toBe(400);
      expect(status).toBe('APPROVED');
    });

    // CP-BE-ONB-024
    it.failing('DEF-BE-018: GET /locations/nearby no debe dar 500 y un profesional suspendido desaparece de /locations/nearby y de la lista de disponibles', async () => {
      const { user, pro } = await newPro();
      await verify(pro.id, admin).expect(201);
      const lat = -25.3 + Math.random() * 0.001;
      const lng = -57.6 + Math.random() * 0.001;
      await http
        .post(`${PREFIX}/professionals/${pro.id}/availability`)
        .set(bearer(user.token))
        .send({ isAvailable: true })
        .expect(201);
      await http
        .post(`${PREFIX}/locations/update`)
        .set(bearer(user.token))
        .send({ latitude: lat, longitude: lng })
        .expect(200);
      await http
        .patch(`${PREFIX}/locations/online`)
        .set(bearer(user.token))
        .send({ isOnline: true })
        .expect(200);

      const nearbyIds = async () =>
        (
          unwrap(
            (
              await http
                .get(`${PREFIX}/locations/nearby`)
                .query({ latitude: lat, longitude: lng, radius: 5 })
                .set(bearer(clienteA))
                .expect(200)
            ).body,
          ) as any[]
        ).map((p) => p.referenceId);
      const availableIds = async () =>
        (
          unwrap(
            (
              await http
                .get(`${PREFIX}/professionals`)
                .query({ isAvailable: true, pageSize: 100 })
                .set(bearer(clienteA))
                .expect(200)
            ).body,
          ).data as any[]
        ).map((p) => p.referenceId);
      expect(await nearbyIds()).toContain(pro.referenceId);
      expect(await availableIds()).toContain(pro.referenceId);

      await suspend(pro.id, admin).expect(201);
      expect(await nearbyIds()).not.toContain(pro.referenceId);
      expect(await availableIds()).not.toContain(pro.referenceId);
    });
  });

  describe('Portafolio de trabajos', () => {
    let owner: Awaited<ReturnType<typeof newPro>>;
    const upload = (token: string, caption = 'trabajo') =>
      http
        .post(`${PREFIX}/professionals/me/portfolio`)
        .set(bearer(token))
        .field('caption', caption)
        .attach('file', tinyPng(), {
          filename: `foto-${uniqueSuffix()}.png`,
          contentType: 'image/png',
        });
    const mine = async (token: string) =>
      unwrap(
        (
          await http
            .get(`${PREFIX}/professionals/me/portfolio`)
            .set(bearer(token))
            .expect(200)
        ).body,
      ).data as any[];
    const pub = async (ref: string) =>
      (
        unwrap(
          (
            await http
              .get(`${PREFIX}/professionals/${ref}/portfolio/public`)
              .set(bearer(clienteA))
              .expect(200)
          ).body,
        ).data as any[]
      ).map((i) => i.referenceId);
    const approve = (ref: string) =>
      http
        .patch(`${PREFIX}/admin/professional-portfolio/${ref}/review`)
        .set(bearer(admin))
        .send({ status: 'APPROVED' });
    const patch = (token: string, ref: string, body: Record<string, unknown>) =>
      http
        .patch(`${PREFIX}/professionals/me/portfolio/${ref}`)
        .set(bearer(token))
        .send(body);

    beforeAll(async () => {
      owner = await newPro();
    });

    // CP-BE-ONB-025
    it('subir al portafolio exige IMAGE_USAGE_CONSENT (403 CONSENT_REQUIRED) y con él queda PENDING y visible', async () => {
      const blocked = await upload(owner.user.token);
      expect(blocked.status).toBe(403);
      expect(blocked.body.error.errorCode).toBe('CONSENT_REQUIRED');
      await acceptConsent(http, owner.user.token, 'DATA_PROCESSING_CONSENT');
      expect((await upload(owner.user.token)).status).toBe(403);
      await acceptConsent(http, owner.user.token, 'IMAGE_USAGE_CONSENT');
      const ok = await upload(owner.user.token, 'primera').expect(201);
      expect(unwrap(ok.body).status).toBe('PENDING');
      expect(unwrap(ok.body).isVisible).toBe(true);
      expect(unwrap(ok.body).caption).toBe('primera');
    });

    // CP-BE-ONB-026
    it('rechaza archivos que no son imagen (PDF) con 400', async () => {
      const res = await http
        .post(`${PREFIX}/professionals/me/portfolio`)
        .set(bearer(owner.user.token))
        .attach('file', tinyPdf(), {
          filename: 'x.pdf',
          contentType: 'application/pdf',
        });
      expect(res.status).toBe(400);
    });

    // CP-BE-ONB-027
    it('PENDING no aparece en el endpoint público; aprobado sí; ocultar (isVisible:false) lo saca; mostrar lo devuelve', async () => {
      const item = unwrap((await upload(owner.user.token, 'pub')).body);
      expect(await pub(owner.pro.referenceId)).not.toContain(item.referenceId);
      await approve(item.referenceId).expect(200);
      expect(await pub(owner.pro.referenceId)).toContain(item.referenceId);

      await patch(owner.user.token, item.referenceId, {
        isVisible: false,
      }).expect(200);
      expect(await pub(owner.pro.referenceId)).not.toContain(item.referenceId);
      expect((await mine(owner.user.token)).map((i) => i.referenceId)).toContain(
        item.referenceId,
      );

      await patch(owner.user.token, item.referenceId, {
        isVisible: true,
      }).expect(200);
      expect(await pub(owner.pro.referenceId)).toContain(item.referenceId);
    });

    // CP-BE-ONB-028
    it('reordenar por sortOrder cambia el orden del listado propio y del público', async () => {
      const a = unwrap((await upload(owner.user.token, 'a')).body);
      const b = unwrap((await upload(owner.user.token, 'b')).body);
      const c = unwrap((await upload(owner.user.token, 'c')).body);
      for (const i of [a, b, c]) await approve(i.referenceId).expect(200);
      await patch(owner.user.token, a.referenceId, { sortOrder: 900 }).expect(
        200,
      );
      await patch(owner.user.token, b.referenceId, { sortOrder: 901 }).expect(
        200,
      );
      await patch(owner.user.token, c.referenceId, { sortOrder: 899 }).expect(
        200,
      );
      const only = (ids: string[]) =>
        ids.filter((x) => [a, b, c].some((i) => i.referenceId === x));
      const expected = [c, a, b].map((i) => i.referenceId);
      expect(
        only((await mine(owner.user.token)).map((i) => i.referenceId)),
      ).toEqual(expected);
      expect(only(await pub(owner.pro.referenceId))).toEqual(expected);
      expect(
        (await patch(owner.user.token, a.referenceId, { sortOrder: 'x' }))
          .status,
      ).toBe(400);
    });

    // CP-BE-ONB-029
    it('borrar quita el item del listado propio y del público; ajeno -> 403; ya borrado -> 404', async () => {
      const item = unwrap((await upload(owner.user.token, 'borrar')).body);
      await approve(item.referenceId).expect(200);
      const other = await newPro(['IMAGE_USAGE_CONSENT']);
      expect(
        (await patch(other.user.token, item.referenceId, { caption: 'robo' }))
          .status,
      ).toBe(403);
      await http
        .delete(`${PREFIX}/professionals/me/portfolio/${item.referenceId}`)
        .set(bearer(other.user.token))
        .expect(403);
      await http
        .delete(`${PREFIX}/professionals/me/portfolio/${item.referenceId}`)
        .set(bearer(owner.user.token))
        .expect(200);
      expect(
        (await mine(owner.user.token)).map((i) => i.referenceId),
      ).not.toContain(item.referenceId);
      expect(await pub(owner.pro.referenceId)).not.toContain(item.referenceId);
      await http
        .delete(`${PREFIX}/professionals/me/portfolio/${item.referenceId}`)
        .set(bearer(owner.user.token))
        .expect(404);
    });

    // CP-BE-ONB-030
    it('la revisión de portafolio exige permiso y motivo al rechazar; un item rechazado no es público ni re-revisable', async () => {
      const item = unwrap((await upload(owner.user.token, 'rev')).body);
      await http
        .patch(
          `${PREFIX}/admin/professional-portfolio/${item.referenceId}/review`,
        )
        .set(bearer(owner.user.token))
        .send({ status: 'APPROVED' })
        .expect(403);
      const noReason = await http
        .patch(
          `${PREFIX}/admin/professional-portfolio/${item.referenceId}/review`,
        )
        .set(bearer(admin))
        .send({ status: 'REJECTED' });
      expect(noReason.status).toBe(400);
      await http
        .patch(
          `${PREFIX}/admin/professional-portfolio/${item.referenceId}/review`,
        )
        .set(bearer(admin))
        .send({ status: 'REJECTED', rejectionReason: 'no se ve el trabajo' })
        .expect(200);
      expect(await pub(owner.pro.referenceId)).not.toContain(item.referenceId);
      expect((await approve(item.referenceId)).status).toBe(409);
    });
  });
});
