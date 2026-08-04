export interface chatImage {
    url: string,
    publicId: string
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}