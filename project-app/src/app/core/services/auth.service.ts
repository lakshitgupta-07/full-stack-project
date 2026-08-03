import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { Observable } from "rxjs";
import { SocketService } from "./socket.service";
import { environment } from "../../../environment/envirenment"

import {
  RegisterRequest,
  ApiResponse,
  authUser,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LoginResponse,
} from "../models/auth.model";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  register(
    data: RegisterRequest
  ): Observable<ApiResponse<authUser>> {
    return this.http.post<ApiResponse<authUser>>(
      `${environment.apiUrl}/auth/register`,
      data
    );
  }
  verifyEmail(token: string){
    return this.http.get<ApiResponse<null>>(
      `${environment.apiUrl}/auth/verify-email/${token}`
    )
  }
  resendVerification(data: {
    email: string
  }) {
    return this.http.get<ApiResponse<null>>(
      `${environment.apiUrl}/auth/resend-verification`
    )
  }

  login(
    data: LoginRequest
  ): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(
      `${environment.apiUrl}/auth/login`,
      data,
      {
        withCredentials: true
      }
    );
  }

  logout() {
    return this.http.post(
      `${environment.apiUrl}/auth/logout`,
      {},
      {
        withCredentials: true
      }
    )
  }

  refreshToken() {
    return this.http.post(
      `${environment.apiUrl}/auth/refresh-token`,
      {},
      {
        withCredentials: true
      }
    )
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${environment.apiUrl}/auth/forgot-password`,
      data,
      {
        withCredentials:true
      }
    );
  }

  resetPassword(token: string, data: ResetPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${environment.apiUrl}/auth/reset-password/${token}`,
      data,
      {
        withCredentials: true
      }
    );
  }
}

