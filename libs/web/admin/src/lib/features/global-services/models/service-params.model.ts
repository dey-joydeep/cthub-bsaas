export interface SaveServiceParams {
  name: string;
  description?: string;
  duration: number;
  price: number;
}

export interface ServiceParams {
  id?: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  salonId?: string;
}
