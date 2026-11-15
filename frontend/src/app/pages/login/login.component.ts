import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LOGIN_BRAND } from './login-brand';

type LoginRole = 'RW' | 'RT' | 'DASAWISMA' | 'JUMANTIK' | 'PPSU' | 'STAF';

interface RoleCard {
  id: LoginRole;
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  iconBg: string;
  icon: string;
  tugas: string[];
  demos: Array<{ email: string; label: string; hint: string }>;
  panelTitle: string;
  panelBlurb: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    id: 'STAF',
    title: 'Staf Kelurahan',
    subtitle: 'Lurah / Sekkel / Kasi',
    badge: 'ADM',
    accent: 'border-blue-300 bg-blue-50 hover:border-blue-500',
    iconBg: 'bg-blue-100 text-blue-800',
    icon: 'SI',
    tugas: [
      'Monitoring Lurah: radar, perintah, PSN/DAOP/PPSU — satu pantauan',
      'Reporting & export laporan resmi bila diperlukan',
      'Surat Keluar → sebar ke RW, Ketua RT, dan LMK + agenda Sekkel',
    ],
    demos: [
      {
        email: 'sekkel@kelurahan.id',
        label: 'Sekkel — Maya Kartika (Surat Keluar + agenda)',
        hint: 'sekkel@kelurahan.id · sekkel123',
      },
      {
        email: 'lurah@kelurahan.id',
        label: 'Lurah — Sariman, S.Sos, M.Si (monitoring + laporan)',
        hint: 'lurah@kelurahan.id · admin123',
      },
    ],
    panelTitle: 'Portal Staf Kelurahan',
    panelBlurb:
      'Lurah pantau & laporan operasional; Sekkel sebar surat ke portal RW, Ketua RT, dan LMK.',
  },
  {
    id: 'RW',
    title: 'Ketua RW',
    subtitle: 'Koordinasi wilayah & DAOP RW',
    badge: 'RW',
    accent: 'border-sky-300 bg-sky-50 hover:border-sky-500',
    iconBg: 'bg-sky-100 text-sky-800',
    icon: 'RW',
    tugas: [
      'Rekap warga per RT + Kas RW (setoran / santunan)',
      'Surat dari kelurahan → share ke Ketua RT / grup BOD',
      'DAOP tingkat RW + pantauan wilayah',
    ],
    demos: [
      {
        email: 'rw07@kelurahan.id',
        label: 'Ketua RW 07 — Susilo',
        hint: 'rw07@kelurahan.id · rw123',
      },
    ],
    panelTitle: 'Portal Ketua RW',
    panelBlurb: 'Kesimpulan warga & kas tiap RT — plus buku kas RW (bukan menu RT).',
  },
  {
    id: 'RT',
    title: 'Ketua RT',
    subtitle: 'Data warga + DAOP digital',
    badge: 'RT',
    accent: 'border-amber-300 bg-amber-50 hover:border-amber-500',
    iconBg: 'bg-amber-100 text-amber-900',
    icon: 'Rp',
    tugas: [
      'Data warga (NIK/KK) + surat SK/SKD/kematian',
      'Surat undangan dari Lurah/Sekkel (langsung ke portal RT)',
      'Kas RT + DAOP bulanan RT',
    ],
    demos: [
      {
        email: 'rt01@kelurahan.id',
        label: 'Ketua RT001/RW 07 — Muhamad Ardhi',
        hint: 'rt01@kelurahan.id · rt123',
      },
    ],
    panelTitle: 'Portal Ketua RT',
    panelBlurb: 'Digitalisasi kepengurusan RT: data warga + DAOP — tanpa tumpukan fotokopi.',
  },
  {
    id: 'DASAWISMA',
    title: 'Dasawisma / PKK',
    subtitle: 'Bantu pendataan warga RT',
    badge: 'PKK',
    accent: 'border-rose-300 bg-rose-50 hover:border-rose-500',
    iconBg: 'bg-rose-100 text-rose-800',
    icon: 'PK',
    tugas: [
      'Catat warga tetap / kos ke buku digital RT',
      'Bantu RT mengarsipkan data (bukan verifikasi akhir)',
      'Cari data warga untuk keperluan lapangan',
    ],
    demos: [
      {
        email: 'dasawisma@kelurahan.id',
        label: 'Dasawisma RT001/RW 07 — Ibu Sulastri',
        hint: 'dasawisma@kelurahan.id · dasa123',
      },
    ],
    panelTitle: 'Portal Dasawisma / PKK',
    panelBlurb: 'Tim PKK bantu isi data; Ketua RT yang menyahkan / verifikasi kos.',
  },
  {
    id: 'JUMANTIK',
    title: 'Staff Jumantik',
    subtitle: 'Kader keliling · input PSN',
    badge: 'PSN',
    accent: 'border-emerald-300 bg-emerald-50 hover:border-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-800',
    icon: 'JN',
    tugas: [
      'Input pemeriksaan jentik per rumah (Jumat PSN)',
      'Wajib unggah foto bukti dari lapangan',
      'Pantau ABJ & zona merah RT sendiri',
    ],
    demos: [
      {
        email: 'jumantik@kelurahan.id',
        label: 'Kader Jumantik — Sari',
        hint: 'jumantik@kelurahan.id · jumantik123',
      },
    ],
    panelTitle: 'Portal Staff Jumantik',
    panelBlurb: 'Input PSN saat keliling rumah warga — terpisah dari tugas Ketua RT.',
  },
  {
    id: 'PPSU',
    title: 'Staff PPSU',
    subtitle: 'Lapangan · laporan kerja & gudang',
    badge: 'PPSU',
    accent: 'border-indigo-300 bg-indigo-50 hover:border-indigo-500',
    iconBg: 'bg-indigo-100 text-indigo-800',
    icon: 'PS',
    tugas: [
      'Lapor kerja ploting rutin / urgensi RW + foto GPS',
      'Pinjam & kembalikan alat gudang',
      'Ketua Bidang: cetak rekap PDF + Master stok alat & petugas PPSU',
    ],
    demos: [
      {
        email: 'ppsu@kelurahan.id',
        label: 'Petugas Lapangan — Joko',
        hint: 'Lapangan saja · ppsu@kelurahan.id · ppsu123',
      },
      {
        email: 'ppsu.koord@kelurahan.id',
        label: 'Ketua Bidang PPSU — Bambang',
        hint: 'Master alat + petugas + PDF · ppsukoord123',
      },
    ],
    panelTitle: 'Portal Staff PPSU',
    panelBlurb: 'Dokumentasi kerja lapangan, aset gudang, dan rekap operasional.',
  },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section
        class="relative hidden min-h-screen overflow-hidden border-r border-slate-200/80 lg:flex lg:flex-col"
        [class]="panelGradient()"
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
                {{ activeCard()?.panelTitle || brand.judul }}
              </h1>
              <p class="mt-3 max-w-md text-justify text-base font-medium leading-relaxed text-slate-700">
                {{ activeCard()?.panelBlurb || brand.blurb }}
              </p>

              @if (activeCard(); as card) {
                <ul class="mt-8 space-y-3">
                  @for (t of card.tugas; track t) {
                    <li
                      class="flex gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3.5 text-base leading-relaxed text-slate-800 shadow-sm shadow-slate-200/60 ring-1 ring-slate-100"
                    >
                      <span
                        class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white"
                        >✓</span
                      >
                      <span>{{ t }}</span>
                    </li>
                  }
                </ul>
              } @else {
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
              }
            </div>
          </div>
          <p class="pt-10 text-sm text-slate-500">{{ brand.footer }}</p>
        </div>
      </section>

      <section class="flex items-start justify-center bg-slate-50 px-4 py-8 sm:px-8 lg:items-center lg:py-12">
        <div class="w-full max-w-md">
          <div class="mb-6 lg:hidden">
            <p class="text-3xl font-extrabold tracking-tight text-blue-700">{{ brand.produk }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ brand.tempat }}</p>
            <h1 class="mt-4 text-xl font-bold leading-snug text-slate-900">
              {{ activeCard()?.panelTitle || brand.judul }}
            </h1>
            <p class="mt-2 text-justify text-sm font-medium leading-relaxed text-slate-700">
              {{ activeCard()?.panelBlurb || brand.blurb }}
            </p>
          </div>

          <div class="card">
            @if (!role()) {
              <a
                routerLink="/login-production"
                class="mb-5 flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
              >
                <span>Preview login production</span>
                <span aria-hidden="true">→</span>
              </a>
              <h2 class="text-xl font-extrabold tracking-tight text-slate-900">Masuk sebagai</h2>
              <p class="mt-1.5 text-sm leading-relaxed text-slate-500">
                Mode demo — pilih peran dulu, lalu akun contoh.
              </p>
              <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
                <strong class="text-slate-800">Demo JATI.</strong> Untuk pitch: pilih peran lalu pakai akun contoh.
                <a class="mt-1.5 block font-semibold text-blue-700 hover:underline" href="/cara-coba.html" target="_blank" rel="noopener"
                  >Panduan singkat (1 halaman)</a
                >
              </div>

              <div class="mt-5 grid gap-2.5">
                @for (card of roles; track card.id) {
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition"
                    [class]="card.accent"
                    (click)="pilihPeran(card.id)"
                  >
                    <span
                      class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
                      [class]="card.iconBg"
                    >
                      {{ card.icon }}
                    </span>
                    <span class="min-w-0">
                      <span class="block font-bold text-slate-900">{{ card.title }}</span>
                      <span class="block text-xs text-slate-600">{{ card.subtitle }}</span>
                    </span>
                  </button>
                }
              </div>
            } @else {
              @if (activeCard(); as card) {
                <button
                  type="button"
                  class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"
                  (click)="kembaliPilih()"
                >
                  ← Ganti peran
                </button>

                <div class="flex items-start gap-3">
                  <span
                    class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
                    [class]="card.iconBg"
                  >
                    {{ card.icon }}
                  </span>
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Portal {{ card.badge }}</p>
                    <h2 class="text-xl font-extrabold text-slate-900">{{ card.title }}</h2>
                    <p class="mt-0.5 text-sm text-slate-500">{{ card.subtitle }}</p>
                  </div>
                </div>

                <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Tugas di portal ini</p>
                  <ul class="mt-2 space-y-1.5">
                    @for (t of card.tugas; track t) {
                      <li class="flex gap-2 text-sm text-slate-700">
                        <span class="font-bold text-emerald-600">·</span>
                        <span>{{ t }}</span>
                      </li>
                    }
                  </ul>
                </div>

                <h3 class="mt-5 text-sm font-bold text-slate-900">Masuk dengan akun staf</h3>
                <p class="mt-1 text-xs text-slate-500">
                  Isi email &amp; kata sandi akun demo, atau tekan tombol masuk cepat di bawah.
                </p>
                <form class="mt-3 space-y-3" (ngSubmit)="submit()">
                  <div>
                    <label class="field-label" for="email">Email staf</label>
                    <input
                      id="email"
                      class="field-input"
                      type="email"
                      [(ngModel)]="email"
                      name="email"
                      autocomplete="username"
                      placeholder="contoh: sekkel@kelurahan.id"
                    />
                  </div>
                  <div>
                    <label class="field-label" for="password">Kata sandi</label>
                    <input
                      id="password"
                      class="field-input"
                      type="password"
                      [(ngModel)]="password"
                      name="password"
                      autocomplete="current-password"
                      placeholder="Kata sandi akun demo"
                    />
                  </div>
                  @if (error()) {
                    <p class="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{{ error() }}</p>
                  }
                  <button class="btn-primary w-full" type="submit">Masuk ke portal {{ card.title }}</button>
                </form>

                <div class="mt-5">
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Masuk cepat (akun contoh)</p>
                  <div class="mt-2 grid gap-2">
                    @for (d of card.demos; track d.email) {
                      <button type="button" class="quick-pill" (click)="quick(d.email)">
                        <span class="quick-icon" [class]="card.iconBg">{{ card.icon }}</span>
                        <span class="min-w-0 text-left">
                          <span class="block font-bold text-slate-900">{{ d.label }}</span>
                          <span class="block text-xs text-slate-500">{{ d.hint }}</span>
                        </span>
                      </button>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .quick-pill {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        border-radius: 9999px;
        border: 1px solid #e2e8f0;
        background: #fff;
        padding: 0.75rem 1rem;
        transition:
          border-color 0.15s,
          background 0.15s,
          transform 0.1s;
      }
      .quick-pill:hover {
        border-color: #93c5fd;
        background: #f8fafc;
      }
      .quick-pill:active {
        transform: scale(0.99);
      }
      .quick-icon {
        display: inline-flex;
        height: 2.5rem;
        width: 2.5rem;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 800;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly brand = LOGIN_BRAND;
  readonly roles = ROLE_CARDS;
  readonly role = signal<LoginRole | null>(null);
  readonly error = signal<string | null>(null);

  email = '';
  password = '';

  readonly activeCard = computed(() => {
    const id = this.role();
    return id ? ROLE_CARDS.find((r) => r.id === id) ?? null : null;
  });

  panelGradient(): string {
    switch (this.role()) {
      case 'RW':
        return 'bg-gradient-to-br from-[#e4f2fb] via-[#f5f9fc] to-[#eef6fb]';
      case 'RT':
        return 'bg-gradient-to-br from-[#f7efe4] via-[#fbf8f4] to-[#f3f0ea]';
      case 'DASAWISMA':
        return 'bg-gradient-to-br from-[#f8e9ed] via-[#fbf5f6] to-[#f5eef1]';
      case 'JUMANTIK':
        return 'bg-gradient-to-br from-[#e5f5ec] via-[#f4faf6] to-[#eef7f2]';
      case 'PPSU':
        return 'bg-gradient-to-br from-[#e8eaf6] via-[#f5f6fb] to-[#eef0f7]';
      case 'STAF':
        return LOGIN_BRAND.panelClass;
      default:
        return LOGIN_BRAND.panelClass;
    }
  }

  pilihPeran(id: LoginRole): void {
    this.role.set(id);
    this.error.set(null);
    const card = ROLE_CARDS.find((r) => r.id === id);
    const demo = card?.demos[0];
    this.email = demo?.email ?? '';
    this.password = '';
  }

  kembaliPilih(): void {
    this.role.set(null);
    this.error.set(null);
    this.email = '';
    this.password = '';
  }

  submit(): void {
    const result = this.auth.login(this.email, this.password);
    if (!result.ok) {
      this.error.set(result.message);
      return;
    }
    this.error.set(null);
    const user = this.auth.currentUser();
    void this.router.navigateByUrl(user ? this.auth.homePathForUser(user) : '/app/dashboard');
  }

  quick(email: string): void {
    this.auth.quickLogin(email);
  }
}
