export interface ProfessionalFilters {
  categoryId?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  minRating?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProfessionalStats {
  totalServices: number;
  completedServices: number;
  totalEarnings: number;
  averageRating: number;
  totalRatings: number;
}
