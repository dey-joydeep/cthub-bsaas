export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface Staff {
  id: string;
  name: string;
  services: string[];
}
