/* eslint-disable */
/**
 * Suite: M2 Catálogos contra el stack real (categorías CRUD + visibilidad pública, service-types,
 * countries/currencies/languages públicos, tipos de documento profesional, TaxConfig/TipConfig sin
 * fila, paginación). Defectos de producto con `it.failing` y su DEF-BE en el nombre.
 * Casos: CP-BE-CAT-001..035 (ver test/qa/casos/CP-CAT.md)
 * Tipo: e2e   Prioridad: P0/P1
 * Precondiciones: pnpm e2e:up + e2e:seed; fixtures admin y cliente_a. Los nombres/códigos creados
 *        son únicos por corrida; las categorías se borran al final (los tipos de documento no
 *        tienen DELETE y quedan inactivos: el stack es descartable).
 * Trazabilidad: M2 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3); openspec/specs/e2e-test-plan.md Tier 2
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

describe('M2 Catálogos (e2e real)', () => {
  let ctx: E2eApp;
  let http: E2eApp['http'];
  let admin: string;
  let cliente: string;
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  const createdCategoryIds: number[] = [];

  beforeAll(async () => {
    ctx = await bootApp();
    http = ctx.http;
    admin = (await login(http, FIXTURE.admin.email, FIXTURE.admin.password))
      .accessToken;
    cliente = (
      await login(http, FIXTURE.clienteA.email, FIXTURE.clienteA.password)
    ).accessToken;
  });

  afterAll(async () => {
    for (const id of createdCategoryIds) {
      await http.delete(`${PREFIX}/categories/${id}`).set(bearer(admin));
    }
    await prisma.$disconnect();
    await ctx?.close();
  });

  const createCategory = async (extra: Record<string, unknown> = {}) => {
    const name = `E2E Cat ${uniqueSuffix()}`;
    const res = await http
      .post(`${PREFIX}/categories`)
      .set(bearer(admin))
      .send({ name, ...extra })
      .expect(201);
    const cat = unwrap(res.body);
    createdCategoryIds.push(cat.id);
    return cat as { id: number; name: string; slug: string };
  };
  const publicNames = async (path = '/categories') =>
    (
      unwrap((await http.get(`${PREFIX}${path}`).expect(200)).body) as any[]
    ).map((c) => c.name);

  describe('Categorías', () => {
    // CP-BE-CAT-001
    it('admin crea una categoría y aparece en el listado público (sin token)', async () => {
      const cat = await createCategory();
      expect(cat.slug).toMatch(/^e2e-cat-/);
      expect(await publicNames()).toContain(cat.name);
      expect(await publicNames('/categories/main')).toContain(cat.name);
    });

    // CP-BE-CAT-002
    it('una categoría oculta (isVisible=false) no aparece en listados públicos ni por slug', async () => {
      const cat = await createCategory({ isVisible: false });
      expect(await publicNames()).not.toContain(cat.name);
      expect(await publicNames('/categories/main')).not.toContain(cat.name);
      await http.get(`${PREFIX}/categories/slug/${cat.slug}`).expect(404);
      // y el admin sí la ve en el listado completo
      const all = unwrap(
        (
          await http
            .get(`${PREFIX}/categories/all?pageSize=100`)
            .set(bearer(admin))
            .expect(200)
        ).body,
      ) as any[];
      expect(all.map((c) => c.name)).toContain(cat.name);
    });

    // CP-BE-CAT-003
    it('toggle-visibility oculta y vuelve a mostrar la categoría', async () => {
      const cat = await createCategory();
      await http
        .patch(`${PREFIX}/categories/${cat.id}/toggle-visibility`)
        .set(bearer(admin))
        .expect(200);
      expect(await publicNames()).not.toContain(cat.name);
      await http
        .patch(`${PREFIX}/categories/${cat.id}/toggle-visibility`)
        .set(bearer(admin))
        .expect(200);
      expect(await publicNames()).toContain(cat.name);
    });

    // CP-BE-CAT-004
    it('una categoría INACTIVE no aparece en el listado público', async () => {
      const cat = await createCategory();
      await http
        .patch(`${PREFIX}/categories/${cat.id}/status`)
        .query({ status: 'INACTIVE' })
        .set(bearer(admin))
        .expect(200);
      expect(await publicNames()).not.toContain(cat.name);
    });

    // CP-BE-CAT-005
    it('admin actualiza una categoría (PATCH) y el cambio se refleja', async () => {
      const cat = await createCategory();
      const res = await http
        .patch(`${PREFIX}/categories/${cat.id}`)
        .set(bearer(admin))
        .send({ description: 'descripción e2e' })
        .expect(200);
      expect(unwrap(res.body).description).toBe('descripción e2e');
      const got = await http.get(`${PREFIX}/categories/${cat.id}`).expect(200);
      expect(unwrap(got.body).description).toBe('descripción e2e');
    });

    // CP-BE-CAT-006
    it('nombre duplicado -> 409', async () => {
      const cat = await createCategory();
      await http
        .post(`${PREFIX}/categories`)
        .set(bearer(admin))
        .send({ name: cat.name })
        .expect(409);
    });

    // CP-BE-CAT-007
    it('admin elimina una categoría sin relaciones: 204 y luego 404', async () => {
      const cat = await createCategory();
      await http
        .delete(`${PREFIX}/categories/${cat.id}`)
        .set(bearer(admin))
        .expect(204);
      await http.get(`${PREFIX}/categories/${cat.id}`).expect(404);
      expect(await publicNames()).not.toContain(cat.name);
    });

    // CP-BE-CAT-008
    it('subcategoría: se crea bajo un padre y aparece en /subcategories/:parentId; 3er nivel -> 400', async () => {
      const parent = await createCategory();
      const child = await createCategory({ parentCategoryId: parent.id });
      const subs = unwrap(
        (
          await http
            .get(`${PREFIX}/categories/subcategories/${parent.id}`)
            .expect(200)
        ).body,
      ) as any[];
      expect(subs.map((c) => c.name)).toContain(child.name);
      await http
        .post(`${PREFIX}/categories`)
        .set(bearer(admin))
        .send({ name: `E2E Cat ${uniqueSuffix()}`, parentCategoryId: child.id })
        .expect(400);
    });

    // CP-BE-CAT-009
    it('mutaciones sin token -> 401; id inexistente -> 404', async () => {
      await http.post(`${PREFIX}/categories`).send({ name: 'x' }).expect(401);
      await http.get(`${PREFIX}/categories/999999`).expect(404);
      await http
        .patch(`${PREFIX}/categories/999999`)
        .set(bearer(admin))
        .send({ description: 'x' })
        .expect(404);
    });

    // DEF-BE-002 (corregido): mutar categorías exige categories.catalog:manage o admin:all (CP-BE-CAT-010..014).
    describe('cliente sin permiso admin (403 esperado)', () => {
      // CP-BE-CAT-010
      it('DEF-BE-002: cliente_a NO debe poder crear una categoría', async () => {
        const name = `E2E Cat cliente ${uniqueSuffix()}`;
        const res = await http
          .post(`${PREFIX}/categories`)
          .set(bearer(cliente))
          .send({ name });
        if (res.status === 201) createdCategoryIds.push(unwrap(res.body).id);
        expect(res.status).toBe(403);
      });
      // CP-BE-CAT-011
      it('DEF-BE-002: cliente_a NO debe poder editar una categoría', async () => {
        const cat = await createCategory();
        const res = await http
          .patch(`${PREFIX}/categories/${cat.id}`)
          .set(bearer(cliente))
          .send({ description: 'hack' });
        expect(res.status).toBe(403);
      });
      // CP-BE-CAT-012
      it('DEF-BE-002: cliente_a NO debe poder ocultar una categoría', async () => {
        const cat = await createCategory();
        const res = await http
          .patch(`${PREFIX}/categories/${cat.id}/toggle-visibility`)
          .set(bearer(cliente));
        expect(res.status).toBe(403);
      });
      // CP-BE-CAT-013
      it('DEF-BE-002: cliente_a NO debe poder cambiar el estado de una categoría', async () => {
        const cat = await createCategory();
        const res = await http
          .patch(`${PREFIX}/categories/${cat.id}/status`)
          .query({ status: 'INACTIVE' })
          .set(bearer(cliente));
        expect(res.status).toBe(403);
      });
      // CP-BE-CAT-014
      it('DEF-BE-002: cliente_a NO debe poder borrar una categoría', async () => {
        const cat = await createCategory();
        const res = await http
          .delete(`${PREFIX}/categories/${cat.id}`)
          .set(bearer(cliente));
        expect(res.status).toBe(403);
      });
    });

    // CP-BE-CAT-015
    it('DEF-BE-001: GET /categories/abc debe dar 400/422', async () => {
      const res = await http.get(`${PREFIX}/categories/abc`);
      expect([400, 422]).toContain(res.status);
    });

    // CP-BE-CAT-016
    it('DEF-BE-008: GET /categories/:id de una categoría oculta debe dar 404 como slug/listados', async () => {
      const cat = await createCategory({ isVisible: false });
      const res = await http.get(`${PREFIX}/categories/${cat.id}`);
      expect(res.status).toBe(404);
      // un token de cliente no cambia nada; un token inválido tampoco rompe la ruta pública
      await http
        .get(`${PREFIX}/categories/${cat.id}`)
        .set(bearer(cliente))
        .expect(404);
      await http
        .get(`${PREFIX}/categories/${cat.id}`)
        .set('Authorization', 'Bearer basura')
        .expect(404);
    });

    // CP-BE-CAT-016b
    it('DEF-BE-008: el admin sí ve la categoría oculta o inactiva por id; la visible la ve cualquiera', async () => {
      const oculta = await createCategory({ isVisible: false });
      const visible = await createCategory();
      const res = await http
        .get(`${PREFIX}/categories/${oculta.id}`)
        .set(bearer(admin))
        .expect(200);
      expect(unwrap(res.body).id).toBe(oculta.id);
      await http
        .patch(`${PREFIX}/categories/${visible.id}/status`)
        .query({ status: 'INACTIVE' })
        .set(bearer(admin))
        .expect(200);
      await http.get(`${PREFIX}/categories/${visible.id}`).expect(404);
      await http
        .get(`${PREFIX}/categories/${visible.id}`)
        .set(bearer(admin))
        .expect(200);
    });
  });

  describe('Service types', () => {
    // CP-BE-CAT-017
    it('GET /service-types es público y devuelve solo tipos activos del seed', async () => {
      const res = await http.get(`${PREFIX}/service-types`).expect(200);
      const list = unwrap(res.body) as any[];
      expect(list.length).toBeGreaterThan(0);
      expect(list.map((s) => s.name)).toContain('Instalación');
      expect(list.every((s) => s.isActive !== false)).toBe(true);
    });
  });

  describe('Países, monedas e idiomas (públicos, sin guard)', () => {
    // CP-BE-CAT-018
    it('GET /countries (sin token) lista Paraguay con paginación', async () => {
      const res = await http.get(`${PREFIX}/countries`).expect(200);
      const d = unwrap(res.body);
      expect(d.data.map((c: any) => c.iso2)).toContain('PY');
      expect(d.pagination).toEqual(
        expect.objectContaining({ page: 1, total: expect.any(Number) }),
      );
    });
    // CP-BE-CAT-019
    it('GET /countries/:id existente 200; inexistente 404', async () => {
      await http.get(`${PREFIX}/countries/1`).expect(200);
      await http.get(`${PREFIX}/countries/999999`).expect(404);
    });
    // CP-BE-CAT-020
    it('GET /currencies (sin token) incluye PYG sin decimales; /currencies/PYG 200; /ZZZ 404', async () => {
      const list = unwrap(
        (await http.get(`${PREFIX}/currencies`).expect(200)).body,
      );
      const pyg = list.find((c: any) => c.alphaCode === 'PYG');
      expect(pyg).toBeDefined();
      expect(pyg.decimalQuantity).toBe(0);
      await http.get(`${PREFIX}/currencies/PYG`).expect(200);
      await http.get(`${PREFIX}/currencies/ZZZ`).expect(404);
    });
    // CP-BE-CAT-021
    it('GET /languages (sin token) incluye es y en; /languages/:id 200 y 404', async () => {
      const list = unwrap(
        (await http.get(`${PREFIX}/languages`).expect(200)).body,
      );
      expect(list.map((l: any) => l.code)).toEqual(
        expect.arrayContaining(['es', 'en']),
      );
      await http.get(`${PREFIX}/languages/${list[0].id}`).expect(200);
      await http.get(`${PREFIX}/languages/999999`).expect(404);
    });
  });

  describe('ProfessionalDocumentTypes', () => {
    const body = () => ({
      code: `E2E_DOC_${uniqueSuffix().toUpperCase()}`,
      name: 'Documento E2E',
      category: 'QUALIFICATION',
      isRequired: false,
    });
    const listCodes = async (token: string, qs = '') =>
      (
        unwrap(
          (
            await http
              .get(`${PREFIX}/professional-document-types${qs}`)
              .set(bearer(token))
              .expect(200)
          ).body,
        ).data as any[]
      ).map((t) => t.code);

    // CP-BE-CAT-022
    it('admin crea un tipo y un usuario autenticado lo ve en el listado', async () => {
      const b = body();
      const res = await http
        .post(`${PREFIX}/admin/professional-document-types`)
        .set(bearer(admin))
        .send(b)
        .expect(201);
      expect(unwrap(res.body).code).toBe(b.code);
      expect(await listCodes(cliente)).toContain(b.code);
      expect(await listCodes(cliente, '?category=QUALIFICATION')).toContain(
        b.code,
      );
      expect(await listCodes(cliente, '?category=PORTFOLIO')).not.toContain(
        b.code,
      );
    });
    // CP-BE-CAT-023
    it('admin actualiza y desactiva un tipo (PATCH): deja de listarse', async () => {
      const b = body();
      const created = unwrap(
        (
          await http
            .post(`${PREFIX}/admin/professional-document-types`)
            .set(bearer(admin))
            .send(b)
            .expect(201)
        ).body,
      );
      const upd = await http
        .patch(
          `${PREFIX}/admin/professional-document-types/${created.referenceId}`,
        )
        .set(bearer(admin))
        .send({ name: 'Renombrado E2E' })
        .expect(200);
      expect(unwrap(upd.body).name).toBe('Renombrado E2E');
      await http
        .patch(
          `${PREFIX}/admin/professional-document-types/${created.referenceId}`,
        )
        .set(bearer(admin))
        .send({ isActive: false })
        .expect(200);
      expect(await listCodes(cliente)).not.toContain(b.code);
    });
    // CP-BE-CAT-024
    it('cliente_a recibe 403 al crear/editar; sin token 401; referenceId inexistente 404', async () => {
      await http
        .post(`${PREFIX}/admin/professional-document-types`)
        .set(bearer(cliente))
        .send(body())
        .expect(403);
      await http
        .patch(
          `${PREFIX}/admin/professional-document-types/3d1f1b9a-6a54-4b6e-9c52-0b6e2f6a9f11`,
        )
        .set(bearer(cliente))
        .send({ name: 'x' })
        .expect(403);
      await http.get(`${PREFIX}/professional-document-types`).expect(401);
      await http
        .patch(
          `${PREFIX}/admin/professional-document-types/3d1f1b9a-6a54-4b6e-9c52-0b6e2f6a9f11`,
        )
        .set(bearer(admin))
        .send({ name: 'x' })
        .expect(404);
    });
    // CP-BE-CAT-025
    it('DEF-BE-010: código de tipo de documento duplicado debe dar 409', async () => {
      const b = body();
      await http
        .post(`${PREFIX}/admin/professional-document-types`)
        .set(bearer(admin))
        .send(b)
        .expect(201);
      await http
        .post(`${PREFIX}/admin/professional-document-types`)
        .set(bearer(admin))
        .send(b)
        .expect(409);
    });
    // CP-BE-CAT-026
    it('DEF-BE-001: body inválido en alta de tipo de documento debe dar 400/422', async () => {
      const res = await http
        .post(`${PREFIX}/admin/professional-document-types`)
        .set(bearer(admin))
        .send({});
      expect([400, 422]).toContain(res.status);
    });
  });

  describe('TaxConfig / TipConfig sin fila -> fallback seguro', () => {
    let taxRows: any[];
    let tipRows: any[];

    beforeAll(async () => {
      taxRows = await prisma.taxConfig.findMany();
      tipRows = await prisma.tipConfig.findMany();
      await prisma.taxConfig.deleteMany();
      await prisma.tipConfig.deleteMany();
    });
    afterAll(async () => {
      await prisma.taxConfig.deleteMany();
      await prisma.tipConfig.deleteMany();
      if (taxRows.length) await prisma.taxConfig.createMany({ data: taxRows });
      if (tipRows.length) await prisma.tipConfig.createMany({ data: tipRows });
    });

    // CP-BE-CAT-027
    it('GET /tax/config sin fila: impuesto deshabilitado, tasa 0', async () => {
      const res = await http
        .get(`${PREFIX}/tax/config`)
        .set(bearer(cliente))
        .expect(200);
      expect(unwrap(res.body)).toEqual({
        isEnabled: false,
        name: 'Sin configurar',
        rate: 0,
      });
    });
    // CP-BE-CAT-028
    it('GET /tips/config sin fila: propinas habilitadas con 10/15/20, no obligatoria', async () => {
      const res = await http
        .get(`${PREFIX}/tips/config`)
        .set(bearer(cliente))
        .expect(200);
      expect(unwrap(res.body)).toEqual({
        isEnabled: true,
        isMandatory: false,
        suggestedPercentages: [10, 15, 20],
        allowFreeAmount: true,
      });
    });
    // CP-BE-CAT-029
    it('con una fila activa, /tax/config refleja la fila (y no el fallback)', async () => {
      await prisma.taxConfig.create({
        data: { name: 'IVA E2E', rate: 0.1, isEnabled: true, isActive: true },
      });
      const res = await http
        .get(`${PREFIX}/tax/config`)
        .set(bearer(cliente))
        .expect(200);
      expect(unwrap(res.body)).toEqual({
        isEnabled: true,
        name: 'IVA E2E',
        rate: 0.1,
      });
      await prisma.taxConfig.deleteMany();
    });
    // CP-BE-CAT-030
    it('tax/tips config exigen autenticación (401 sin token)', async () => {
      await http.get(`${PREFIX}/tax/config`).expect(401);
      await http.get(`${PREFIX}/tips/config`).expect(401);
    });
    // PlatformCommissionConfig: ningún controller la expone (solo FeeCalculatorService al
    // calcular pagos; fallback cubierto por fee-calculator.service.spec.ts). Ver CP-CAT.md.
  });

  describe('Paginación: pageSize enorme', () => {
    // CP-BE-CAT-031
    it('DEF-BE-009: GET /countries?pageSize=100000 debe dar 400 (tope 100)', async () => {
      const res = await http.get(`${PREFIX}/countries?pageSize=100000`);
      expect(res.status).toBe(400);
      // el límite exacto sigue permitido
      await http.get(`${PREFIX}/countries?pageSize=100`).expect(200);
    });
    // CP-BE-CAT-032
    it('DEF-BE-009: GET /users?pageSize=100000 (admin) debe dar 400 (tope 100)', async () => {
      const res = await http
        .get(`${PREFIX}/users?pageSize=100000`)
        .set(bearer(admin));
      expect(res.status).toBe(400);
      // el límite exacto sigue permitido
      await http.get(`${PREFIX}/countries?pageSize=100`).expect(200);
    });
    // CP-BE-CAT-033
    it('DEF-BE-001: pageSize inválido (-1 / abc) debe dar 400/422', async () => {
      for (const v of ['-1', 'abc']) {
        const res = await http.get(`${PREFIX}/countries?pageSize=${v}`);
        expect([400, 422]).toContain(res.status);
      }
    });
  });

  describe('Categorías: paginación admin y nombre vacío', () => {
    // CP-BE-CAT-034
    it('DEF-BE-012: GET /categories/all respeta page/pageSize y devuelve {data, pagination}', async () => {
      await createCategory();
      await createCategory();
      await createCategory();
      const res = await http
        .get(`${PREFIX}/categories/all?page=1&pageSize=2`)
        .set(bearer(admin))
        .expect(200);
      expect(res.body.data).toHaveLength(2);
      const { total, page, pageSize, totalPages } = res.body.pagination;
      expect(total).toBeGreaterThanOrEqual(3);
      expect(page).toBe(1);
      expect(pageSize).toBe(2);
      expect(totalPages).toBe(Math.ceil(total / 2));
      const last = await http
        .get(`${PREFIX}/categories/all?page=${totalPages}&pageSize=2`)
        .set(bearer(admin))
        .expect(200);
      expect(last.body.data.length).toBe(total - (totalPages - 1) * 2);
      // pageSize > 100 se rechaza
      await http
        .get(`${PREFIX}/categories/all?pageSize=101`)
        .set(bearer(admin))
        .expect(400);
    });
    // CP-BE-CAT-035
    it('DEF-BE-013: POST /categories con name vacío o solo espacios -> 400', async () => {
      for (const name of ['', '   ']) {
        const res = await http
          .post(`${PREFIX}/categories`)
          .set(bearer(admin))
          .send({ name });
        expect(res.status).toBe(400);
      }
      // el DTO de update hereda la validación
      const cat = await createCategory();
      await http
        .patch(`${PREFIX}/categories/${cat.id}`)
        .set(bearer(admin))
        .send({ name: '  ' })
        .expect(400);
    });
  });
});
