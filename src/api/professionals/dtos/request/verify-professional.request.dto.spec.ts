import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { VerifyProfessionalRequestDTO } from './verify-professional.request.dto';

describe('VerifyProfessionalRequestDTO (nota de verificación/rechazo)', () => {
  const build = (body: unknown) =>
    plainToInstance(VerifyProfessionalRequestDTO, body);

  it.each([
    { isVerified: true },
    { isVerified: true, notes: '' },
    { isVerified: true, notes: '   ' },
    { isVerified: 'true', notes: 'Documentos válidos' },
  ])('debe aceptar verificar con nota opcional: %j', async (body) => {
    expect(await validate(build(body))).toHaveLength(0);
  });

  it('debe dejar la nota en blanco como undefined al verificar', () => {
    expect(build({ isVerified: true, notes: '   ' }).notes).toBeUndefined();
  });

  it.each([
    { isVerified: false },
    { isVerified: false, notes: '' },
    { isVerified: false, notes: '   ' },
    { isVerified: false, notes: 5 },
  ])('debe rechazar (400) un rechazo sin nota válida: %j', async (body) => {
    expect(await validate(build(body))).not.toHaveLength(0);
  });

  it('debe aceptar un rechazo con motivo y recortarlo', async () => {
    const dto = build({
      isVerified: false,
      notes: '  Documentación ilegible ',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.notes).toBe('Documentación ilegible');
  });
});
