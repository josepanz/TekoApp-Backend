import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReactivateProfessionalRequestDTO } from './reactivate-professional.request.dto';

describe('ReactivateProfessionalRequestDTO', () => {
  const run = (body: unknown) =>
    validate(plainToInstance(ReactivateProfessionalRequestDTO, body));

  it.each([{}, { reason: '' }, { reason: '   ' }, { reason: 5 }])(
    'debe rechazar un motivo ausente, vacío, solo espacios o no string: %j',
    async (body) => {
      expect(await run(body)).not.toHaveLength(0);
    },
  );

  it('debe aceptar un motivo y recortarlo', async () => {
    const dto = plainToInstance(ReactivateProfessionalRequestDTO, {
      reason: '  Apelación aceptada  ',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.reason).toBe('Apelación aceptada');
  });
});
