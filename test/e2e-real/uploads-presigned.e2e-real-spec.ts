/* eslint-disable */
/**
 * Suite: autorización de archivos en S3/MinIO (GET /uploads/presigned-url, GET /uploads/info/:filename y
 * DELETE /uploads/:filename): el dueño del archivo se resuelve desde la DB (registro que referencia la key),
 * nunca desde la key.
 * Casos: CP-BE-UPL-001..018 (ver test/qa/casos/CP-UPL.md)
 * Tipo: e2e   Prioridad: P0
 * Precondiciones: pnpm e2e:up + e2e:seed; fixtures admin, cliente_a y cliente_b; MinIO real. Los profesionales,
 *        documentos, fotos y servicios se crean por API en cada corrida.
 * Trazabilidad: M3/M9 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3); DEF-BE-024, DEF-BE-025;
 *        auditoría de IDOR de /services/:id/progress y /budget-options (sin defectos: casos de regresión).
 */
import { PrismaClient } from '@prisma/client';
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
  ApprovedPro,
  createApprovedPro,
  createService,
  firstServiceTypeId,
  plomeriaCategoryId,
  registerUser,
  tinyPdf,
  tinyPng,
} from './helpers/w2';

describe('Autorización de archivos S3 (e2e real)', () => {
  let ctx: E2eApp;
  let http: E2eApp['http'];
  let admin: string;
  let clienteA: string;
  let clienteB: string;
  let categoryId: number;
  let serviceTypeId: number;
  let pro: ApprovedPro; // dueño de documentos y portafolio
  let otherPro: ApprovedPro;
  let docKey: string; // BG_CHECK (privado, PENDING)
  let docBytes: Buffer;
  let publicDocKey: string; // QUALIFICATION aprobado y visible al cliente
  let privateApprovedDocKey: string; // BG_CHECK aprobado, no visible al cliente
  let pendingPortfolioKey: string;
  let publicPortfolioKey: string;
  let hiddenPortfolioKey: string;
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  const presigned = (token: string, key: string) =>
    http
      .get(`${PREFIX}/uploads/presigned-url`)
      .query({ key })
      .set(bearer(token));
  const info = (token: string, key: string) =>
    http.get(`${PREFIX}/uploads/info/${key}`).set(bearer(token));
  const remove = (token: string, key: string) =>
    http.delete(`${PREFIX}/uploads/${key}`).set(bearer(token));
  const download = async (url: string) => {
    const res = await fetch(url);
    return { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) };
  };
  const uploadDocument = async (
    token: string,
    code: string,
    file = tinyPdf(),
  ) => {
    const types = unwrap(
      (
        await http
          .get(`${PREFIX}/professional-document-types`)
          .set(bearer(token))
      ).body,
    ).data as any[];
    const type = types.find((t) => t.code === code);
    const res = await http
      .post(`${PREFIX}/professionals/me/documents`)
      .set(bearer(token))
      .field('professionalDocumentTypeReferenceId', type.referenceId)
      .attach('file', file, {
        filename: 'd.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    return { ...unwrap(res.body), bytes: file } as any;
  };
  const approveDoc = (ref: string) =>
    http
      .patch(`${PREFIX}/admin/professional-documents/${ref}/review`)
      .set(bearer(admin))
      .send({ status: 'APPROVED' })
      .expect(200);
  const uploadPortfolio = async (token: string) =>
    unwrap(
      (
        await http
          .post(`${PREFIX}/professionals/me/portfolio`)
          .set(bearer(token))
          .attach('file', tinyPng(), {
            filename: `p-${uniqueSuffix()}.png`,
            contentType: 'image/png',
          })
          .expect(201)
      ).body,
    );
  const approvePortfolio = (ref: string) =>
    http
      .patch(`${PREFIX}/admin/professional-portfolio/${ref}/review`)
      .set(bearer(admin))
      .send({ status: 'APPROVED' })
      .expect(200);
  /** Sube una imagen genérica (POST /uploads/image) y devuelve su key. */
  const uploadImage = async (token: string) =>
    unwrap(
      (
        await http
          .post(`${PREFIX}/uploads/image`)
          .set(bearer(token))
          .attach('file', tinyPng(), {
            filename: `i-${uniqueSuffix()}.png`,
            contentType: 'image/png',
          })
          .expect(201)
      ).body,
    ).key as string;

  beforeAll(async () => {
    ctx = await bootApp();
    http = ctx.http;
    admin = (await login(http, FIXTURE.admin.email, FIXTURE.admin.password))
      .accessToken;
    clienteA = (
      await login(http, FIXTURE.clienteA.email, FIXTURE.clienteA.password)
    ).accessToken;
    clienteB = (
      await login(http, FIXTURE.clienteB.email, FIXTURE.clienteB.password)
    ).accessToken;
    categoryId = await plomeriaCategoryId(http);
    serviceTypeId = await firstServiceTypeId(http);
    pro = await createApprovedPro(http, admin, categoryId);
    otherPro = await createApprovedPro(http, admin, categoryId);
    await acceptConsent(http, pro.token, 'DATA_PROCESSING_CONSENT');
    await acceptConsent(http, pro.token, 'IMAGE_USAGE_CONSENT');

    const d1 = await uploadDocument(pro.token, 'BG_CHECK_CRIMINAL_PY');
    docKey = d1.fileKey;
    docBytes = d1.bytes;
    const d2 = await uploadDocument(pro.token, 'QUALIFICATION_CERTIFICATE');
    publicDocKey = d2.fileKey;
    await approveDoc(d2.referenceId);
    const d3 = await uploadDocument(pro.token, 'BG_CHECK_JUDICIAL_PY');
    privateApprovedDocKey = d3.fileKey;
    await approveDoc(d3.referenceId);

    pendingPortfolioKey = (await uploadPortfolio(pro.token)).fileKey;
    const pub = await uploadPortfolio(pro.token);
    publicPortfolioKey = pub.fileKey;
    await approvePortfolio(pub.referenceId);
    const hid = await uploadPortfolio(pro.token);
    hiddenPortfolioKey = hid.fileKey;
    await approvePortfolio(hid.referenceId);
    await http
      .patch(`${PREFIX}/professionals/me/portfolio/${hid.referenceId}`)
      .set(bearer(pro.token))
      .send({ isVisible: false })
      .expect(200);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await ctx?.close();
  });

  describe('Documentos de identidad del profesional', () => {
    // CP-BE-UPL-001
    it('DEF-BE-024: cliente_b no puede obtener el URL presignado de un documento de un profesional ni descargar sus bytes', async () => {
      const res = await presigned(clienteB, docKey);
      // demostración del defecto: con el URL se bajan los bytes reales del documento
      const leaked =
        res.status === 200
          ? (await download(unwrap(res.body).url)).bytes.equals(docBytes)
          : false;
      expect(leaked).toBe(false);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    // CP-BE-UPL-002
    it('DEF-BE-024: otro profesional tampoco puede; el dueño y el admin sí, con los mismos bytes', async () => {
      expect((await presigned(otherPro.token, docKey)).status).toBe(403);
      for (const token of [pro.token, admin]) {
        const res = await presigned(token, docKey);
        expect(res.status).toBe(200);
        const got = await download(unwrap(res.body).url);
        expect(got.status).toBe(200);
        expect(got.bytes.equals(docBytes)).toBe(true);
      }
    });

    // CP-BE-UPL-003
    it('DEF-BE-024: un documento aprobado y visible al cliente lo ve cualquier autenticado; uno aprobado no visible, no', async () => {
      expect((await presigned(clienteB, publicDocKey)).status).toBe(200);
      expect((await presigned(clienteB, privateApprovedDocKey)).status).toBe(
        403,
      );
    });

    // CP-BE-UPL-004
    it('DEF-BE-024: GET /uploads/info/:filename aplica la misma regla', async () => {
      expect((await info(clienteB, docKey)).status).toBe(403);
      expect((await info(pro.token, docKey)).status).toBe(200);
    });
  });

  describe('Portafolio', () => {
    // CP-BE-UPL-005
    it('DEF-BE-024: una foto PENDING u oculta (isVisible:false) solo la ven el dueño y el admin', async () => {
      for (const key of [pendingPortfolioKey, hiddenPortfolioKey]) {
        expect((await presigned(clienteB, key)).status).toBe(403);
        expect((await presigned(pro.token, key)).status).toBe(200);
        expect((await presigned(admin, key)).status).toBe(200);
      }
    });

    // CP-BE-UPL-006
    it('una foto aprobada y visible la ve cualquier usuario autenticado y los bytes se descargan', async () => {
      const res = await presigned(clienteB, publicPortfolioKey);
      expect(res.status).toBe(200);
      expect((await download(unwrap(res.body).url)).status).toBe(200);
    });
  });

  describe('Avatar, claves no referenciadas, TTL y sin JWT', () => {
    // CP-BE-UPL-007
    it('el avatar de un usuario lo ve cualquier autenticado', async () => {
      const user = await registerUser(http, 'avatar');
      const up = await http
        .post(`${PREFIX}/uploads/avatar`)
        .set(bearer(user.token))
        .attach('file', tinyPng(), {
          filename: 'a.png',
          contentType: 'image/png',
        })
        .expect(201);
      const key = unwrap(up.body).key as string;
      await http
        .put(`${PREFIX}/auth/me`)
        .set(bearer(user.token))
        .send({ avatarKey: key })
        .expect(200);
      expect((await presigned(clienteB, key)).status).toBe(200);
    });

    // CP-BE-UPL-008
    it('DEF-BE-024: una key que ninguna fila referencia (inventada o recién subida sin guardar) -> 404', async () => {
      expect(
        (await presigned(clienteB, `${uniqueSuffix()}${uniqueSuffix()}.pdf`))
          .status,
      ).toBe(404);
      const loose = await uploadImage(clienteB);
      expect((await presigned(clienteB, loose)).status).toBe(404);
      expect((await presigned(admin, loose)).status).toBe(404);
    });

    // CP-BE-UPL-009
    it('DEF-BE-024: el URL presignado expira en 5 minutos como máximo', async () => {
      const url = unwrap((await presigned(pro.token, docKey)).body)
        .url as string;
      const expires = Number(new URL(url).searchParams.get('X-Amz-Expires'));
      expect(expires).toBeGreaterThan(0);
      expect(expires).toBeLessThanOrEqual(300);
    });

    // CP-BE-UPL-010
    it('sin JWT o sin key -> 401 / 400', async () => {
      await http
        .get(`${PREFIX}/uploads/presigned-url`)
        .query({ key: docKey })
        .expect(401);
      await http.get(`${PREFIX}/uploads/info/${docKey}`).expect(401);
      await http.delete(`${PREFIX}/uploads/${docKey}`).expect(401);
      expect(
        (
          await http
            .get(`${PREFIX}/uploads/presigned-url`)
            .set(bearer(clienteB))
        ).status,
      ).toBe(400);
    });
  });

  describe('Fotos de servicio y de bitácora', () => {
    let client: string;
    let serviceRef: string;
    let serviceImage: string;
    let progressImage: string;
    let assigned: ApprovedPro;

    beforeAll(async () => {
      client = (await registerUser(http, 'cli')).token;
      assigned = await createApprovedPro(http, admin, categoryId);
      await acceptConsent(http, assigned.token, 'IMAGE_USAGE_CONSENT');
      serviceImage = await uploadImage(client);
      const svc = unwrap(
        (
          await createService(http, client, categoryId, serviceTypeId, {
            images: [serviceImage],
          }).expect(201)
        ).body,
      );
      serviceRef = svc.referenceId;
    });

    // CP-BE-UPL-011
    it('DEF-BE-024: la foto de un servicio PENDING la ven el cliente, un profesional aprobado y el admin; no un tercero', async () => {
      expect((await presigned(client, serviceImage)).status).toBe(200);
      expect((await presigned(assigned.token, serviceImage)).status).toBe(200);
      expect((await presigned(admin, serviceImage)).status).toBe(200);
      expect((await presigned(clienteB, serviceImage)).status).toBe(403);
    });

    // CP-BE-UPL-012
    it('DEF-BE-024: tras asignarse, la foto del servicio y las de la bitácora solo las ven el cliente, el profesional asignado y el admin', async () => {
      await http
        .post(`${PREFIX}/services/${serviceRef}/accept`)
        .set(bearer(assigned.token))
        .expect(201);
      await http
        .post(`${PREFIX}/services/${serviceRef}/start`)
        .set(bearer(assigned.token))
        .expect(201);
      progressImage = await uploadImage(assigned.token);
      await http
        .post(`${PREFIX}/services/${serviceRef}/progress`)
        .set(bearer(assigned.token))
        .send({ note: 'avance', images: [progressImage] })
        .expect(201);
      for (const key of [serviceImage, progressImage]) {
        expect((await presigned(client, key)).status).toBe(200);
        expect((await presigned(assigned.token, key)).status).toBe(200);
        expect((await presigned(admin, key)).status).toBe(200);
        expect((await presigned(clienteB, key)).status).toBe(403);
        expect((await presigned(otherPro.token, key)).status).toBe(403);
      }
    });

    // CP-BE-UPL-013
    it('DEF-BE-024: adjuntar la key de un documento ajeno a una entrada de bitácora no da acceso a ese documento', async () => {
      const svc = unwrap(
        (
          await createService(http, clienteA, categoryId, serviceTypeId).expect(
            201,
          )
        ).body,
      );
      await http
        .post(`${PREFIX}/services/${svc.referenceId}/accept`)
        .set(bearer(assigned.token))
        .expect(201);
      await http
        .post(`${PREFIX}/services/${svc.referenceId}/start`)
        .set(bearer(assigned.token))
        .expect(201);
      await http
        .post(`${PREFIX}/services/${svc.referenceId}/progress`)
        .set(bearer(assigned.token))
        .send({ note: 'forjado', images: [docKey] });
      expect((await presigned(assigned.token, docKey)).status).toBe(403);
      expect((await presigned(clienteA, docKey)).status).toBe(403);
    });
  });

  describe('Borrado de archivos', () => {
    // CP-BE-UPL-014
    it('DEF-BE-025: cliente_b no puede borrar un documento ajeno (403) y el archivo sigue ahí', async () => {
      const d = await uploadDocument(pro.token, 'QUALIFICATION_CERTIFICATE');
      const res = await remove(clienteB, d.fileKey);
      expect(res.status).toBe(403);
      expect((await presigned(pro.token, d.fileKey)).status).toBe(200);
      const got = await download(
        unwrap((await presigned(pro.token, d.fileKey)).body).url,
      );
      expect(got.status).toBe(200);
    });

    // CP-BE-UPL-015
    it('DEF-BE-025: borrar una key no referenciada -> 404', async () => {
      expect(
        (await remove(clienteB, `${uniqueSuffix()}${uniqueSuffix()}.pdf`))
          .status,
      ).toBe(404);
    });

    // CP-BE-UPL-016
    it('el dueño y el admin pueden borrar el archivo', async () => {
      const d = await uploadDocument(pro.token, 'QUALIFICATION_CERTIFICATE');
      await remove(pro.token, d.fileKey).expect(200);
      const d2 = await uploadDocument(pro.token, 'QUALIFICATION_CERTIFICATE');
      await remove(admin, d2.fileKey).expect(200);
    });
  });

  describe('Auditoría de IDOR en /services/:id/progress y /budget-options (regresión)', () => {
    let svcRef: string;
    let reqRef: string;
    let owner: string;
    let assigned: ApprovedPro;
    let offerPro: ApprovedPro;

    beforeAll(async () => {
      owner = (await registerUser(http, 'own')).token;
      assigned = await createApprovedPro(http, admin, categoryId);
      offerPro = await createApprovedPro(http, admin, categoryId);
      const svc = unwrap(
        (
          await createService(http, owner, categoryId, serviceTypeId).expect(
            201,
          )
        ).body,
      );
      svcRef = svc.referenceId;
      const req = unwrap(
        (
          await http
            .post(`${PREFIX}/services/${svcRef}/requests`)
            .set(bearer(assigned.token))
            .send({ proposedPrice: 1000 })
            .expect(201)
        ).body,
      );
      reqRef = req.referenceId;
      await http
        .put(`${PREFIX}/services/${svcRef}/requests/${reqRef}`)
        .set(bearer(owner))
        .send({ status: 'ACCEPTED' })
        .expect(200);
      await http
        .post(`${PREFIX}/services/${svcRef}/start`)
        .set(bearer(assigned.token))
        .expect(201);
      await http
        .post(`${PREFIX}/services/${svcRef}/progress`)
        .set(bearer(assigned.token))
        .send({ note: 'primer avance' })
        .expect(201);
    });

    // CP-BE-UPL-017
    it('bitácora: un tercero (cliente_b, otro profesional) no puede leer ni escribir; el dueño, el asignado y el admin leen', async () => {
      const progress = `${PREFIX}/services/${svcRef}/progress`;
      for (const token of [clienteB, offerPro.token]) {
        expect((await http.get(progress).set(bearer(token))).status).toBe(403);
        expect(
          (await http.post(progress).set(bearer(token)).send({ note: 'x' }))
            .status,
        ).toBe(403);
      }
      // el cliente dueño lee pero no escribe
      expect((await http.get(progress).set(bearer(owner))).status).toBe(200);
      expect(
        (await http.post(progress).set(bearer(owner)).send({ note: 'x' }))
          .status,
      ).toBe(403);
      for (const token of [assigned.token, admin]) {
        expect((await http.get(progress).set(bearer(token))).status).toBe(200);
      }
      // borrar la entrada de otro: 403
      const entry = unwrap((await http.get(progress).set(bearer(owner))).body)
        .data[0];
      expect(
        (
          await http
            .delete(`${progress}/${entry.referenceId}`)
            .set(bearer(clienteB))
        ).status,
      ).toBe(403);
      expect(
        (
          await http
            .delete(`${progress}/${entry.referenceId}`)
            .set(bearer(offerPro.token))
        ).status,
      ).toBe(403);
    });

    // CP-BE-UPL-018
    it('presupuestos: un tercero no puede leer, reemplazar ni elegir opciones; solo el autor edita y solo el cliente dueño elige', async () => {
      // el servicio ya está asignado: usar una oferta PENDING de otro servicio
      const svc2 = unwrap(
        (
          await createService(http, owner, categoryId, serviceTypeId).expect(
            201,
          )
        ).body,
      );
      const req2 = unwrap(
        (
          await http
            .post(`${PREFIX}/services/${svc2.referenceId}/requests`)
            .set(bearer(assigned.token))
            .send({ proposedPrice: 1 })
            .expect(201)
        ).body,
      );
      const base = `${PREFIX}/services/${svc2.referenceId}/requests/${req2.referenceId}/budget-options`;
      const body = {
        options: [
          {
            label: 'A',
            lineItems: [
              {
                itemType: 'LABOR',
                description: 'mano de obra',
                quantity: 1,
                unitPrice: 100,
              },
            ],
          },
        ],
      };
      for (const token of [clienteB, offerPro.token]) {
        expect((await http.get(base).set(bearer(token))).status).toBe(403);
        expect(
          (await http.put(base).set(bearer(token)).send(body)).status,
        ).toBe(403);
        expect(
          (
            await http
              .patch(`${base}/${req2.referenceId}/select`)
              .set(bearer(token))
          ).status,
        ).toBe(403);
      }
      // el cliente dueño no puede escribir las opciones del profesional
      expect((await http.put(base).set(bearer(owner)).send(body)).status).toBe(
        403,
      );
      // autor: reemplaza; luego lee el dueño
      const put = await http.put(base).set(bearer(assigned.token)).send(body);
      expect(put.status).toBe(200);
      expect((await http.get(base).set(bearer(owner))).status).toBe(200);
      const optRef = unwrap(put.body).data[0].referenceId;
      // el autor no puede elegir su propia opción
      expect(
        (
          await http
            .patch(`${base}/${optRef}/select`)
            .set(bearer(assigned.token))
        ).status,
      ).toBe(403);
    });
  });
});
