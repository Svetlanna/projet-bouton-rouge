import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface LoginResponse { success: boolean; message: string; }
interface ClickResponse { count: number; message: string; finished: boolean; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly http = inject(HttpClient);
  readonly loggedIn = signal(false);
  readonly loading = signal(false);
  readonly count = signal(0);
  readonly finished = signal(false);
  readonly message = signal('Un bouton. Une seule règle. Ne pas appuyer.');
  readonly error = signal('');
  username = '';
  password = '';

  login(): void {
    if (this.loading()) return;
    this.error.set('');
    this.loading.set(true);
    this.http.post<LoginResponse>('/api/login', { username: this.username, password: this.password })
      .subscribe({
        next: response => {
          this.loading.set(false);
          if (response.success) this.loggedIn.set(true);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Connexion refusée. Vérifie tes identifiants et le serveur Express.');
        }
      });
  }

  clickButton(): void {
    if (this.loading() || this.finished()) return;
    this.loading.set(true);
    this.error.set('');
    const nextCount = this.count() + 1;
    this.http.post<ClickResponse>('/api/click', { count: nextCount }).subscribe({
      next: response => {
        this.count.set(response.count);
        this.message.set(response.message);
        this.finished.set(response.finished);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Le serveur ne répond plus. Le bouton a-t-il gagné ?');
        this.loading.set(false);
      }
    });
  }

  restart(): void {
    this.count.set(0);
    this.finished.set(false);
    this.message.set('Un bouton. Une seule règle. Ne pas appuyer.');
    this.error.set('');
  }
}
