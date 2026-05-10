export interface UpdateUserProfileParams {
  id: string;
  name?: string;
  email?: string;
  contact?: string;
  password?: string;
  profilePicture?: File | null;
}
