/**
 * Contenido del payload cifrado (RSA) que envía el frontend en el login.
 * A partir del soporte de nonce anti-replay, el valor desencriptado es un JSON
 * con la contraseña en claro y el nonce previamente emitido por `/auth/nonce`.
 */
export interface ILoginPayload {
  password: string;
  nonce: string;
}
