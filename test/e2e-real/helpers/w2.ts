/* eslint-disable */
/**
 * Helpers de la ola W2 (M3 onboarding profesional y M4 marketplace): usuarios nuevos por API,
 * postulación a profesional, subida de documentos y alta de servicios. Todo con datos únicos por corrida.
 */
import { randomInt } from 'crypto';
import {
  basic,
  bearer,
  E2E_PASSWORD,
  getPublicKey,
  Http,
  login,
  PREFIX,
  rsaEncrypt,
  uniqueSuffix,
  unwrap,
} from './e2e-app';

export interface NewUser {
  email: string;
  token: string;
  referenceId: string;
  id?: number;
}

/** Registra un usuario por POST /onboarding y devuelve su sesión. */
export async function registerUser(http: Http, prefix = 'w2', firstName = 'W2'): Promise<NewUser> {
  const pem = await getPublicKey(http);
  const email = `${prefix}_${uniqueSuffix()}@e2e.tekoapp.local`;
  const res = await basic(http.post(`${PREFIX}/onboarding`))
    .send({
      firstName,
      lastName: 'Prueba',
      email,
      phoneNumber: `09${randomInt(10000000, 99999999)}`,
      password: rsaEncrypt(pem, E2E_PASSWORD),
      confirmPassword: rsaEncrypt(pem, E2E_PASSWORD),
      acceptTerms: true,
    })
    .expect(201);
  const referenceId = unwrap(res.body).referenceId as string;
  const s = await login(http, email, E2E_PASSWORD);
  return { email, token: s.accessToken, referenceId };
}

/** Id (Int) de la categoría plomería sembrada (el POST /professionals recibe el Int). */
export async function plomeriaCategoryId(http: Http): Promise<number> {
  const res = await http.get(`${PREFIX}/categories/slug/plomeria`).expect(200);
  return unwrap(res.body).id as number;
}

export function applyAsProfessional(
  http: Http,
  token: string,
  categoryId: number,
  extra: Record<string, unknown> = {},
) {
  return http
    .post(`${PREFIX}/professionals`)
    .set(bearer(token))
    .send({
      categoryId,
      description: `Profesional E2E ${uniqueSuffix()}`,
      hourlyRate: 40000,
      ...extra,
    });
}

/** Acepta (vía API) la versión activa de un tipo de documento legal pendiente. */
export async function acceptConsent(
  http: Http,
  token: string,
  documentType: string,
): Promise<void> {
  const pending = unwrap(
    (await http.get(`${PREFIX}/legal/consents/pending`).set(bearer(token)).expect(200)).body,
  ) as any[];
  const version = pending.find((v) => v.documentType === documentType);
  if (!version) throw new Error(`sin versión pendiente para ${documentType}`);
  await http
    .post(`${PREFIX}/legal/consents/${version.referenceId}/accept`)
    .set(bearer(token))
    .expect(201);
}

/** PDF mínimo válido para subir como documento. */
export const tinyPdf = () =>
  Buffer.from(
    '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 10 10]/Parent 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n' +
      uniqueSuffix(),
  );

/** PNG de 1x1 válido (el sufijo va en el nombre, no en el contenido). */
export const tinyPng = () =>
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

export interface ApprovedPro extends NewUser {
  proId: number;
  proReferenceId: string;
}

/** Usuario nuevo -> postulación -> verify de admin => profesional APPROVED/VERIFIED. */
export async function createApprovedPro(
  http: Http,
  adminToken: string,
  categoryId: number,
): Promise<ApprovedPro> {
  const user = await registerUser(http, 'pro');
  const res = await applyAsProfessional(http, user.token, categoryId).expect(
    201,
  );
  const pro = unwrap(res.body);
  await http
    .post(`${PREFIX}/professionals/${pro.id}/verify`)
    .set(bearer(adminToken))
    .send({ isVerified: true })
    .expect(201);
  return { ...user, proId: pro.id, proReferenceId: pro.referenceId };
}

/** Id (Int) del primer service-type activo. */
export async function firstServiceTypeId(http: Http): Promise<number> {
  const res = await http.get(`${PREFIX}/service-types`).expect(200);
  const body = unwrap(res.body);
  const list = (Array.isArray(body) ? body : body.data) as any[];
  return list[0].id as number;
}

/** El cliente publica una solicitud de servicio (PENDING). */
export function createService(
  http: Http,
  token: string,
  categoryId: number,
  serviceTypeId: number,
  extra: Record<string, unknown> = {},
) {
  return http
    .post(`${PREFIX}/services`)
    .set(bearer(token))
    .send({
      title: `Servicio E2E ${uniqueSuffix()}`,
      description: 'Pérdida en la cañería de la cocina',
      categoryId,
      serviceTypeId,
      latitude: -25.2637,
      longitude: -57.5759,
      address: 'Av. España 1234, Asunción',
      estimatedHours: 2,
      hourlyRate: 40000,
      ...extra,
    });
}
