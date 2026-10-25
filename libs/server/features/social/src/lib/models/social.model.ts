// Social model for social module

export interface Social {
  id: string;
  userId: string;
  platform: string;
  handle: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}
