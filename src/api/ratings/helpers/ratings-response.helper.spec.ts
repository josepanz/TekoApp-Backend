import { RatingType } from '@prisma/client';
import {
  mapRatingToResponse,
  mapRatingsToResponse,
  RatingViewerContext,
} from './ratings-response.helper';

// Tarea 9 (platform-hardening-2026-09): userName/professionalName reemplazan los ids crudos que
// Web mostraba en sus tablas admin ("Anónimo" era un parche de UI para el caso ya cubierto por
// isAnonymous). Mismo criterio de anonimato que userId/professionalId: si el id queda null, el
// nombre también — nunca se filtra la identidad por el campo nuevo.

const privilegedViewer: RatingViewerContext = {
  userId: 999,
  professionalId: null,
  isPrivileged: true,
};

const authorViewer: RatingViewerContext = {
  userId: 1,
  professionalId: null,
  isPrivileged: false,
};

const strangerViewer: RatingViewerContext = {
  userId: 42,
  professionalId: null,
  isPrivileged: false,
};

function buildRating(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    referenceId: 'rating-ref-1',
    type: RatingType.CLIENT_TO_PROFESSIONAL,
    userId: 1,
    professionalId: 5,
    isAnonymous: false,
    serviceId: 10,
    service: { referenceId: 'svc-ref-1' },
    user: { firstName: 'Juan', lastName: 'Pérez' },
    professional: { user: { firstName: 'Ana', lastName: 'Gómez' } },
    ...overrides,
  };
}

describe('mapRatingToResponse', () => {
  it('debe exponer userName y professionalName cuando la calificación no es anónima', () => {
    // Act
    const result = mapRatingToResponse(buildRating(), privilegedViewer);

    // Assert
    expect(result.userName).toBe('Juan Pérez');
    expect(result.professionalName).toBe('Ana Gómez');
  });

  it('no debe exponer userName cuando el autor CLIENT_TO_PROFESSIONAL está anonimizado para el viewer', () => {
    // Arrange — anónimo, quien consulta no es ni el autor ni privilegiado.
    const rating = buildRating({ isAnonymous: true });

    // Act
    const result = mapRatingToResponse(rating, strangerViewer);

    // Assert
    expect(result.userId).toBeNull();
    expect(result.userName).toBeNull();
    // El calificado (profesional) nunca se oculta — la otra parte siempre ve su propia reseña.
    expect(result.professionalId).toBe(5);
    expect(result.professionalName).toBe('Ana Gómez');
  });

  it('no debe exponer professionalName cuando el autor PROFESSIONAL_TO_CLIENT está anonimizado para el viewer', () => {
    // Arrange
    const rating = buildRating({
      type: RatingType.PROFESSIONAL_TO_CLIENT,
      isAnonymous: true,
    });

    // Act
    const result = mapRatingToResponse(rating, strangerViewer);

    // Assert
    expect(result.professionalId).toBeNull();
    expect(result.professionalName).toBeNull();
    expect(result.userId).toBe(1);
    expect(result.userName).toBe('Juan Pérez');
  });

  it('debe seguir exponiendo el nombre del autor a un viewer privilegiado aunque sea anónimo', () => {
    // Arrange
    const rating = buildRating({ isAnonymous: true });

    // Act
    const result = mapRatingToResponse(rating, privilegedViewer);

    // Assert
    expect(result.userId).toBe(1);
    expect(result.userName).toBe('Juan Pérez');
  });

  it('debe seguir exponiendo el nombre del propio autor a sí mismo aunque sea anónimo para terceros', () => {
    // Arrange
    const rating = buildRating({ isAnonymous: true });

    // Act — authorViewer.userId === rating.userId
    const result = mapRatingToResponse(rating, authorViewer);

    // Assert
    expect(result.userId).toBe(1);
    expect(result.userName).toBe('Juan Pérez');
  });

  it('debe retornar null en ambos nombres cuando las relaciones user/professional no vinieron incluidas', () => {
    // Arrange — ej. la respuesta de create()/update(), cuyo query no incluye user/professional.
    const rating = buildRating({ user: undefined, professional: undefined });

    // Act
    const result = mapRatingToResponse(rating, privilegedViewer);

    // Assert
    expect(result.userName).toBeNull();
    expect(result.professionalName).toBeNull();
    // Los ids crudos siguen presentes — solo el nombre resuelto falta.
    expect(result.userId).toBe(1);
    expect(result.professionalId).toBe(5);
  });

  it('no debe filtrar la fila cruda de user/professional en la respuesta (hallazgo colateral corregido)', () => {
    // Arrange — antes del fix, `{...rating}` copiaba el objeto Users/Professionals completo
    // (email, teléfono, etc.) porque un cast sin plainToInstance no filtra nada solo.
    const result = mapRatingToResponse(buildRating(), privilegedViewer);

    // Assert
    expect((result as unknown as Record<string, unknown>).user).toBeUndefined();
    expect(
      (result as unknown as Record<string, unknown>).professional,
    ).toBeUndefined();
  });

  it('mapRatingsToResponse debe aplicar el mismo criterio a cada elemento de la lista', () => {
    // Arrange
    const ratings = [
      buildRating(),
      buildRating({ id: 2, referenceId: 'rating-ref-2', isAnonymous: true }),
    ];

    // Act
    const result = mapRatingsToResponse(ratings, strangerViewer);

    // Assert
    expect(result[0].userName).toBe('Juan Pérez');
    expect(result[1].userName).toBeNull();
  });
});
