// moved from models/portfolio-params.model.ts
// PortfolioParams for portfolio module

export interface GetPortfoliosParams {
  filter: Record<string, unknown>;
  userId?: string; // Optional user ID for filtering
}

export interface PortfolioImage {
  id?: string;
  imagePath: string;
  portfolioId?: string;
  createdAt?: Date | string;
}

export interface PortfolioData {
  id?: string;
  userId: string;
  tenantId?: string;
  salonId?: string;
  images: (string | PortfolioImage)[];
  description: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreatePortfolioParams {
  data: Omit<PortfolioData, 'id'>;
  userId: string; // The ID of the user creating the portfolio
}

export interface UpdatePortfolioParams {
  id: string;
  data: Partial<Omit<PortfolioData, 'id'>>;
  userId: string; // The ID of the user updating the portfolio
}

export interface DeletePortfolioParams {
  id: string;
  userId: string; // The ID of the user deleting the portfolio
}

export interface GetPortfolioByIdParams {
  id: string;
  userId?: string; // Optional user ID for ownership validation
}
