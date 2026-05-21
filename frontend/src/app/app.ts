import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent], // <--- ต้องมีอันนี้
  templateUrl: './app.html', // <--- เช็คชื่อไฟล์ดีๆ ว่าตรงกับไฟล์จริงไหม
  styleUrl: './app.css'
})
export class App {
  title = 'green-office-app';
}