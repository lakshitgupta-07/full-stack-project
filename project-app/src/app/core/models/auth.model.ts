export interface RegisterRequest {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface authUser {
  skills: any;
  address: any;
  avatar: any;
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
}

export interface LoginRequest {
  email: string,
  password: string
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}
