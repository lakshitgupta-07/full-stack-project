import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { map, catchError, of } from "rxjs";

import { AuthService } from "../services/auth.service";
import { AuthStateService } from "../services/auth-state.service";
import { UserService } from "../services/user.service";
import { SocketService } from "../services/socket.service";
import { ChatService } from "../services/chat.service";

export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const socketService = inject(SocketService);
  const chatService = inject(ChatService);

  if(authState.user) {
    if (!socketService.isConnected()) {
      socketService.connect(authState.user.accessToken);
      socketService.initializeChatListeners(chatService);
    }
    return of(true)
  }
  return userService.getCurrentUser().pipe(
    map((response) => {
      authState.setUser(response.data);
      if (response.data && response.data.accessToken) {
        socketService.connect(response.data.accessToken);
        socketService.initializeChatListeners(chatService);
      }
      return true;
    }),
    catchError(() => {
      authState.setUser(null);
      return of(router.createUrlTree(['/login']));
    })
  );
};