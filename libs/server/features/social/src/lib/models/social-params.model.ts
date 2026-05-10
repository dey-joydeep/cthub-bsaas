// moved from models/social-params.model.ts
// SocialParams for social module

export interface GetSocialsParams {
  filter: Record<string, any>;
}

export interface CreateSocialParams {
  data: {
    userId: string;
    platform: string;
    handle: string;
    url?: string;
  };
}

export interface UpdateSocialParams {
  id: string;
  data: Partial<Omit<CreateSocialParams['data'], 'id'>>;
}

export interface DeleteSocialParams {
  id: string;
}

export interface GetSocialByIdParams {
  id: string;
}
