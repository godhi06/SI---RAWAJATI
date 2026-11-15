import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { UserRole } from '../core/models';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-50 lg:flex">
      @if (!isPpsuLapanganOnly()) {
        <aside class="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div class="border-b border-slate-100 px-5 py-5">
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-sm font-extrabold text-white shadow-soft"
              >
                SI
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">SI-RAWAJATI</p>
                <h1 class="truncate text-base font-bold text-slate-900">{{ data.kelurahan.nama }}</h1>
              </div>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-slate-500">
              Kecamatan {{ data.kelurahan.kecamatan }}, Kota Administrasi {{ data.kelurahan.kota }}
            </p>
          </div>

          <nav class="flex-1 space-y-1 overflow-y-auto p-3">
            @for (item of visibleNav(); track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-blue-50 text-blue-800 ring-1 ring-blue-100"
                [routerLinkActiveOptions]="{ exact: item.path === '/app/dashboard' }"
                class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <span
                  class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm"
                  aria-hidden="true"
                  >{{ item.icon }}</span
                >
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>

          <div class="border-t border-slate-100 p-4">
            <p class="truncate font-semibold text-slate-900">{{ auth.currentUser()?.name }}</p>
            <p class="truncate text-sm text-slate-500">{{ auth.currentUser()?.jabatan }}</p>
            <button type="button" class="btn-secondary mt-3 w-full !py-2.5 text-sm" (click)="auth.logout()">
              Keluar
            </button>
          </div>
        </aside>
      }

      <div class="flex min-w-0 flex-1 flex-col pb-28">
        <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div class="min-w-0">
              <p class="truncate text-xs font-bold uppercase tracking-wider text-blue-700">SI-RAWAJATI</p>
              <p class="truncate text-sm font-semibold text-slate-900 lg:text-base">
                {{ auth.currentUser()?.name }}
                <span class="font-normal text-slate-400">·</span>
                <span class="font-medium text-slate-500">{{ auth.currentUser()?.jabatan }}</span>
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              @if (data.toast(); as msg) {
                <div
                  class="hidden max-w-xs truncate rounded-full bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-soft sm:block"
                >
                  {{ msg }}
                </div>
              }
              <button
                type="button"
                class="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                (click)="auth.logout()"
              >
                Ganti Peran / Keluar
              </button>
            </div>
          </div>
        </header>

        <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <router-outlet />
        </main>
      </div>

      <nav
        class="fixed inset-x-3 bottom-3 z-30 grid gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-float backdrop-blur lg:hidden"
        [class.grid-cols-2]="mobileNav().length === 2"
        [class.grid-cols-3]="mobileNav().length === 3"
        [class.grid-cols-4]="mobileNav().length >= 4"
        style="padding-bottom: max(0.35rem, env(safe-area-inset-bottom))"
      >
        @for (item of mobileNav(); track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-blue-50 text-blue-700"
            class="flex min-h-tap flex-col items-center justify-center rounded-xl px-1 text-slate-500"
          >
            <span class="text-base" aria-hidden="true">{{ item.icon }}</span>
            <span class="mt-0.5 text-center text-[11px] font-semibold leading-tight">{{ item.short }}</span>
          </a>
        }
      </nav>
    </div>
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  private readonly nav: NavItem[] = [
    { label: 'Beranda', path: '/app/dashboard', icon: '▣', roles: ['ADMIN_KEL', 'KOORD_RW', 'OP_RT'] },
    {
      label: 'Data Warga RT',
      path: '/app/data-warga',
      icon: '⌂',
      roles: ['ADMIN_KEL', 'OP_RT'],
    },
    {
      label: 'Rekap Warga RW',
      path: '/app/rekap-warga-rw',
      icon: '⌂',
      roles: ['ADMIN_KEL', 'KOORD_RW'],
    },
    {
      label: 'Surat Keterangan',
      path: '/app/surat-keterangan',
      icon: '✉',
      roles: ['ADMIN_KEL', 'OP_RT'],
    },
    {
      label: 'Surat Kelurahan',
      path: '/app/surat-kelurahan-rw',
      icon: '✉',
      roles: ['ADMIN_KEL', 'KOORD_RW', 'OP_RT'],
    },
    {
      label: 'Kas RT',
      path: '/app/kas-rt',
      icon: 'Rp',
      roles: ['ADMIN_KEL', 'OP_RT'],
    },
    {
      label: 'Kas RW',
      path: '/app/kas-rw',
      icon: 'Rp',
      roles: ['ADMIN_KEL', 'KOORD_RW'],
    },
    { label: 'Radar Mingguan', path: '/app/radar', icon: '◎', roles: ['ADMIN_KEL'] },
    { label: 'Kalender Operasional', path: '/app/kalender', icon: '📅', roles: ['ADMIN_KEL', 'KOORD_RW'] },
    { label: 'Perintah & Tindak Lanjut', path: '/app/perintah', icon: '⚡', roles: ['ADMIN_KEL', 'KOORD_RW', 'PETUGAS_PPSU'] },
    { label: 'Aduan RW / Lapangan', path: '/app/pengaduan', icon: '⚑', roles: ['ADMIN_KEL', 'KOORD_RW', 'PETUGAS_PPSU'] },
    { label: 'Agenda Kelurahan', path: '/app/agenda', icon: '🗓', roles: ['ADMIN_KEL', 'KOORD_RW'] },
    { label: 'Surat Masuk Dinas', path: '/app/surat-masuk', icon: '📥', roles: ['ADMIN_KEL'] },
    { label: 'Surat Keluar', path: '/app/surat-keluar', icon: '✉', roles: ['ADMIN_KEL'] },
    { label: 'Buku Tamu Dinas', path: '/app/tamu-dinas', icon: '👤', roles: ['ADMIN_KEL'] },
    { label: 'Checklist Event', path: '/app/event-besar', icon: '☑', roles: ['ADMIN_KEL'] },
    { label: 'Pantauan PPSU (Ekbang)', path: '/app/ekbang', icon: '🛠', roles: ['ADMIN_KEL'] },
    { label: 'Master Data', path: '/app/master', icon: '⚙', roles: ['ADMIN_KEL', 'PETUGAS_PPSU'] },
    /** Hanya kader Jumantik — bukan Ketua RT */
    { label: 'Input Jumat Pagi', path: '/app/psn/input', icon: '✚', roles: ['OP_RT'] },
    /** Admin/RW; Jumantik ditambahkan lewat filter. Ketua RT TIDAK. */
    { label: 'Laporan PSN', path: '/app/psn', icon: '▦', roles: ['ADMIN_KEL', 'KOORD_RW'] },
    { label: 'Validasi RW', path: '/app/psn/validasi', icon: '✓', roles: ['KOORD_RW'] },
    { label: 'Laporan DAOP RT/RW', path: '/app/daop', icon: 'Rp', roles: ['ADMIN_KEL', 'KOORD_RW', 'OP_RT'] },
    { label: 'Setoran PMI & BAZNAS', path: '/app/setoran-pmi-baznas', icon: '◈', roles: ['ADMIN_KEL'] },
    { label: 'PPSU Lapangan', path: '/app/ppsu', icon: '🛠', roles: ['PETUGAS_PPSU'] },
    {
      label: 'Export Laporan',
      path: '/app/laporan',
      icon: '⇩',
      roles: ['ADMIN_KEL', 'KOORD_RW', 'PETUGAS_PPSU'],
    },
  ];

  /** Anggota PPSU lapangan: shell minimal. Ketua Bidang tetap punya menu + Export. */
  readonly isPpsuLapanganOnly = computed(
    () => this.auth.hasRole('PETUGAS_PPSU') && !this.auth.isKetuaBidangPpsu(),
  );

  readonly visibleNav = computed(() => {
    const role = this.auth.role();
    if (!role) return [];
    const jumantik = this.auth.isKaderJumantikUser();
    const ketuaRt = this.auth.isKetuaRtUser();

    const dasawisma = this.auth.isDasawismaUser();

    return this.nav.filter((n) => {
      // Ketua RT: Beranda + Data Warga + SK + Surat Kelurahan + Kas + DAOP
      if (ketuaRt) {
        return (
          n.path === '/app/dashboard' ||
          n.path === '/app/data-warga' ||
          n.path === '/app/surat-keterangan' ||
          n.path === '/app/surat-kelurahan-rw' ||
          n.path === '/app/kas-rt' ||
          n.path === '/app/daop'
        );
      }

      // Dasawisma / PKK: Beranda + Data Warga (+ lihat SK, isi data)
      if (dasawisma) {
        return (
          n.path === '/app/dashboard' ||
          n.path === '/app/data-warga' ||
          n.path === '/app/surat-keterangan'
        );
      }

      // Kader Jumantik: Beranda + Input Jumat + Laporan PSN
      if (jumantik) {
        return (
          n.path === '/app/dashboard' ||
          n.path === '/app/psn/input' ||
          n.path === '/app/psn'
        );
      }

      if (!n.roles.includes(role)) return false;

      // Data warga / SK: jangan tampil ke Jumantik (sudah difilter di atas)
      if (n.path === '/app/data-warga') {
        return this.auth.canAccessDataWarga();
      }
      if (n.path === '/app/surat-keterangan') {
        return this.auth.canAccessSuratKeterangan();
      }
      if (n.path === '/app/surat-kelurahan-rw') {
        return this.auth.canAccessSuratDariKelurahan();
      }
      if (n.path === '/app/kas-rt') {
        return this.auth.canAccessKasRt();
      }
      if (n.path === '/app/kas-rw' || n.path === '/app/rekap-warga-rw') {
        return this.auth.canAccessKasRw();
      }

      // Input Jumat hanya Jumantik (sudah ditangani di atas)
      if (n.path === '/app/psn/input') return false;

      // Master Data: staf kelurahan penuh; Ketua Bidang PPSU terbatas (alat + petugas)
      if (n.path === '/app/master') {
        return this.auth.canAccessMasterData();
      }

      // Perintah: anggota PPSU lapangan juga boleh (inbox tugas)
      if (n.path === '/app/perintah' && role === 'PETUGAS_PPSU') {
        return true;
      }

      if (n.path === '/app/laporan') {
        return this.auth.canAccessExportHub();
      }
      return true;
    });
  });

  readonly mobileNav = computed(() => {
    const role = this.auth.role();
    const byPath = (path: string, short: string) => {
      const item = this.nav.find((n) => n.path === path)!;
      return { ...item, short };
    };
    if (this.auth.isKetuaRtUser()) {
      return [
        byPath('/app/dashboard', 'Beranda'),
        byPath('/app/data-warga', 'Warga'),
        byPath('/app/surat-kelurahan-rw', 'Surat'),
        byPath('/app/kas-rt', 'Kas'),
      ];
    }
    if (this.auth.isDasawismaUser()) {
      return [
        byPath('/app/dashboard', 'Beranda'),
        byPath('/app/data-warga', 'Warga'),
        byPath('/app/surat-keterangan', 'SK'),
      ];
    }
    if (this.auth.isKaderJumantikUser()) {
      return [
        byPath('/app/dashboard', 'Beranda'),
        byPath('/app/psn/input', 'Input'),
        byPath('/app/psn', 'PSN'),
      ];
    }
    const map: Record<UserRole, Array<NavItem & { short: string }>> = {
      ADMIN_KEL: [
        byPath('/app/dashboard', 'Beranda'),
        byPath('/app/radar', 'Radar'),
        byPath('/app/perintah', 'Perintah'),
        byPath('/app/kalender', 'Kalender'),
      ],
      KOORD_RW: [
        byPath('/app/dashboard', 'Beranda'),
        byPath('/app/rekap-warga-rw', 'Warga'),
        byPath('/app/kas-rw', 'Kas RW'),
        byPath('/app/surat-kelurahan-rw', 'Surat'),
      ],
      OP_RT: [byPath('/app/dashboard', 'Beranda'), byPath('/app/daop', 'DAOP')],
      PETUGAS_PPSU: this.auth.isKetuaBidangPpsu()
        ? [
            byPath('/app/ppsu', 'PPSU'),
            byPath('/app/pengaduan', 'Aduan RW'),
            byPath('/app/perintah', 'Perintah'),
          ]
        : [
            byPath('/app/ppsu', 'PPSU'),
            byPath('/app/pengaduan', 'Aduan RW'),
            byPath('/app/perintah', 'Tugas'),
          ],
    };
    return role ? map[role] : [];
  });

}
