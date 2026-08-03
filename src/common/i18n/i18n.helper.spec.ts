import * as fs from 'fs';
import * as path from 'path';

import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext, I18nModule, I18nService } from 'nestjs-i18n';
import { I18nMessageFormat } from 'nestjs-i18n/dist/utils';

import { I18nConfig } from '@core/config/i18n.config';
import {
  DEFAULT_LANGUAGE,
  I18N_PATH,
  SUPPORTED_LANGUAGES,
  resetFallbackCatalogForTests,
  t,
  translateValidationConstraints,
} from './i18n.helper';

/** Aplana un catálogo de un idioma a `{ 'dominio.CLAVE': 'texto' }`. */
const readCatalog = (lang: string): Record<string, string> => {
  const dir = path.join(I18N_PATH, lang);
  const flat: Record<string, string> = {};

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const domain = path.basename(file, '.json');
    const parsed = JSON.parse(
      fs.readFileSync(path.join(dir, file), 'utf8'),
    ) as Record<string, string>;
    for (const [key, value] of Object.entries(parsed))
      flat[`${domain}.${key}`] = value;
  }

  return flat;
};

describe('i18n.helper', () => {
  afterEach(() => {
    jest.clearAllMocks();
    resetFallbackCatalogForTests();
  });

  describe('t() fuera del ciclo de vida de un request', () => {
    it('debe resolver el mensaje en español desde el catálogo de respaldo', () => {
      // Arrange
      const key = 'users.NOT_FOUND';

      // Act
      const message = t(key);

      // Assert
      expect(message).toBe('Usuario no encontrado.');
    });

    it('debe interpolar los argumentos dentro del mensaje de respaldo', () => {
      // Arrange
      const key = 'users.ID_NOT_FOUND';

      // Act
      const message = t(key, { id: 42 });

      // Assert
      expect(message).toBe('Usuario con ID 42 no encontrado.');
    });

    it('debe unir con comas los argumentos de tipo arreglo', () => {
      // Arrange
      const key = 'roles-permission.ROLES_NOT_FOUND_OR_INACTIVE';

      // Act
      const message = t(key, { invalidRoles: ['admin', 'soporte'] });

      // Assert
      expect(message).toBe(
        'Los siguientes roles no existen o están inactivos: admin, soporte',
      );
    });

    it('debe devolver la clave cruda cuando no existe traducción', () => {
      // Arrange
      const key = 'users.CLAVE_QUE_NO_EXISTE';

      // Act
      const message = t(key);

      // Assert
      expect(message).toBe(key);
    });
  });

  describe('t() dentro de un request con idioma negociado', () => {
    let testingModule: TestingModule;
    let i18nService: I18nService;
    let messageFormat: I18nMessageFormat;

    beforeAll(async () => {
      testingModule = await Test.createTestingModule({
        imports: [I18nModule.forRoot(I18nConfig.getOptions())],
      }).compile();
      await testingModule.init();

      i18nService = testingModule.get(I18nService);
      messageFormat = testingModule.get(I18nMessageFormat);
    });

    afterAll(async () => {
      await testingModule.close();
    });

    /** Ejecuta `fn` con un `I18nContext` real (sin mocks) del idioma indicado. */
    const withLanguage = <T>(lang: string, fn: () => T): Promise<T> =>
      I18nContext.createAsync(
        new I18nContext(lang, i18nService, messageFormat),
        () => Promise.resolve(fn()),
      );

    it('debe traducir al inglés cuando el idioma negociado es "en"', async () => {
      // Arrange
      const key = 'auth.INVALID_CREDENTIALS';

      // Act
      const message = await withLanguage('en', () => t(key));

      // Assert
      expect(message).toBe('Invalid credentials.');
    });

    it('debe traducir al español cuando el idioma negociado es "es"', async () => {
      // Arrange
      const key = 'auth.INVALID_CREDENTIALS';

      // Act
      const message = await withLanguage('es', () => t(key));

      // Assert
      expect(message).toBe('Credenciales inválidas.');
    });

    it('debe interpolar los argumentos en el idioma negociado', async () => {
      // Arrange
      const key = 'users.ID_NOT_FOUND';

      // Act
      const message = await withLanguage('en', () => t(key, { id: 7 }));

      // Assert
      expect(message).toBe('User with ID 7 not found.');
    });

    it('debe caer al idioma por defecto cuando el idioma no está soportado', () => {
      // Arrange
      const key = 'auth.INVALID_CREDENTIALS';

      // Act
      const message = i18nService.translate(key, { lang: 'pt' });

      // Assert
      expect(message).toBe('Credenciales inválidas.');
    });
  });

  describe('translateValidationConstraints()', () => {
    it('debe traducir los mensajes generados por i18nValidationMessage', () => {
      // Arrange
      const constraints = {
        isNotEmpty: 'validation.BLOCK_REASON_REQUIRED|{"value":""}',
      };

      // Act
      const translated = translateValidationConstraints(constraints);

      // Assert
      expect(translated).toEqual({
        isNotEmpty: 'El motivo de bloqueo es obligatorio',
      });
    });

    it('debe dejar intactos los mensajes por defecto de class-validator', () => {
      // Arrange
      const constraints = { isString: 'reason must be a string' };

      // Act
      const translated = translateValidationConstraints(constraints);

      // Assert
      expect(translated).toEqual(constraints);
    });

    it('debe devolver undefined cuando no hay constraints', () => {
      // Arrange & Act
      const translated = translateValidationConstraints(undefined);

      // Assert
      expect(translated).toBeUndefined();
    });
  });

  describe('integridad del catálogo', () => {
    it('debe exponer una carpeta por cada idioma soportado', () => {
      // Arrange
      const languages = fs
        .readdirSync(I18N_PATH, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      // Act & Assert
      expect(languages.sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
    });

    it('debe tener exactamente las mismas claves en español y en inglés', () => {
      // Arrange
      const spanishKeys = Object.keys(readCatalog(DEFAULT_LANGUAGE)).sort();
      const englishKeys = Object.keys(readCatalog('en')).sort();

      // Act & Assert
      expect(englishKeys).toEqual(spanishKeys);
    });

    it('debe usar los mismos placeholders de interpolación en ambos idiomas', () => {
      // Arrange
      const spanish = readCatalog(DEFAULT_LANGUAGE);
      const english = readCatalog('en');
      const placeholders = (text: string): string[] =>
        [...text.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]).sort();

      // Act
      const mismatched = Object.keys(spanish).filter(
        (key) =>
          placeholders(spanish[key]).join(',') !==
          placeholders(english[key]).join(','),
      );

      // Assert
      expect(mismatched).toEqual([]);
    });

    it('no debe tener traducciones vacías en ningún idioma', () => {
      // Arrange
      const catalogs = SUPPORTED_LANGUAGES.map((lang) => readCatalog(lang));

      // Act
      const empty = catalogs.flatMap((catalog) =>
        Object.entries(catalog)
          .filter(([, value]) => typeof value !== 'string' || !value.trim())
          .map(([key]) => key),
      );

      // Assert
      expect(empty).toEqual([]);
    });
  });
});
