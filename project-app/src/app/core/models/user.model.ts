export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface Avatar {
  url: string;
  publicId: string
}

export interface User {
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
  address?: string;
  skills?: string[];
  avatar?: Avatar;
  hasPassword?: boolean;
  provider?: string | null;
  googleId?: string | null;
  accessToken: string
}

