import {
  mapServiceToResponse,
  mapServicesToResponse,
} from './services-response.helper';

// Tarea 8 (platform-hardening-2026-09): el contacto del dueño de cada cuenta (cliente o
// profesional) no debe exponerse en ServiceUserSummaryResponseDTO cuando desactivó
// shareContactInfo — ver el comentario de la función en services-response.helper.ts.

describe('mapServiceToResponse', () => {
  const baseUser = {
    id: 1,
    referenceId: 'user-ref-1',
    email: 'cliente@example.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    phoneNumber: '+595981234567',
    shareContactInfo: true,
  };

  const baseProfessionalUser = {
    id: 2,
    referenceId: 'prof-user-ref-1',
    email: 'profesional@example.com',
    firstName: 'Ana',
    lastName: 'Gómez',
    phoneNumber: '+595987654321',
    shareContactInfo: true,
  };

  const baseService = {
    id: 100,
    referenceId: 'svc-ref-1',
    title: 'Reparación de cañería',
    users: baseUser,
    professional: {
      id: 5,
      referenceId: 'prof-ref-1',
      user: baseProfessionalUser,
    },
  };

  it('debe exponer email y phoneNumber del cliente cuando shareContactInfo es true', () => {
    // Act
    const result = mapServiceToResponse(baseService);

    // Assert
    expect(result.users.email).toBe('cliente@example.com');
    expect(result.users.phoneNumber).toBe('+595981234567');
  });

  it('no debe exponer email ni phoneNumber del cliente cuando shareContactInfo es false', () => {
    // Arrange
    const service = {
      ...baseService,
      users: { ...baseUser, shareContactInfo: false },
    };

    // Act
    const result = mapServiceToResponse(service);

    // Assert — las claves no viajan (no un `null` que confirme que el dato existe).
    expect(result.users.email).toBeUndefined();
    expect(result.users.phoneNumber).toBeUndefined();
    expect('email' in result.users).toBe(false);
    expect('phoneNumber' in result.users).toBe(false);
    // El resto de los campos del cliente sigue viajando normalmente.
    expect(result.users.firstName).toBe('Juan');
  });

  it('no debe exponer el contacto del profesional cuando su propio shareContactInfo es false', () => {
    // Arrange — el campo vive en Users sin distinción de rol, aplica igual al profesional.
    const service = {
      ...baseService,
      professional: {
        ...baseService.professional,
        user: { ...baseProfessionalUser, shareContactInfo: false },
      },
    };

    // Act
    const result = mapServiceToResponse(service);

    // Assert
    expect(result.professional?.user.email).toBeUndefined();
    expect(result.professional?.user.phoneNumber).toBeUndefined();
    // El contacto del cliente no se ve afectado por la preferencia del profesional.
    expect(result.users.email).toBe('cliente@example.com');
  });

  it('no debe fallar cuando el servicio no tiene professional asignado', () => {
    // Arrange
    const service = { ...baseService, professional: null };

    // Act & Assert
    expect(() => mapServiceToResponse(service)).not.toThrow();
  });

  it('mapServicesToResponse debe aplicar el mismo enmascarado a cada elemento de la lista', () => {
    // Arrange
    const services = [
      baseService,
      { ...baseService, users: { ...baseUser, shareContactInfo: false } },
    ];

    // Act
    const result = mapServicesToResponse(services);

    // Assert
    expect(result[0].users.email).toBe('cliente@example.com');
    expect(result[1].users.email).toBeUndefined();
  });
});
