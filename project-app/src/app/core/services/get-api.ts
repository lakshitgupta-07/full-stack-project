import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environment/envirenment';

@Injectable({
  providedIn: 'root',
})
export class GetApi {

  http = inject(HttpClient);

  prefix = `${environment.apiUrl}/employee`;

  getEmployee(page: number = 1, limit: number = 20) {
    return this.http.get(`${this.prefix}?page=${page}&limit=${limit}`, { withCredentials: true });
  }

  addEmployee(data: any) {
    return this.http.post(this.prefix, data, { withCredentials: true });
  }

  deleteEmployee(id: string | number) {
    return this.http.delete(`${this.prefix}/${id}`, { withCredentials: true });
  }

  updateEmployee(id: string | number, data: any) {
    return this.http.put(
      `${this.prefix}/${id}`,
      data,
      { withCredentials: true }
    );
  }
}
