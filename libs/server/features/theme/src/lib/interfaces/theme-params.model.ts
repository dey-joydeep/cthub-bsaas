// moved from models/theme-params.model.ts
// ThemeParams for theme module

export interface GetThemesParams {
  filter: Record<string, any>;
}

export interface CreateThemeParams {
  data: {
    name: string;
    colors: Record<string, string>;
    isActive?: boolean;
  };
}

export interface UpdateThemeParams {
  id: string;
  data: Partial<Omit<CreateThemeParams['data'], 'id'>>;
}

export interface DeleteThemeParams {
  id: string;
}

export interface GetThemeByIdParams {
  id: string;
}
