export interface InitLoginParams {
  email: string;
  password: string;
}

export interface VerifyOtpParams {
  email: string;
  password: string;
  otp: string;
}

export interface VerifyPasswordResetParams {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthParams {
  email: string;
  password: string;
  tenantId?: string;
}
