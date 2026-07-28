import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../core/services/theme';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLinkActive, RouterOutlet, RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
  isDarkMode = false;
  constructor(private themeService: ThemeService) {
    this.themeService.darkMode$.subscribe(mode => {
      this.isDarkMode = mode;
    })
  }
  toggleTheme() {
    this.themeService.toggleTheme()
  }
}
