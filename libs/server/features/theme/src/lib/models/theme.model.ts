// moved from models/theme.model.ts
// Theme model for theme module

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
