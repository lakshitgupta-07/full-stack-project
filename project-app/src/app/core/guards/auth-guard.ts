import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { map, catchError, of } from "rxjs";

import { AuthService } from "../services/auth.service";
import { AuthStateService } from "../services/auth-state.service";
import { UserService } from "../services/user.service";

export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return userService.getCurrentUser().pipe(
    map((response) => {
      authState.setUser(response.data);
      return true;
    }),
    catchError(() => {
      authState.setUser(null);
      return of(router.createUrlTree(['/login']));
    })
  );
};