import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { JenisKalenderOps, KalenderOpsItem } from '../../core/models';

@Component({
  selector: 'app-kalender-ops',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Kalender Operasional</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            Satu layar: agenda · PSN Jumat · PPSU · undangan · tenggat perintah
          </p>
          <p class="page-sub">
            Buka pagi hari — langsung lihat apa yang terjadi 3 minggu ke depan di Rawajati.
          </p>
        </div>
        <p class="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
          {{ data.formatTanggalId() }}
        </p>
      </header>

      <section class="grid gap-3 sm:grid-cols-3">
        <article class="card !p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Hari ini</p>
          <p class="mt-1 text-3xl font-extrabold text-slate-900">{{ hariIni().length }}</p>
          <p class="mt-1 text-xs text-slate-500">kegiatan / tenggat</p>
        </article>
        <article class="card !p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">7 hari ke depan</p>
          <p class="mt-1 text-3xl font-extrabold text-slate-900">{{ mingguIni().length }}</p>
          <p class="mt-1 text-xs text-slate-500">termasuk Jumat PSN</p>
        </article>
        <article class="card !p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Perintah aktif</p>
          <p class="mt-1 text-3xl font-extrabold text-amber-600">{{ data.perintahAktifCount() }}</p>
          <a routerLink="/app/perintah" class="mt-1 inline-block text-xs font-semibold text-blue-700"
            >Buka inbox →</a
          >
        </article>
      </section>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
          [class]="
            jenisFilter() === 'ALL'
              ? 'border-blue-600 bg-blue-50 text-blue-800'
              : 'border-slate-200 bg-white text-slate-600'
          "
          (click)="jenisFilter.set('ALL')"
        >
          Semua
        </button>
        @for (j of jenisOptions; track j) {
          <button
            type="button"
            class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
            [class]="
              jenisFilter() === j
                ? 'border-blue-600 bg-blue-50 text-blue-800'
                : 'border-slate-200 bg-white text-slate-600'
            "
            (click)="jenisFilter.set(j)"
          >
            {{ data.labelJenisKalender(j) }}
          </button>
        }
      </div>

      <section class="space-y-5">
        @for (group of grouped(); track group.tanggal) {
          <div>
            <div class="mb-2 flex flex-wrap items-baseline gap-2">
              <h2 class="text-base font-bold text-slate-900">{{ labelHari(group.tanggal) }}</h2>
              @if (group.tanggal === todayYmd) {
                <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800"
                  >Hari ini</span
                >
              }
            </div>
            <ul class="space-y-2">
              @for (item of group.items; track item.id) {
                <li>
                  <a
                    [routerLink]="item.link"
                    class="card !flex !items-start gap-3 !p-3 transition hover:border-blue-300 hover:shadow-md"
                  >
                    <span
                      class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold"
                      [class]="warnaJenis(item.jenis)"
                    >
                      {{ ikonJenis(item.jenis) }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-sm font-bold text-slate-900">{{ item.judul }}</p>
                        @if (item.jam) {
                          <span class="text-xs font-semibold text-slate-500">{{ item.jam }}</span>
                        }
                        @if (item.statusLabel) {
                          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {{ item.statusLabel }}
                          </span>
                        }
                      </div>
                      <p class="mt-0.5 text-xs text-slate-500">
                        {{ data.labelJenisKalender(item.jenis) }} · {{ item.meta }}
                      </p>
                    </div>
                  </a>
                </li>
              }
            </ul>
          </div>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            Tidak ada kegiatan untuk filter ini dalam 3 minggu ke depan.
          </p>
        }
      </section>
    </div>
  `,
})
export class KalenderOpsComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly jenisFilter = signal<JenisKalenderOps | 'ALL'>('ALL');
  readonly todayYmd = new Date().toISOString().slice(0, 10);

  readonly jenisOptions: JenisKalenderOps[] = [
    'AGENDA',
    'KERJA_BAKTI',
    'PSN_JUMAT',
    'PPSU_SALURAN',
    'UNDANGAN_PSN',
    'PERINTAH',
  ];

  readonly filtered = computed(() => {
    const all = this.data.kalenderOperasional(21);
    const f = this.jenisFilter();
    return f === 'ALL' ? all : all.filter((i) => i.jenis === f);
  });

  readonly hariIni = computed(() => this.filtered().filter((i) => i.tanggal === this.todayYmd));

  readonly mingguIni = computed(() => {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const endYmd = end.toISOString().slice(0, 10);
    return this.filtered().filter((i) => i.tanggal >= this.todayYmd && i.tanggal <= endYmd);
  });

  readonly grouped = computed(() => {
    const map = new Map<string, KalenderOpsItem[]>();
    for (const item of this.filtered()) {
      const list = map.get(item.tanggal) ?? [];
      list.push(item);
      map.set(item.tanggal, list);
    }
    return [...map.entries()].map(([tanggal, items]) => ({ tanggal, items }));
  });

  labelHari(ymd: string): string {
    return this.data.formatTanggalId(new Date(`${ymd}T12:00:00`));
  }

  ikonJenis(j: JenisKalenderOps): string {
    const map: Record<JenisKalenderOps, string> = {
      AGENDA: '📅',
      KERJA_BAKTI: '🧹',
      PPSU_SALURAN: '🛠',
      PSN_JUMAT: '🦟',
      UNDANGAN_PSN: '✉',
      PERINTAH: '⚡',
    };
    return map[j];
  }

  warnaJenis(j: JenisKalenderOps): string {
    const map: Record<JenisKalenderOps, string> = {
      AGENDA: 'bg-blue-100 text-blue-800',
      KERJA_BAKTI: 'bg-emerald-100 text-emerald-800',
      PPSU_SALURAN: 'bg-amber-100 text-amber-900',
      PSN_JUMAT: 'bg-rose-100 text-rose-800',
      UNDANGAN_PSN: 'bg-indigo-100 text-indigo-800',
      PERINTAH: 'bg-orange-100 text-orange-900',
    };
    return map[j];
  }
}
