export interface IJwtPayload {
  sub: string; // referenceId del usuario
  email: string;
  status?: string;
  isEmployee?: boolean;
  firstName?: string;
  lastName?: string;
  jti?: string; // solo refresh tokens emitidos tras DEF-BE-006
  tokenType: string; // 'accessToken' | 'refreshToken'
  iat: number;
  exp: number;
}
