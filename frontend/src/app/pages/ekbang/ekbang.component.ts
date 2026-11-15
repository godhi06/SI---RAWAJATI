import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { FotoKerjaSlot, LaporanKerjaPpsu } from '../../core/models';

type FilterHari = 'HARI_INI' | 'KEMARIN' | 'TUJUH_HARI' | 'SEMUA' | 'TANGGAL';

/** Pantauan Ekbang / PPSU — menu kiri terpisah (tanpa tab di dashboard). */
@Component({
  selector: 'app-ekbang',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-8">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Pantauan PPSU · Ekbang</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            Kelurahan Rawajati — bukti kerja lapangan &amp; gudang alat
          </p>
          <p class="page-sub">
            Halo, {{ auth.currentUser()?.name }} — pantau lokasi kerja, foto progress, dan status alat.
          </p>
        </div>
        <a routerLink="/app/laporan-ppsu" class="btn-primary">Cetak Rekap Bulanan PPSU (PDF)</a>
      </header>

      <section class="grid gap-4 sm:grid-cols-3">
        <article class="card">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Laporan Kerja Bulan Ini</p>
              <p class="mt-2 text-4xl font-extrabold text-slate-900">{{ data.laporanKerjaBulanIni().length }}</p>
            </div>
            <div class="kpi-icon bg-blue-50 text-blue-700">📷</div>
          </div>
        </article>
        <article class="card">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Alat Dipinjam</p>
              <p class="mt-2 text-4xl font-extrabold text-amber-600">{{ data.alatDipinjamCount() }}</p>
            </div>
            <div class="kpi-icon bg-amber-50 text-amber-700">⚒</div>
          </div>
        </article>
        <article class="card">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Alat Rusak</p>
              <p
                class="mt-2 text-4xl font-extrabold"
                [class]="data.asetRusakCount() ? 'text-rose-600' : 'text-emerald-600'"
              >
                {{ data.asetRusakCount() }}
              </p>
            </div>
            <div class="kpi-icon bg-rose-50 text-rose-600">!</div>
          </div>
        </article>
      </section>

      <section class="card !p-5 sm:!p-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Monitoring Foto Kerja PPSU (Before–Progress–After)</h2>
            <p class="mt-1 text-sm text-slate-500">
              Pantau real-time hari ini, atau buka arsip hari sebelumnya.
            </p>
          </div>
          <p class="text-sm font-semibold text-slate-600">
            {{ filteredLaporan().length }} laporan · {{ labelFilterAktif() }}
          </p>
        </div>

        <div class="mt-4 flex flex-wrap items-end gap-2">
          @for (opt of filterOptions; track opt.id) {
            <button
              type="button"
              class="rounded-xl border-2 px-3 py-2 text-sm font-bold"
              [class]="filterHari() === opt.id ? tabOn : tabOff"
              (click)="setFilter(opt.id)"
            >
              {{ opt.label }}
            </button>
          }
          <div class="min-w-[11rem]">
            <label class="field-label" for="filter-tanggal">Tanggal tertentu</label>
            <input
              id="filter-tanggal"
              class="field-input"
              type="date"
              [ngModel]="tanggalPilih()"
              (ngModelChange)="onTanggalPilih($event)"
            />
          </div>
        </div>

        <div class="mt-5 space-y-6">
          @for (lap of filteredLaporan(); track lap.id) {
            <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
              <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <div class="min-w-0 space-y-1.5">
                  <p class="text-lg font-bold text-slate-900">{{ lap.lokasi }}</p>
                  <p class="text-sm text-slate-500">{{ data.labelJenisKerja(lap.jenisPekerjaan) }}</p>
                  <p
                    class="inline-flex max-w-full rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"
                  >
                    {{ data.labelPetugasRegu(lap) }}
                  </p>
                  <div class="flex flex-wrap gap-1.5">
                    <span [class]="lap.kategoriTugas === 'URGENSI_RW' ? 'badge-danger' : 'badge-ok'">
                      {{ data.labelKategoriTugasPpsu(lap.kategoriTugas) }}
                    </span>
                    <span class="badge-muted">{{ data.labelDetailTugasPpsu(lap) }}</span>
                  </div>
                </div>
                <span class="badge-muted shrink-0">{{ formatTs(lap.createdAt) }}</span>
              </div>

              <div class="grid gap-4 p-4 sm:grid-cols-3 sm:gap-5 sm:p-5">
                @for (slot of fotoSlots(lap); track slot.title) {
                  <div
                    class="overflow-hidden rounded-xl border"
                    [class]="
                      slot.tone === 'after'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50'
                    "
                  >
                    <div class="relative aspect-[4/3] overflow-hidden bg-slate-200">
                      @if (slot.foto.imageUrl) {
                        <img
                          [src]="slot.foto.imageUrl"
                          [alt]="slot.title + ' — ' + lap.lokasi"
                          class="h-full w-full object-cover"
                        />
                      } @else {
                        <div class="flex h-full items-center justify-center text-sm text-slate-500">Belum ada foto</div>
                      }
                      <span
                        class="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-bold text-white shadow"
                        [class]="
                          slot.tone === 'after'
                            ? 'bg-emerald-700'
                            : slot.tone === 'progress'
                              ? 'bg-amber-600'
                              : 'bg-slate-800'
                        "
                      >
                        {{ slot.title }}
                      </span>
                    </div>
                    <div class="space-y-0.5 px-3 py-2.5 text-xs text-slate-600">
                      <p class="truncate font-medium text-slate-800">{{ slot.foto.fileName }}</p>
                      <p class="text-slate-400">{{ formatTs(slot.foto.timestamp) }}</p>
                      <p class="text-slate-400">
                        GPS {{ slot.foto.latitude }}, {{ slot.foto.longitude }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </article>
          } @empty {
            <div class="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
              <p class="font-semibold text-slate-700">Tidak ada laporan untuk filter ini</p>
              <p class="mt-1 text-sm text-slate-500">
                Coba <button type="button" class="font-semibold text-blue-700" (click)="setFilter('KEMARIN')">Kemarin</button>
                atau
                <button type="button" class="font-semibold text-blue-700" (click)="setFilter('SEMUA')">Semua</button>.
              </p>
            </div>
          }
        </div>
      </section>

      <section class="card !p-5 sm:!p-6">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Pengadaan / Gudang Alat</h2>
            <p class="mt-1 text-sm text-slate-500">
              List stok: berapa biji/unit per alat, kondisi, dan status pinjam.
            </p>
          </div>
          <a routerLink="/app/master" class="text-sm font-semibold text-blue-700">Kelola di Master Data →</a>
        </div>
        <ul class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          @for (a of data.asetPpsus(); track a.id) {
            <li class="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-slate-800">{{ a.namaAlat }}</p>
                  <p class="mt-0.5 text-xs text-slate-500">{{ a.kodeAset }} · {{ a.lokasiGudang }}</p>
                </div>
                <span
                  [class]="
                    a.statusPinjam === 'TERSEDIA'
                      ? 'badge-ok'
                      : a.statusPinjam === 'DIPINJAM'
                        ? 'badge-warn'
                        : 'badge-danger'
                  "
                  >{{ a.statusPinjam }}</span
                >
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span class="rounded-lg bg-white px-2 py-1 font-bold text-slate-900 ring-1 ring-slate-200">
                  Total {{ a.jumlah }} {{ a.satuan }}
                </span>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                Baik {{ a.jumlahBaik || 0 }} · Rusak ringan {{ a.jumlahRusakRingan || 0 }} · Rusak berat
                {{ a.jumlahRusakBerat || 0 }} · Hilang {{ a.jumlahHilang || 0 }}
              </p>
              @if (a.dipinjamOleh) {
                <p class="mt-1 text-xs text-slate-500">Dipinjam: {{ a.dipinjamOleh }}</p>
              }
            </li>
          }
        </ul>
        <p class="mt-4 text-xs text-slate-400">
          Total jenis alat: {{ data.asetPpsus().length }} · Total unit: {{ totalUnitAlat() }}.
        </p>
      </section>
    </div>
  `,
})
export class EkbangComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly filterHari = signal<FilterHari>('HARI_INI');
  readonly tanggalPilih = signal(this.toInputDate(new Date()));

  readonly tabOn = 'border-blue-600 bg-blue-50 text-blue-800';
  readonly tabOff = 'border-slate-200 bg-white text-slate-600';

  readonly filterOptions: Array<{ id: FilterHari; label: string }> = [
    { id: 'HARI_INI', label: 'Hari ini (real-time)' },
    { id: 'KEMARIN', label: 'Kemarin' },
    { id: 'TUJUH_HARI', label: '7 hari' },
    { id: 'SEMUA', label: 'Semua' },
  ];

  readonly filteredLaporan = computed(() => {
    const mode = this.filterHari();
    const list = [...this.data.laporanKerjaPpsus()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    if (mode === 'SEMUA') return list;

    const today = this.startOfDay(new Date());
    if (mode === 'HARI_INI') {
      return list.filter((l) => this.sameDay(new Date(l.createdAt), today));
    }
    if (mode === 'KEMARIN') {
      const kemarin = new Date(today);
      kemarin.setDate(kemarin.getDate() - 1);
      return list.filter((l) => this.sameDay(new Date(l.createdAt), kemarin));
    }
    if (mode === 'TUJUH_HARI') {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return list.filter((l) => {
        const d = this.startOfDay(new Date(l.createdAt));
        return d >= from && d <= today;
      });
    }
    // TANGGAL
    const picked = this.parseInputDate(this.tanggalPilih());
    if (!picked) return list;
    return list.filter((l) => this.sameDay(new Date(l.createdAt), picked));
  });

  setFilter(id: FilterHari): void {
    this.filterHari.set(id);
    if (id === 'HARI_INI') this.tanggalPilih.set(this.toInputDate(new Date()));
    if (id === 'KEMARIN') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      this.tanggalPilih.set(this.toInputDate(d));
    }
  }

  onTanggalPilih(value: string): void {
    this.tanggalPilih.set(value);
    this.filterHari.set('TANGGAL');
  }

  labelFilterAktif(): string {
    const mode = this.filterHari();
    if (mode === 'HARI_INI') return 'Hari ini';
    if (mode === 'KEMARIN') return 'Kemarin';
    if (mode === 'TUJUH_HARI') return '7 hari terakhir';
    if (mode === 'TANGGAL') {
      const d = this.parseInputDate(this.tanggalPilih());
      return d
        ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Tanggal';
    }
    return 'Semua periode';
  }

  fotoSlots(lap: LaporanKerjaPpsu): Array<{
    title: string;
    tone: 'before' | 'progress' | 'after';
    foto: FotoKerjaSlot;
  }> {
    return [
      { title: 'Before 0%', tone: 'before', foto: lap.fotoBefore },
      { title: 'Progress 50%', tone: 'progress', foto: lap.fotoProgress },
      { title: 'After 100%', tone: 'after', foto: lap.fotoAfter },
    ];
  }

  totalUnitAlat(): number {
    return this.data.asetPpsus().reduce((sum, a) => sum + (a.jumlah || 0), 0);
  }

  formatTs(iso: string): string {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private toInputDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private parseInputDate(value: string): Date | null {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, day] = value.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
}
