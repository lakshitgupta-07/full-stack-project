import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { User } from "../models/user.model";

@Injectable({
  providedIn: "root",
})
export class AuthStateService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  setUser(user: User | null) {
    this.currentUserSubject.next(user);
  }

  get user() {
    return this.currentUserSubject.value;
  }
}
