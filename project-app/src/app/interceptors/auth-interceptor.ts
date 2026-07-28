import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const cloned = req.clone({
    withCredentials: true,
  });
  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }
      if (req.url.includes('/refresh-token')) {
        return throwError(() => err);
      }
      return http
        .post(
          'http://localhost:8000/api/v1/auth/refresh-token',
          {},
          {
            withCredentials: true,
          },
        )
        .pipe(
          switchMap(() => {
            return next(cloned);
          }),
          catchError((err) => {
            return throwError(() => err);
          }),
        );
    }),
  );
};
