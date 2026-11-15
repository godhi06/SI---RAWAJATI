import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LOGIN_BRAND } from './login-brand';

/**
 * Preview UI login production (bukan ganti demo).
 * Copy panel kiri = sama dengan /login (lihat login-brand.ts).
 */
@Component({
  selector: 'app-login-production',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside
        class="relative hidden min-h-screen overflow-hidden border-r border-slate-200/80 lg:flex lg:flex-col"
        [class]="brand.panelClass"
      >
        <div class="pointer-events-none absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500"></div>
        <div class="pointer-events-none absolute -right-20 top-28 h-56 w-56 rounded-full bg-blue-400/15"></div>
        <div class="pointer-events-none absolute -left-16 bottom-24 h-48 w-48 rounded-full bg-emerald-400/12"></div>

        <div class="relative z-[1] flex flex-1 flex-col justify-between px-12 py-12 xl:px-16">
          <div class="flex flex-1 flex-col justify-center">
            <div class="max-w-lg">
              <p class="text-4xl font-extrabold tracking-tight text-blue-700 xl:text-5xl">{{ brand.produk }}</p>
              <p class="mt-1.5 text-sm font-medium text-slate-500">{{ brand.tempat }}</p>
              <h1 class="mt-6 text-[1.65rem] font-bold leading-snug text-slate-900 xl:text-[1.85rem]">
                {{ brand.judul }}
              </h1>
              <p class="mt-3 max-w-md text-justify text-base font-medium leading-relaxed text-slate-700">
                {{ brand.blurb }}
              </p>

              <ul class="mt-8 space-y-3 text-base leading-relaxed text-slate-800">
                @for (p of brand.poin; track p.judul; let i = $index) {
                  <li
                    class="flex gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3.5 shadow-sm shadow-slate-200/60 ring-1 ring-slate-100"
                  >
                    <span
                      class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white"
                      >{{ i + 1 }}</span
                    >
                    <span
                      ><strong class="font-bold text-slate-900">{{ p.judul }}</strong>
                      <span class="text-slate-600"> — {{ p.teks }}</span></span
                    >
                  </li>
                }
              </ul>
            </div>
          </div>
          <p class="pt-10 text-sm text-slate-500">{{ brand.footer }}</p>
        </div>
      </aside>

      <section class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div class="w-full max-w-md">
          <div class="mb-6 lg:hidden">
            <p class="text-3xl font-extrabold tracking-tight text-blue-700">{{ brand.produk }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ brand.tempat }}</p>
            <h1 class="mt-4 text-xl font-bold leading-snug text-slate-900">{{ brand.judul }}</h1>
            <p class="mt-2 text-justify text-sm font-medium leading-relaxed text-slate-700">{{ brand.blurb }}</p>
          </div>

          <div class="mb-5 flex items-center justify-between gap-3">
            <span
              class="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-800"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
              Preview production
            </span>
            <a routerLink="/login" class="text-sm font-semibold text-blue-700 hover:underline">← Mode demo</a>
          </div>

          <div class="card !p-0 overflow-hidden">
            <div class="border-b border-slate-100 px-6 pb-5 pt-6 sm:px-7">
              <h2 class="text-xl font-extrabold tracking-tight text-slate-900">Masuk ke JATI</h2>
              <p class="mt-1.5 text-sm leading-relaxed text-slate-500">
                Gunakan email &amp; kata sandi akun Anda. Peran otomatis mengikuti hak akses yang sudah ditetapkan.
              </p>
            </div>

            <form class="space-y-4 px-6 py-6 sm:px-7" (ngSubmit)="submit()">
              <div>
                <label class="field-label" for="prod-email">Email</label>
                <input
                  id="prod-email"
                  class="field-input"
                  type="email"
                  name="email"
                  [(ngModel)]="email"
                  autocomplete="username"
                  placeholder="nama@kelurahan.go.id atau gmail"
                  required
                />
              </div>

              <div>
                <div class="mb-1.5 flex items-center justify-between">
                  <label class="field-label !mb-0" for="prod-password">Kata sandi</label>
                  <button
                    type="button"
                    class="text-xs font-semibold text-slate-500 hover:text-blue-700"
                    (click)="toastLupa()"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div class="relative">
                  <input
                    id="prod-password"
                    class="field-input !pr-16"
                    [type]="showPass() ? 'text' : 'password'"
                    name="password"
                    [(ngModel)]="password"
                    autocomplete="current-password"
                    placeholder="Masukkan kata sandi"
                    required
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                    (click)="showPass.set(!showPass())"
                  >
                    {{ showPass() ? 'Sembunyi' : 'Lihat' }}
                  </button>
                </div>
              </div>

              <label class="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  [(ngModel)]="ingat"
                  name="ingat"
                />
                Ingat perangkat ini
              </label>

              @if (error()) {
                <p class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">
                  {{ error() }}
                </p>
              }

              <button type="submit" class="btn-primary w-full" [disabled]="loading()">
                {{ loading() ? 'Memverifikasi…' : 'Masuk' }}
              </button>
            </form>

            <div class="border-t border-slate-100 bg-slate-50 px-6 py-5 sm:px-7">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Kebijakan akun (rencana)</p>
              <ul class="mt-2.5 space-y-1.5 text-sm leading-relaxed text-slate-600">
                <li class="flex gap-2">
                  <span class="font-bold text-blue-700">·</span>
                  <span>Staf kelurahan &amp; PPSU → email resmi dinas</span>
                </li>
                <li class="flex gap-2">
                  <span class="font-bold text-blue-700">·</span>
                  <span>RW / RT / Dasawisma / Jumantik → Gmail atau email pribadi terdaftar</span>
                </li>
              </ul>
              <p class="mt-3.5 text-xs leading-relaxed text-slate-400">
                Preview UI — uji masuk masih memakai akun demo yang sama.
              </p>
            </div>
          </div>

          <p class="mt-6 text-center text-sm text-slate-500">
            Mode demo (pilih peran)?
            <a routerLink="/login" class="font-semibold text-blue-700 hover:underline">Buka mode demo</a>
          </p>
        </div>
      </section>
    </div>
  `,
})
export class LoginProductionComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly brand = LOGIN_BRAND;

  email = '';
  password = '';
  ingat = true;
  readonly showPass = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.error.set(null);
    if (!this.email.trim() || !this.password) {
      this.error.set('Email dan kata sandi wajib diisi.');
      return;
    }
    this.loading.set(true);
    window.setTimeout(() => {
      const result = this.auth.login(this.email, this.password);
      this.loading.set(false);
      if (!result.ok) {
        this.error.set(result.message + ' (Preview: gunakan akun demo yang sudah terdaftar.)');
        return;
      }
      const user = this.auth.currentUser();
      void this.router.navigateByUrl(user ? this.auth.homePathForUser(user) : '/app/dashboard');
    }, 450);
  }

  toastLupa(): void {
    this.error.set('Reset kata sandi akan tersedia di production (email / admin kelurahan).');
  }
}
