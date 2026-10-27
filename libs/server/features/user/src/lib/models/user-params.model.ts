// moved from models/user-params.model.ts

export interface GetUsersParams {
  filter: Record<string, any>;
}

export interface GetUserByIdParams {
  id: string;
}

export interface CreateUserParams {
  data: Partial<import('./user.model').User>;
}

export interface UpdateUserParams {
  id: string;
  data: Partial<import('./user.model').User>;
}

export interface DeleteUserParams {
  id: string;
}
