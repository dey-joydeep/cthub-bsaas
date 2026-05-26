export interface Salon {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly city?: string;
  readonly averageRating: number;
  readonly reviewCount: number;
  readonly services: readonly { readonly name: string }[];
  readonly latitude?: number;
  readonly longitude?: number;
  readonly location?: {
    readonly type: string;
    readonly coordinates: readonly [number, number];
  };
}
