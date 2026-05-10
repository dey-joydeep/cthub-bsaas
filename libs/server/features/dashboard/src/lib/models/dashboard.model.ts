// moved from models/dashboard.model.ts
// Dashboard model for dashboard module

export interface Dashboard {
  id: string;
  tenantId: string;
  metrics: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
