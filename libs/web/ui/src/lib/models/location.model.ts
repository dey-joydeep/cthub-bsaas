export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: Coordinates;
  formattedAddress?: string;
  isPrimary?: boolean;
}

export interface City {
  id: string;
  name: string;
  stateCode?: string;
  country: string;
  countryCode: string;
  coordinates?: Coordinates;
  population?: number;
  timezone?: string;
  isActive?: boolean;
}

export interface Country {
  code: string;
  name: string;
  nativeName?: string;
  phoneCode: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  isActive: boolean;
}

export interface Language {
  code: string;
  name: string;
  nativeName?: string;
  rtl: boolean;
  isActive: boolean;
  flag?: string;
}

export interface Timezone {
  name: string;
  offset: string;
  offsetMinutes: number;
  isDst: boolean;
  abbreviation: string;
  currentTime: string;
}
