import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private darkMode = new BehaviorSubject<boolean>(false);

  darkMode$ = this.darkMode.asObservable();

  constructor() {

    const savedTheme = localStorage.getItem('theme');

    if(savedTheme === 'dark') {
      this.darkMode.next(true);
    }

  }

  toggleTheme() {

    const current = this.darkMode.value;

    this.darkMode.next(!current);

    localStorage.setItem(
      'theme',
      !current ? 'dark' : 'light'
    );

  }

}