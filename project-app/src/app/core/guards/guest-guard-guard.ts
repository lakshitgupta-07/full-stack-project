import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { UserService } from '../services/user.service';
import { AuthStateService } from '../services/auth-state.service';

export const guestGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const authState = inject(AuthStateService);
  const router = inject(Router);
  return userService.getCurrentUser().pipe(
    map((response) => {
      authState.setUser(response.data);
      return router.createUrlTree(['/homePage'])
    }),
    catchError(() => {
      authState.setUser(null)
      return of(true)
    })
  )
};
