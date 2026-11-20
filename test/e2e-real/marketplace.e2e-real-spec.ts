/* eslint-disable */
/**
 * Suite: M4 Marketplace contra el stack real (ciclo de vida solicitud -> oferta -> ACCEPTED ->
 * IN_PROGRESS -> COMPLETED/CANCELLED, transiciones inválidas, concurrencia 20x, IDOR y alcance de
 * /locations según el estado del servicio).
 * Casos: CP-BE-MKT-001..038 (ver test/qa/casos/CP-MKT.md; ahí está la tabla serviceId vs serviceRequestId)
 * Tipo: e2e   Prioridad: P1
 * Precondiciones: pnpm e2e:up + e2e:seed; fixtures admin, cliente_a y cliente_b. Los profesionales y
 *        servicios se crean por API en cada corrida (datos únicos).
 * Trazabilidad: M4 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3); openspec/specs/e2e-test-plan.md Tier 4;
 *        DEF-BE-019..022.
 */
import {
  bearer,
  bootApp,
  E2eApp,
  FIXTURE,
  login,
  PREFIX,
  unwrap,
} from './helpers/e2e-app';
import {
  applyAsProfessional,
  ApprovedPro,
  createApprovedPro,
  createService,
  firstServiceTypeId,
  plomeriaCategoryId,
  registerUser,
} from './helpers/w2';

const UNKNOWN_UUID = '11111111-1111-4111-8111-111111111111';

