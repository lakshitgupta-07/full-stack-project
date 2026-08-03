import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/auth.model';
import { environment } from '../../../environment/envirenment';
import { User } from '../models/user.model';
import { ChatUser } from '../models/chat.model';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  currentUser = signal<User | null>(null)
  getCurrentUser() {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/user/me`, {
      withCredentials: true,
    }
  )
  .pipe(
    tap((response)=> {
      this.currentUser.set(response.data)
    })
  )
  }
  changePassword(data: { oldPassword?: string; newPassword: string }) {
    return this.http.patch<ApiResponse<null>>(`${environment.apiUrl}/user/change-password`, data, {
      withCredentials: true,
    });
  }
  updateAvatar(file: File) {
    const formdata = new FormData();
    formdata.append('avatar', file);
    return this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/user/avatar`, formdata, {
      withCredentials: true,
    });
  }
  updateProfile(data: {
    username?: string;
    phoneNumber?: string;
    address?: string;
    skills?: string[];
  }) {
    return this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/user/me`, data, {
      withCredentials: true,
    });
  }

  searchUser(query: string): Observable<ChatUser[]> {
    return this.http.get<ApiResponse<ChatUser[]>>(`${environment.apiUrl}/user/search`,
      {
        params: {
          q: query
        },
        withCredentials: true
      }
    ).pipe(map(res => res.data))
  }
}
