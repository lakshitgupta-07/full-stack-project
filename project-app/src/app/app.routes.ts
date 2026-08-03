import { Routes } from '@angular/router';
import { Login } from './login/login';
import { SignUp } from './sign-up/sign-up';
import { authGuard } from './core/guards/auth-guard';
import { LandingPage } from './landing-page/landing-page';
// import { GetApi } from './service/get-api';
import { ProfilePage } from './profile-page/profile-page';
import { VerifyEmailComponent } from './verify-email/verify-email';
import { ChangePasswordComponent } from './change-password/change-password';
import { ParentComponent } from './parent-component/parent-component';
import { ResendVerification } from './resend-verification/resend-verification';
import { guestGuard } from './core/guards/guest-guard-guard';
import { ChatPage } from './chat/chat-page/chat-page';

export const routes: Routes = [
  {
    path: '',
    component: LandingPage,
    canActivate: [guestGuard],
  },

  { path: 'login', component: Login, canActivate: [guestGuard], },
  { path: 'signUp', component: SignUp, canActivate: [guestGuard], },
  { path: 'verify-email/:token', component: VerifyEmailComponent },
  {
    path: 'connect',
    loadComponent: () => import("./connect/connect").then(m => m.Connect)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'resend-verification',
    component: ResendVerification,
    canActivate: [guestGuard],
  },
  {
    path: 'homePage',
    loadComponent: () => import('./home-page/home-page').then((m) => m.HomePage),
    canActivate: [authGuard],
  },
  {
    path: 'chat',
    component: ChatPage,
    canActivate: [authGuard]
  },
  {
    path: 'change-password',
    loadComponent: () =>import('./change-password/change-password').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard]
  },
  { path:'profile', component:ProfilePage, canActivate: [authGuard] },
  { path:'parentcomponent', component:ParentComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