describe('M4 Marketplace (e2e real)', () => {
  let ctx: E2eApp;
  let http: E2eApp['http'];
  let admin: string;
  let clienteA: string;
  let clienteB: string;
  let categoryId: number;
  let serviceTypeId: number;
  let proX: ApprovedPro;
  let proY: ApprovedPro;

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
    proX = await createApprovedPro(http, admin, categoryId);
    proY = await createApprovedPro(http, admin, categoryId);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  // ---- helpers ----
  const newService = async (token = clienteA, extra = {}) =>
    unwrap(
      (
        await createService(
          http,
          token,
          categoryId,
          serviceTypeId,
          extra,
        ).expect(201)
      ).body,
    );
  const getService = (id: string, token = clienteA) =>
    http.get(`${PREFIX}/services/${id}`).set(bearer(token));
  const accept = (id: string, token: string) =>
    http.post(`${PREFIX}/services/${id}/accept`).set(bearer(token));
  const start = (id: string, token: string) =>
    http.post(`${PREFIX}/services/${id}/start`).set(bearer(token));
  const complete = (id: string, token: string) =>
    http.post(`${PREFIX}/services/${id}/complete`).set(bearer(token));
  const cancel = (
    id: string,
    token: string,
    body: Record<string, unknown> = { reason: 'Ya no lo necesito' },
  ) => http.delete(`${PREFIX}/services/${id}`).set(bearer(token)).send(body);
  const offer = (
    id: string,
    token: string,
    body: Record<string, unknown> = {
      proposedPrice: 80000,
      message: 'Puedo hoy',
    },
  ) =>
    http
      .post(`${PREFIX}/services/${id}/requests`)
      .set(bearer(token))
      .send(body);
  const respond = (
    id: string,
    requestId: string,
    token: string,
    status: string,
  ) =>
    http
      .put(`${PREFIX}/services/${id}/requests/${requestId}`)
      .set(bearer(token))
      .send({ status });
  const status = async (id: string) =>
    unwrap((await getService(id).expect(200)).body).status;
  const assertEnvelope = (res: { body: any }) => {
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error.message).toBe('string');
    expect(typeof res.body.error.code).toBe('number');
  };

  /** servicio -> oferta -> el cliente acepta la oferta de `pro` => ACCEPTED */
  const acceptedVia = async (pro: ApprovedPro, token = clienteA) => {
    const svc = await newService(token);
    const req = unwrap(
      (await offer(svc.referenceId, pro.token).expect(201)).body,
    );
    await respond(svc.referenceId, req.referenceId, token, 'ACCEPTED').expect(
      200,
    );
    return { svc, req };
  };

  describe('Ciclo de vida feliz', () => {
    // CP-BE-MKT-001
    it('el cliente publica una solicitud: queda PENDING, sin profesional, con UUID público', async () => {
      const svc = await newService();
      expect(svc.status).toBe('PENDING');
      expect(svc.professionalId).toBeNull();
      expect(svc.referenceId).toMatch(/^[0-9a-f-]{36}$/);
      const mine = unwrap(
        (
          await http
            .get(`${PREFIX}/services/my-services`)
            .query({ role: 'client' })
            .set(bearer(clienteA))
            .expect(200)
        ).body,
      ) as any[];
      expect(mine.map((s) => s.referenceId)).toContain(svc.referenceId);
    });

    // CP-BE-MKT-002
    it('oferta del profesional -> el cliente la acepta -> ACCEPTED con el profesional asignado y la oferta ACCEPTED', async () => {
      const { svc, req } = await acceptedVia(proX);
      expect(req.status).toBe('PENDING');
      const after = unwrap(
        (await getService(svc.referenceId).expect(200)).body,
      );
      expect(after.status).toBe('ACCEPTED');
      expect(after.professionalId).toBe(proX.proId);
      const reqs = unwrap(
        (
          await http
            .get(`${PREFIX}/services/${svc.referenceId}/requests`)
            .set(bearer(clienteA))
            .expect(200)
        ).body,
      ).data as any[];
      expect(reqs.find((r) => r.referenceId === req.referenceId).status).toBe(
        'ACCEPTED',
      );
    });

    // CP-BE-MKT-003
    it('start (IN_PROGRESS) y complete (COMPLETED) por el profesional asignado, con startedAt/completedAt y finalAmount', async () => {
      const { svc } = await acceptedVia(proX);
      const started = unwrap(
        (await start(svc.referenceId, proX.token).expect(201)).body,
      );
      expect(started.status).toBe('IN_PROGRESS');
      expect(started.startedAt).toBeTruthy();
      const done = unwrap(
        (await complete(svc.referenceId, proX.token).expect(201)).body,
      );
      expect(done.status).toBe('COMPLETED');
      expect(done.completedAt).toBeTruthy();
      expect(Number(done.finalAmount)).toBeGreaterThanOrEqual(0);
      expect(await status(svc.referenceId)).toBe('COMPLETED');
    });

    // CP-BE-MKT-004
    it('aceptación directa del profesional (POST /services/:id/accept) deja ACCEPTED con él asignado', async () => {
      const svc = await newService();
      const res = await accept(svc.referenceId, proX.token).expect(201);
      expect(unwrap(res.body).status).toBe('ACCEPTED');
      expect(unwrap(res.body).professionalId).toBe(proX.proId);
    });

    // CP-BE-MKT-005
    it('rechazar una oferta la deja REJECTED y el servicio sigue PENDING y abierto a otras ofertas', async () => {
      const svc = await newService();
      const o1 = unwrap(
        (await offer(svc.referenceId, proX.token).expect(201)).body,
      );
      const rej = await respond(
        svc.referenceId,
        o1.referenceId,
        clienteA,
        'REJECTED',
      ).expect(200);
      expect(unwrap(rej.body).status).toBe('REJECTED');
      expect(await status(svc.referenceId)).toBe('PENDING');
      await offer(svc.referenceId, proY.token).expect(201);
    });

    // CP-BE-MKT-040
    it('DEF-BE-027 (descartado): el motivo al rechazar una oferta es opcional; sin motivo, motivo vacio o con motivo -> 200 REJECTED', async () => {
      const svc = await newService();
      const o1 = unwrap(
        (await offer(svc.referenceId, proX.token).expect(201)).body,
      );
      const o2 = unwrap(
        (await offer(svc.referenceId, proY.token).expect(201)).body,
      );
      const noReason = await respond(
        svc.referenceId,
        o1.referenceId,
        clienteA,
        'REJECTED',
      ).expect(200);
      expect(unwrap(noReason.body).status).toBe('REJECTED');
      const emptyReason = await http
        .put(`${PREFIX}/services/${svc.referenceId}/requests/${o2.referenceId}`)
        .set(bearer(clienteA))
        .send({ status: 'REJECTED', reason: '' })
        .expect(200);
      expect(unwrap(emptyReason.body).status).toBe('REJECTED');
      const proZ = await createApprovedPro(http, admin, categoryId);
      const o3 = unwrap(
        (await offer(svc.referenceId, proZ.token).expect(201)).body,
      );
      const withReason = await http
        .put(`${PREFIX}/services/${svc.referenceId}/requests/${o3.referenceId}`)
        .set(bearer(clienteA))
        .send({ status: 'REJECTED', reason: 'Muy caro' })
        .expect(200);
      expect(unwrap(withReason.body).status).toBe('REJECTED');
      expect(await status(svc.referenceId)).toBe('PENDING');
    });

    // CP-BE-MKT-006
    it('al aceptar una oferta, las demás ofertas pendientes pasan a REJECTED', async () => {
      const svc = await newService();
      const ox = unwrap(
        (await offer(svc.referenceId, proX.token).expect(201)).body,
      );
      const oy = unwrap(
        (await offer(svc.referenceId, proY.token).expect(201)).body,
      );
      await respond(
        svc.referenceId,
        ox.referenceId,
        clienteA,
        'ACCEPTED',
      ).expect(200);
      const reqs = unwrap(
        (
          await http
            .get(`${PREFIX}/services/${svc.referenceId}/requests`)
            .set(bearer(clienteA))
            .expect(200)
        ).body,
      ).data as any[];
      expect(reqs.find((r) => r.referenceId === ox.referenceId).status).toBe(
        'ACCEPTED',
      );
      expect(reqs.find((r) => r.referenceId === oy.referenceId).status).toBe(
        'REJECTED',
      );
    });

    // CP-BE-MKT-007
    it('el profesional ve el servicio asignado en my-services?role=professional y el cliente en role=client', async () => {
      const { svc } = await acceptedVia(proX);
      const asPro = unwrap(
        (
          await http
            .get(`${PREFIX}/services/my-services`)
            .query({ role: 'professional', status: 'ACCEPTED' })
            .set(bearer(proX.token))
            .expect(200)
        ).body,
      ) as any[];
      expect(asPro.map((s) => s.referenceId)).toContain(svc.referenceId);
      const asClient = unwrap(
        (
          await http
            .get(`${PREFIX}/services/my-services`)
            .query({ role: 'client' })
            .set(bearer(clienteA))
            .expect(200)
        ).body,
      ) as any[];
      expect(asClient.map((s) => s.referenceId)).toContain(svc.referenceId);
    });
  });

  describe('Cancelación', () => {
    // CP-BE-MKT-008
    it('el cliente cancela un servicio PENDING: CANCELLED con motivo y cancelledAt', async () => {
      const svc = await newService();
      const res = await cancel(svc.referenceId, clienteA, {
        reason: 'Cambié de idea',
      }).expect(200);
      expect(unwrap(res.body).status).toBe('CANCELLED');
      expect(unwrap(res.body).cancellationReason).toBe('Cambié de idea');
      expect(unwrap(res.body).cancelledAt).toBeTruthy();
    });

    // CP-BE-MKT-009
    it('el cliente y el profesional asignado pueden cancelar un servicio ACCEPTED', async () => {
      const a = await acceptedVia(proX);
      expect(
        unwrap((await cancel(a.svc.referenceId, clienteA).expect(200)).body)
          .status,
      ).toBe('CANCELLED');
      const b = await acceptedVia(proX);
      expect(
        unwrap(
          (
            await cancel(b.svc.referenceId, proX.token, {
              reason: 'Imprevisto',
            }).expect(200)
          ).body,
        ).status,
      ).toBe('CANCELLED');
    });

    // CP-BE-MKT-010
    it('cancelar sin motivo -> 400; un tercero (cliente_b, otro profesional) -> 403 y el servicio no cambia', async () => {
      const { svc } = await acceptedVia(proX);
      expect((await cancel(svc.referenceId, clienteA, {})).status).toBe(400);
      for (const token of [clienteB, proY.token]) {
        const res = await cancel(svc.referenceId, token);
        expect(res.status).toBe(403);
        assertEnvelope(res);
      }
      expect(await status(svc.referenceId)).toBe('ACCEPTED');
    });

    // CP-BE-MKT-011
    it('DEF-BE-019: no se puede cancelar un servicio IN_PROGRESS, COMPLETED ni CANCELLED: 409 con envelope uniforme', async () => {
      const { svc } = await acceptedVia(proX);
      await start(svc.referenceId, proX.token).expect(201);
      const inProgress = await cancel(svc.referenceId, clienteA);
      expect(inProgress.status).toBe(409);
      assertEnvelope(inProgress);
      await complete(svc.referenceId, proX.token).expect(201);
      expect((await cancel(svc.referenceId, clienteA)).status).toBe(409);
      expect(await status(svc.referenceId)).toBe('COMPLETED');

      const other = await newService();
      await cancel(other.referenceId, clienteA).expect(200);
      expect((await cancel(other.referenceId, clienteA)).status).toBe(409);
    });
  });

  describe('Transiciones inválidas', () => {
    // CP-BE-MKT-012
    it('DEF-BE-019: completar sin iniciar -> 409 con envelope uniforme', async () => {
      const { svc } = await acceptedVia(proX);
      const res = await complete(svc.referenceId, proX.token);
      expect(res.status).toBe(409);
      assertEnvelope(res);
      expect(await status(svc.referenceId)).toBe('ACCEPTED');
    });

    // CP-BE-MKT-013
    it('DEF-BE-019: iniciar un servicio ya iniciado, o aceptar uno no PENDING -> 409', async () => {
      const { svc } = await acceptedVia(proX);
      await start(svc.referenceId, proX.token).expect(201);
      expect((await start(svc.referenceId, proX.token)).status).toBe(409);
      expect((await accept(svc.referenceId, proY.token)).status).toBe(409);
      await complete(svc.referenceId, proX.token).expect(201);
      expect((await complete(svc.referenceId, proX.token)).status).toBe(409);
    });

    // CP-BE-MKT-014
    it('iniciar un servicio PENDING (sin profesional asignado) -> 403/409, nunca avanza', async () => {
      const svc = await newService();
      const res = await start(svc.referenceId, proX.token);
      expect([403, 409]).toContain(res.status);
      assertEnvelope(res);
      expect(await status(svc.referenceId)).toBe('PENDING');
    });

    // CP-BE-MKT-015
    it('DEF-BE-019: enviar una oferta a un servicio que ya no está PENDING -> 409', async () => {
      const { svc } = await acceptedVia(proX);
      const res = await offer(svc.referenceId, proY.token);
      expect(res.status).toBe(409);
      assertEnvelope(res);
    });

    // CP-BE-MKT-016
    it('DEF-BE-019: la oferta duplicada del mismo profesional -> 409', async () => {
      const svc = await newService();
      await offer(svc.referenceId, proX.token).expect(201);
      const res = await offer(svc.referenceId, proX.token);
      expect(res.status).toBe(409);
    });

    // CP-BE-MKT-017
    it('DEF-BE-020: una oferta ya aceptada no se puede rechazar después (la oferta y el servicio no quedan incoherentes)', async () => {
      const { svc, req } = await acceptedVia(proX);
      const res = await respond(
        svc.referenceId,
        req.referenceId,
        clienteA,
        'REJECTED',
      );
      expect(res.status).toBe(409);
      const reqs = unwrap(
        (
          await http
            .get(`${PREFIX}/services/${svc.referenceId}/requests`)
            .set(bearer(clienteA))
            .expect(200)
        ).body,
      ).data as any[];
      expect(reqs.find((r) => r.referenceId === req.referenceId).status).toBe(
        'ACCEPTED',
      );
    });

    // CP-BE-MKT-018
    it('responder una oferta con un estado distinto de ACCEPTED/REJECTED -> 400 y no la modifica', async () => {
      const svc = await newService();
      const o = unwrap(
        (await offer(svc.referenceId, proX.token).expect(201)).body,
      );
      const res = await respond(
        svc.referenceId,
        o.referenceId,
        clienteA,
        'CANCELLED',
      );
      expect(res.status).toBe(400);
      const reqs = unwrap(
        (
          await http
            .get(`${PREFIX}/services/${svc.referenceId}/requests`)
            .set(bearer(clienteA))
            .expect(200)
        ).body,
      ).data as any[];
      expect(reqs.find((r) => r.referenceId === o.referenceId).status).toBe(
        'PENDING',
      );
    });

    // CP-BE-MKT-019
    it('DEF-BE-019: PUT /services/:id: el dueño edita en PENDING; fuera de PENDING/ACCEPTED -> 409', async () => {
      const svc = await newService();
      const ok = await http
        .put(`${PREFIX}/services/${svc.referenceId}`)
        .set(bearer(clienteA))
        .send({ title: 'Nuevo título' })
        .expect(200);
      expect(unwrap(ok.body).title).toBe('Nuevo título');
      await accept(svc.referenceId, proX.token).expect(201);
      await start(svc.referenceId, proX.token).expect(201);
      const res = await http
        .put(`${PREFIX}/services/${svc.referenceId}`)
        .set(bearer(clienteA))
        .send({ title: 'Tarde' });
      expect(res.status).toBe(409);
    });

    // CP-BE-MKT-020
    it('ids inexistentes o mal formados -> 404 / 400 con envelope uniforme', async () => {
      const notFound = await getService(UNKNOWN_UUID);
      expect(notFound.status).toBe(404);
      assertEnvelope(notFound);
      const badId = await getService('no-es-uuid');
      expect(badId.status).toBe(400);
      assertEnvelope(badId);
      expect((await accept(UNKNOWN_UUID, proX.token)).status).toBe(404);
    });

    // CP-BE-MKT-021
    it('crear una solicitud con datos inválidos (sin título, coordenadas fuera de rango, categoría inexistente) -> 400/404', async () => {
      const bad = await http
        .post(`${PREFIX}/services`)
        .set(bearer(clienteA))
        .send({
          description: 'x',
          categoryId,
          serviceTypeId,
          latitude: 200,
          longitude: 0,
          address: 'a',
        });
      expect(bad.status).toBe(400);
      const fields = (bad.body.error.errors as any[]).map((e) => e.field);
      expect(fields).toEqual(expect.arrayContaining(['title', 'latitude']));
      const noCat = await createService(http, clienteA, 999999, serviceTypeId);
      expect([400, 404]).toContain(noCat.status);
      await http.post(`${PREFIX}/services`).send({}).expect(401);
    });
  });

  describe('Concurrencia: exactamente un ganador, el otro recibe 409 (x20)', () => {
    const ITERATIONS = 20;

    // CP-BE-MKT-022
    it('dos profesionales aceptan el mismo servicio en paralelo: 20/20 con un solo 2xx y un 409', async () => {
      const outcomes: string[] = [];
      for (let i = 0; i < ITERATIONS; i++) {
        const svc = await newService();
        const [rx, ry] = await Promise.all([
          accept(svc.referenceId, proX.token),
          accept(svc.referenceId, proY.token),
        ]);
        const codes = [rx.status, ry.status].sort();
        outcomes.push(codes.join('/'));
        const winner =
          rx.status === 201 ? proX : ry.status === 201 ? proY : null;
        const final = unwrap(
          (await getService(svc.referenceId).expect(200)).body,
        );
        expect(final.status).toBe('ACCEPTED');
        expect(winner).not.toBeNull();
        expect(final.professionalId).toBe(winner!.proId);
      }
      expect(outcomes.filter((o) => o === '201/409')).toHaveLength(ITERATIONS);
    });

    // CP-BE-MKT-023
    it('el mismo profesional acepta dos veces en paralelo: 20/20 con un solo 2xx y un 409', async () => {
      const outcomes: string[] = [];
      for (let i = 0; i < ITERATIONS; i++) {
        const svc = await newService();
        const [a, b] = await Promise.all([
          accept(svc.referenceId, proX.token),
          accept(svc.referenceId, proX.token),
        ]);
        outcomes.push([a.status, b.status].sort().join('/'));
      }
      expect(outcomes.filter((o) => o === '201/409')).toHaveLength(ITERATIONS);
    });

    // CP-BE-MKT-024
    it('el cliente acepta dos ofertas distintas en paralelo: 20/20 con un solo 200 y un 409, y una sola oferta ACCEPTED', async () => {
      const outcomes: string[] = [];
      for (let i = 0; i < ITERATIONS; i++) {
        const svc = await newService();
        const ox = unwrap(
          (await offer(svc.referenceId, proX.token).expect(201)).body,
        );
        const oy = unwrap(
          (await offer(svc.referenceId, proY.token).expect(201)).body,
        );
        const [a, b] = await Promise.all([
          respond(svc.referenceId, ox.referenceId, clienteA, 'ACCEPTED'),
          respond(svc.referenceId, oy.referenceId, clienteA, 'ACCEPTED'),
        ]);
        outcomes.push([a.status, b.status].sort().join('/'));
        const reqs = unwrap(
          (
            await http
              .get(`${PREFIX}/services/${svc.referenceId}/requests`)
              .set(bearer(clienteA))
              .expect(200)
          ).body,
        ).data as any[];
        expect(reqs.filter((r) => r.status === 'ACCEPTED')).toHaveLength(1);
      }
      expect(outcomes.filter((o) => o === '200/409')).toHaveLength(ITERATIONS);
    });
  });

  describe('Autorización (IDOR y roles)', () => {
    // CP-BE-MKT-025
    it('DEF-BE-021: cliente_b no puede ver el detalle de un servicio de cliente_a (403/404)', async () => {
      const svc = await newService(clienteA);
      const res = await getService(svc.referenceId, clienteB);
      expect([403, 404]).toContain(res.status);
      // en cualquier estado
      const { svc: accepted } = await acceptedVia(proX);
      expect([403, 404]).toContain(
        (await getService(accepted.referenceId, clienteB)).status,
      );
    });

    // CP-BE-MKT-026
    it('DEF-BE-021: cliente_b no puede listar las ofertas de un servicio de cliente_a', async () => {
      const svc = await newService(clienteA);
      await offer(svc.referenceId, proX.token).expect(201);
      const res = await http
        .get(`${PREFIX}/services/${svc.referenceId}/requests`)
        .set(bearer(clienteB));
      expect([403, 404]).toContain(res.status);
    });

    // CP-BE-MKT-027
    it('cliente_b no puede editar, cancelar ni responder ofertas de un servicio de cliente_a; el servicio no cambia', async () => {
      const svc = await newService(clienteA);
      const o = unwrap(
        (await offer(svc.referenceId, proX.token).expect(201)).body,
      );
      const put = await http
        .put(`${PREFIX}/services/${svc.referenceId}`)
        .set(bearer(clienteB))
        .send({ title: 'hack' });
      expect([403, 404]).toContain(put.status);
      expect([403, 404]).toContain(
        (await cancel(svc.referenceId, clienteB)).status,
      );
      const resp = await respond(
        svc.referenceId,
        o.referenceId,
        clienteB,
        'ACCEPTED',
      );
      expect([403, 404]).toContain(resp.status);
      const after = unwrap(
        (await getService(svc.referenceId, clienteA).expect(200)).body,
      );
      expect(after.status).toBe('PENDING');
      expect(after.title).not.toBe('hack');
    });

    // CP-BE-MKT-028
    it('my-services de cliente_b no incluye servicios de cliente_a', async () => {
      const svc = await newService(clienteA);
      const mine = unwrap(
        (
          await http
            .get(`${PREFIX}/services/my-services`)
            .set(bearer(clienteB))
            .expect(200)
        ).body,
      ) as any[];
      expect(mine.map((s) => s.referenceId)).not.toContain(svc.referenceId);
    });

    // CP-BE-MKT-029
    it('un profesional no asignado no puede iniciar ni completar (403) y el estado no cambia', async () => {
      const { svc } = await acceptedVia(proX);
      for (const fn of [start, complete]) {
        const res = await fn(svc.referenceId, proY.token);
        expect(res.status).toBe(403);
        assertEnvelope(res);
      }
      for (const token of [clienteA, clienteB]) {
        expect((await start(svc.referenceId, token)).status).toBe(403);
      }
      expect(await status(svc.referenceId)).toBe('ACCEPTED');
      await start(svc.referenceId, proX.token).expect(201);
      expect((await complete(svc.referenceId, proY.token)).status).toBe(403);
      expect(await status(svc.referenceId)).toBe('IN_PROGRESS');
    });

    // CP-BE-MKT-030
    it('un usuario sin perfil profesional no puede aceptar ni ofertar (403)', async () => {
      const svc = await newService();
      expect((await accept(svc.referenceId, clienteB)).status).toBe(403);
      expect((await offer(svc.referenceId, clienteB)).status).toBe(403);
      expect(await status(svc.referenceId)).toBe('PENDING');
    });

    // CP-BE-MKT-031
    it('DEF-BE-022: un profesional PENDING o SUSPENDIDO no puede aceptar ni ofertar (403)', async () => {
      const pending = await registerUser(http, 'pend');
      await applyAsProfessional(http, pending.token, categoryId).expect(201);
      const suspended = await createApprovedPro(http, admin, categoryId);
      await http
        .post(`${PREFIX}/professionals/${suspended.proId}/suspend`)
        .set(bearer(admin))
        .send({ reason: 'e2e' })
        .expect(201);
      const svc = await newService();
      for (const pro of [pending, suspended]) {
        expect((await accept(svc.referenceId, pro.token)).status).toBe(403);
        expect((await offer(svc.referenceId, pro.token)).status).toBe(403);
      }
      expect(await status(svc.referenceId)).toBe('PENDING');
    });

    // CP-BE-MKT-032
    it('DEF-BE-021: GET /services (listado) no expone servicios ajenos a un cliente sin perfil profesional', async () => {
      const svc = await newService(clienteA);
      const res = await http
        .get(`${PREFIX}/services`)
        .query({ status: 'PENDING', pageSize: 100 })
        .set(bearer(clienteB));
      if (res.status === 200) {
        const ids = (unwrap(res.body).data as any[]).map((s) => s.referenceId);
        expect(ids).not.toContain(svc.referenceId);
      } else {
        expect(res.status).toBe(403);
      }
    });

    // CP-BE-MKT-033
    it('un profesional ve los servicios PENDING del marketplace (listado) y admin ve todo', async () => {
      const svc = await newService(clienteA);
      const asPro = await http
        .get(`${PREFIX}/services`)
        .query({ status: 'PENDING', categoryId, pageSize: 100 })
        .set(bearer(proX.token))
        .expect(200);
      expect(
        (unwrap(asPro.body).data as any[]).map((s) => s.referenceId),
      ).toContain(svc.referenceId);
      expect((await getService(svc.referenceId, proX.token)).status).toBe(200);
      expect((await getService(svc.referenceId, admin)).status).toBe(200);
    });

    // CP-BE-MKT-034
    it('el profesional que ofertó no puede responder su propia oferta (solo el cliente dueño)', async () => {
      const svc = await newService();
      const o = unwrap(
        (await offer(svc.referenceId, proX.token).expect(201)).body,
      );
      expect(
        (await respond(svc.referenceId, o.referenceId, proX.token, 'ACCEPTED'))
          .status,
      ).toBe(403);
      expect(await status(svc.referenceId)).toBe('PENDING');
    });
  });

  describe('Alcance de /locations según el estado del servicio', () => {
    // Profesional y clientes propios de este bloque: hasActiveServiceWith cuenta CUALQUIER servicio
    // activo entre el cliente y el profesional, así que no se reusan proX/cliente_a de otros casos.
    const lat = -25.31;
    const lng = -57.62;
    let proL: ApprovedPro;
    const locationOf = (proId: number, token: string) =>
      http.get(`${PREFIX}/locations/professional/${proId}`).set(bearer(token));
    const freshClient = async () => (await registerUser(http, 'cli')).token;
    const flow = async (clientToken: string) => {
      const svc = await newService(clientToken);
      const req = unwrap(
        (await offer(svc.referenceId, proL.token).expect(201)).body,
      );
      return { svc, req };
    };

    beforeAll(async () => {
      proL = await createApprovedPro(http, admin, categoryId);
      await http
        .post(`${PREFIX}/locations/update`)
        .set(bearer(proL.token))
        .send({ latitude: lat, longitude: lng })
        .expect(200);
    });

    // CP-BE-MKT-035
    it('el cliente no ve la posición exacta del profesional mientras el servicio está PENDING; el propio profesional y admin sí', async () => {
      const client = await freshClient();
      await flow(client);
      expect((await locationOf(proL.proId, client)).status).toBe(403);
      expect((await locationOf(proL.proId, proL.token)).status).toBe(200);
      expect((await locationOf(proL.proId, admin)).status).toBe(200);
    });

    // CP-BE-MKT-036
    it('ACCEPTED e IN_PROGRESS autorizan al cliente del servicio; COMPLETED revoca; un tercero nunca', async () => {
      const client = await freshClient();
      const { svc, req } = await flow(client);
      await respond(
        svc.referenceId,
        req.referenceId,
        client,
        'ACCEPTED',
      ).expect(200);
      const ok = await locationOf(proL.proId, client);
      expect(ok.status).toBe(200);
      expect(unwrap(ok.body).latitude).toBeCloseTo(lat, 4);
      expect((await locationOf(proL.proId, clienteB)).status).toBe(403);

      await start(svc.referenceId, proL.token).expect(201);
      expect((await locationOf(proL.proId, client)).status).toBe(200);

      await complete(svc.referenceId, proL.token).expect(201);
      expect((await locationOf(proL.proId, client)).status).toBe(403);
    });

    // CP-BE-MKT-037
    it('CANCELLED también revoca el acceso a la posición exacta', async () => {
      const client = await freshClient();
      const { svc, req } = await flow(client);
      await respond(
        svc.referenceId,
        req.referenceId,
        client,
        'ACCEPTED',
      ).expect(200);
      expect((await locationOf(proL.proId, client)).status).toBe(200);
      await cancel(svc.referenceId, client).expect(200);
      expect((await locationOf(proL.proId, client)).status).toBe(403);
    });

    // CP-BE-MKT-038
    it('sin JWT /locations/professional/:id -> 401', async () => {
      await http
        .get(`${PREFIX}/locations/professional/${proL.proId}`)
        .expect(401);
    });

    // CP-BE-MKT-039
    it('DEF-BE-030: un profesional suspendido a mitad de servicio sigue visible (id y referenceId) para su cliente con servicio ACCEPTED/IN_PROGRESS; terceros y quien perdio el vinculo reciben 404', async () => {
      const proS = await createApprovedPro(http, admin, categoryId);
      const clientAccepted = await freshClient();
      const clientInProgress = await freshClient();
      const accepted = await newService(clientAccepted);
      const inProgress = await newService(clientInProgress);
      for (const [svc, client] of [
        [accepted, clientAccepted],
        [inProgress, clientInProgress],
      ] as const) {
        const req = unwrap(
          (await offer(svc.referenceId, proS.token).expect(201)).body,
        );
        await respond(
          svc.referenceId,
          req.referenceId,
          client,
          'ACCEPTED',
        ).expect(200);
      }
      await start(inProgress.referenceId, proS.token).expect(201);
      await http
        .post(`${PREFIX}/professionals/${proS.proId}/suspend`)
        .set(bearer(admin))
        .send({ reason: 'e2e a mitad de servicio' })
        .expect(201);
      const view = async (token: string) => [
        (
          await http
            .get(`${PREFIX}/professionals/${proS.proId}`)
            .set(bearer(token))
        ).status,
        (
          await http
            .get(`${PREFIX}/professionals/reference/${proS.proReferenceId}`)
            .set(bearer(token))
        ).status,
      ];
      expect(await view(clientAccepted)).toEqual([200, 200]); // ACCEPTED
      expect(await view(clientInProgress)).toEqual([200, 200]); // IN_PROGRESS
      expect(await view(clienteB)).toEqual([404, 404]); // sin vinculo
      expect(await view(admin)).toEqual([200, 200]);

      await cancel(accepted.referenceId, clientAccepted).expect(200);
      expect(await view(clientAccepted)).toEqual([404, 404]); // el vinculo se revoco
      expect(await view(clientInProgress)).toEqual([200, 200]);
    });
  });
});
