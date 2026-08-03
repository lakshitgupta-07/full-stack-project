import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme';
import { SocketService } from './core/services/socket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isDarkMode = false;
  private socketService = inject(SocketService)
  constructor(private themeService: ThemeService) {
    this.themeService.darkMode$.subscribe(mode => {
      this.isDarkMode = mode;
    })
  }
  // ngOnInit(): void {
  //   this.socketService.connect()
  //   this.socketService.listen(
  //     "userRegistered",
  //     (data) => {
  //       console.log("New User Registered", data);
  //     }
  //   )
  // }
}
