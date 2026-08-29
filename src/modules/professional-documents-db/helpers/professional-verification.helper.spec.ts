import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalVerificationHelper } from './professional-verification.helper';
import { ProfessionalDocumentsDbService } from '../services/professional-documents-db.service';
import { ProfessionalDocumentTypesDbService } from '@modules/professional-document-types-db/services/professional-document-types-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';

const mockHasActiveApproved = jest.fn();
const mockFindApplicableForCategory = jest.fn();
const mockFindById = jest.fn();
const mockUpdate = jest.fn();

describe('ProfessionalVerificationHelper', () => {
  let helper: ProfessionalVerificationHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalVerificationHelper,
        {
          provide: ProfessionalDocumentsDbService,
          useValue: { hasActiveApproved: mockHasActiveApproved },
        },
        {
          provide: ProfessionalDocumentTypesDbService,
          useValue: {
            findApplicableForCategory: mockFindApplicableForCategory,
          },
        },
        {
          provide: ProfessionalsDbService,
          useValue: { findById: mockFindById, update: mockUpdate },
        },
      ],
    }).compile();

    helper = module.get<ProfessionalVerificationHelper>(
      ProfessionalVerificationHelper,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('debe pasar a true cuando no hay ningún tipo requerido aplicable (vacuamente cumplido)', async () => {
    // Arrange
    mockFindById.mockResolvedValue({
      id: 1,
      categoryId: 3,
      requiredDocumentsVerified: false,
    });
    mockFindApplicableForCategory.mockResolvedValue([
      { id: 10, isRequired: false },
    ]);

    // Act
    await helper.recompute(1);

    // Assert
    expect(mockUpdate).toHaveBeenCalledWith(1, {
      requiredDocumentsVerified: true,
    });
  });

  it('debe quedar false si falta la aprobación de algún tipo requerido', async () => {
    // Arrange
    mockFindById.mockResolvedValue({
      id: 1,
      categoryId: 3,
      requiredDocumentsVerified: true,
    });
    mockFindApplicableForCategory.mockResolvedValue([
      { id: 10, isRequired: true },
      { id: 11, isRequired: true },
    ]);
    mockHasActiveApproved.mockImplementation(
      (_professionalId: number, typeId: number) =>
        Promise.resolve(typeId === 10),
    );

    // Act
    await helper.recompute(1);

    // Assert
    expect(mockUpdate).toHaveBeenCalledWith(1, {
      requiredDocumentsVerified: false,
    });
  });

  it('debe pasar a true cuando todos los tipos requeridos están aprobados y vigentes', async () => {
    // Arrange
    mockFindById.mockResolvedValue({
      id: 1,
      categoryId: 3,
      requiredDocumentsVerified: false,
    });
    mockFindApplicableForCategory.mockResolvedValue([
      { id: 10, isRequired: true },
    ]);
    mockHasActiveApproved.mockResolvedValue(true);

    // Act
    await helper.recompute(1);

    // Assert
    expect(mockUpdate).toHaveBeenCalledWith(1, {
      requiredDocumentsVerified: true,
    });
  });

  it('no debe escribir si el valor recalculado es igual al actual', async () => {
    // Arrange
    mockFindById.mockResolvedValue({
      id: 1,
      categoryId: 3,
      requiredDocumentsVerified: true,
    });
    mockFindApplicableForCategory.mockResolvedValue([
      { id: 10, isRequired: true },
    ]);
    mockHasActiveApproved.mockResolvedValue(true);

    // Act
    await helper.recompute(1);

    // Assert
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
