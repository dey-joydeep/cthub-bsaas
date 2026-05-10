export interface ForgotPasswordParams {
  email: string;
  resetUrl: string;
}

export interface ResetPasswordParams {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
