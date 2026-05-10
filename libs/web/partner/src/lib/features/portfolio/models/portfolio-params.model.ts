export interface CreatePortfolioParams {
  title: string;
  description: string;
  images: File[];
  salonId: string;
}

export interface UpdatePortfolioParams {
  id: string;
  title?: string;
  description?: string;
  images?: File[];
}
