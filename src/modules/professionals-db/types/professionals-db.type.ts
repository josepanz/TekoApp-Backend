import { Prisma } from '@prisma/client';

export const professionalWithRelationsInclude = {
  user: true,
  category: true,
} satisfies Prisma.ProfessionalsInclude;

export type ProfessionalWithRelations = Prisma.ProfessionalsGetPayload<{
  include: typeof professionalWithRelationsInclude;
}>;

export const professionalServicesInclude = {
  users: true,
  category: true,
} satisfies Prisma.ServicesInclude;

export type ProfessionalServiceWithRelations = Prisma.ServicesGetPayload<{
  include: typeof professionalServicesInclude;
}>;

export const professionalReviewsInclude = {
  user: true,
  service: true,
} satisfies Prisma.RatingInclude;

export type ProfessionalReviewWithRelations = Prisma.RatingGetPayload<{
  include: typeof professionalReviewsInclude;
}>;
