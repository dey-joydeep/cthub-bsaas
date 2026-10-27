export interface SaveProductParams {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export interface ProductParams {
  id?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  salonId?: string;
}
