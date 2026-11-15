import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

type PreviewTab = 'KESRA' | 'DAOP' | 'PPSU';

@Component({
  selector: 'app-laporan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header>
        <h1 class="page-title">Export Laporan</h1>
        <p class="page-sub">
          Cetak PDF oleh <strong>staf kelurahan</strong> (Lurah, Sekkel, Kasi) — bukan hanya Sekkel.
          Ketua RW: PSN &amp; DAOP wilayahnya. Ketua Bidang PPSU: rekap PPSU.
        </p>
      </header>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        @if (auth.isStafKelurahan()) {
          <article class="card flex flex-col border-2 border-blue-200 bg-blue-50/30 md:col-span-2 xl:col-span-3">
            <p class="text-xs font-bold uppercase tracking-wide text-blue-700">Reporting internal</p>
            <h2 class="mt-1 text-lg font-semibold text-slate-900">Rekap Bulanan Gabungan</h2>
            <p class="mt-2 flex-1 text-sm text-slate-600">
              Satu PDF: PSN/ABJ · DAOP · PPSU · Agenda rapat · Kerja bakti · Surat keluar. Pilih bulan lalu cetak.
            </p>
            <a routerLink="/app/laporan-gabungan" class="btn-primary mt-4 inline-flex w-full max-w-xs justify-center">
              Buka &amp; Cetak Rekap Gabungan
            </a>
          </article>
        }

        @if (auth.canExportPsn()) {
          <article class="card flex flex-col">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Kesra</p>
            <h2 class="mt-1 text-lg font-semibold text-slate-900">Laporan ABJ / Jumat PSN</h2>
            <p class="mt-2 flex-1 text-sm text-slate-500">
              Scope: {{ abj().scopeLabel }} · {{ abj().abj }}% ({{ abj().bebasJentik }}/{{ abj().diperiksa }}) ·
              {{ data.labelZona(abj().status) }}
            </p>
            <a routerLink="/app/laporan-resmi" class="btn-primary mt-4 block w-full text-center">
              Buka &amp; Cetak PDF ABJ
            </a>
          </article>
        }

        @if (auth.canExportPpsu()) {
          <article class="card flex flex-col">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Ekbang · PPSU</p>
            <h2 class="mt-1 text-lg font-semibold text-slate-900">Rekap Bulanan PPSU</h2>
            <p class="mt-2 flex-1 text-sm text-slate-500">
              {{ data.laporanKerjaBulanIni().length }} laporan kerja bulan ini · Alat dipinjam
              {{ data.alatDipinjamCount() }} · Jadwal saluran {{ data.saluranJadwalCount() }}.
              @if (auth.isKetuaBidangPpsu()) {
                <span class="block mt-1 text-xs font-semibold text-indigo-700">Akses Ketua Bidang PPSU</span>
              }
            </p>
            <a routerLink="/app/laporan-ppsu" class="btn-primary mt-4 block w-full text-center">
              Buka &amp; Cetak PDF PPSU
            </a>
          </article>
        }

        @if (auth.canExportDaop()) {
          <article class="card flex flex-col">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">DAOP RT/RW</p>
            <h2 class="mt-1 text-lg font-semibold text-slate-900">Rekap DAOP Keseluruhan</h2>
            <p class="mt-2 flex-1 text-sm text-slate-500">
              Belum setor: <strong>{{ data.daopBelumSetorCount() }}</strong> · Sudah upload TTD:
              <strong>{{ data.daopSudahUploadCount() }}</strong>. Cetak PDF rekap semua RT/RW (bukan form satuan).
            </p>
            <a routerLink="/app/laporan-daop" class="btn-primary mt-4 block w-full text-center">
              Buka &amp; Cetak PDF DAOP
            </a>
            <a routerLink="/app/daop" class="mt-2 text-center text-sm font-semibold text-blue-700">
              Pantauan matriks / form per RT →
            </a>
          </article>
        }

        @if (auth.isStafKelurahan()) {
          <article class="card flex flex-col">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Kesra · Undangan</p>
            <h2 class="mt-1 text-lg font-semibold text-slate-900">Template Undangan PSN</h2>
            <p class="mt-2 flex-1 text-sm text-slate-500">
              Cetak surat undangan pertemuan PSN (PDF) untuk dilampirkan saat blast WA ke Ketua RW.
            </p>
            <a routerLink="/app/psn/undangan-cetak" class="btn-secondary mt-4 block w-full text-center">
              Cetak Template Undangan
            </a>
          </article>

          <article class="card flex flex-col">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Master · Stok</p>
            <h2 class="mt-1 text-lg font-semibold text-slate-900">Stok Alat PPSU</h2>
            <p class="mt-2 flex-1 text-sm text-slate-500">
              {{ data.asetPpsus().length }} jenis alat di gudang. Kelola stok per kondisi di Master Data; rekap ikut di PDF
              PPSU.
            </p>
            <a routerLink="/app/master" class="btn-secondary mt-4 block w-full text-center">Buka Master Data</a>
          </article>
        }

        @if (auth.canExportPsn()) {
          <article class="card flex flex-col">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Kesra · Pantauan</p>
            <h2 class="mt-1 text-lg font-semibold text-slate-900">Daftar Laporan PSN</h2>
            <p class="mt-2 flex-1 text-sm text-slate-500">
              Lihat riwayat input Jumat pagi, filter wilayah, dan tindak lanjut zona merah.
            </p>
            <a routerLink="/app/psn" class="btn-secondary mt-4 block w-full text-center">Buka Laporan PSN</a>
          </article>
        }
      </section>

      <article class="card space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Pratinjau ringkas</h2>
            <p class="mt-1 text-sm text-slate-500">Cuplikan data sebelum cetak — pilih modul.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
              [class]="previewTab() === 'KESRA' ? tabOn : tabOff"
              (click)="previewTab.set('KESRA')"
            >
              Kesra
            </button>
            <button
              type="button"
              class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
              [class]="previewTab() === 'DAOP' ? tabOn : tabOff"
              (click)="previewTab.set('DAOP')"
            >
              DAOP
            </button>
            @if (auth.canExportPpsu()) {
              <button
                type="button"
                class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
                [class]="previewTab() === 'PPSU' ? tabOn : tabOff"
                (click)="previewTab.set('PPSU')"
              >
                PPSU
              </button>
            }
          </div>
        </div>

        @if (previewTab() === 'KESRA' && auth.canExportPsn()) {
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="field-label" for="filter-rw">Filter RW</label>
              <select id="filter-rw" class="field-input" [ngModel]="rwId()" (ngModelChange)="onRwChange($event)">
                <option value="">Semua RW</option>
                @for (rw of rwOptions(); track rw.id) {
                  <option [value]="rw.id">{{ data.labelRw(rw.nomor) }} · {{ rw.namaKetua }}</option>
                }
              </select>
            </div>
            <div>
              <label class="field-label" for="filter-rt">Filter RT</label>
              <select
                id="filter-rt"
                class="field-input"
                [ngModel]="rtId()"
                (ngModelChange)="rtId.set($event)"
                [disabled]="!rtOptions().length"
              >
                <option value="">Semua RT{{ rwId() ? ' di RW ini' : '' }}</option>
                @for (rt of rtOptions(); track rt.id) {
                  <option [value]="rt.id">{{ data.labelRt(rt.nomor) }} · {{ rt.namaKetua }}</option>
                }
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead class="text-sm uppercase text-slate-500">
                <tr>
                  <th class="py-2 pr-4">Wilayah</th>
                  <th class="py-2 pr-4">Diperiksa</th>
                  <th class="py-2 pr-4">Bebas</th>
                  <th class="py-2 pr-4">ABJ</th>
                  <th class="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (r of previewKesra(); track r.rtId) {
                  <tr class="border-t border-slate-100">
                    <td class="py-3 pr-4">{{ r.scopeLabel }}</td>
                    <td class="py-3 pr-4">{{ r.diperiksa }}</td>
                    <td class="py-3 pr-4">{{ r.bebasJentik }}</td>
                    <td class="py-3 pr-4 font-semibold" [class]="abjColor(r.status)">{{ r.abj }}%</td>
                    <td class="py-3">
                      <span [class]="abjBadge(r.status)">{{ data.labelZona(r.status) }}</span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="py-8 text-center text-slate-500">Tidak ada data untuk filter ini.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (previewTab() === 'DAOP' && auth.canExportDaop()) {
          <div class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead class="text-sm uppercase text-slate-500">
                <tr>
                  <th class="py-2 pr-4">Wilayah</th>
                  <th class="py-2 pr-4">Tingkat</th>
                  <th class="py-2 pr-4">Periode</th>
                  <th class="py-2 pr-4">Status</th>
                  <th class="py-2">Cetak</th>
                </tr>
              </thead>
              <tbody>
                @for (row of previewDaop(); track row.id) {
                  <tr class="border-t border-slate-100">
                    <td class="py-3 pr-4 font-medium text-slate-900">{{ data.labelDaopWilayah(row) }}</td>
                    <td class="py-3 pr-4">{{ row.tingkat }}</td>
                    <td class="py-3 pr-4">{{ row.periodeLabel }}</td>
                    <td class="py-3 pr-4">
                      <span [class]="daopBadge(row.status)">{{ data.labelStatusKeuanganRt(row.status) }}</span>
                    </td>
                    <td class="py-3">
                      <a class="text-sm font-semibold text-blue-700" [routerLink]="['/app/daop/cetak', row.id]">
                        Form PDF
                      </a>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="py-8 text-center text-slate-500">Belum ada data DAOP.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/app/laporan-daop" class="inline-flex text-sm font-semibold text-blue-700">
              Cetak rekap DAOP keseluruhan →
            </a>
            <a routerLink="/app/daop" class="inline-flex text-sm font-semibold text-slate-600">Matriks pantauan →</a>
          </div>
        }

        @if (previewTab() === 'PPSU' && auth.canExportPpsu()) {
          <div class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead class="text-sm uppercase text-slate-500">
                <tr>
                  <th class="py-2 pr-4">Alat</th>
                  <th class="py-2 pr-4">Total</th>
                  <th class="py-2 pr-4">Baik</th>
                  <th class="py-2 pr-4">Rusak ringan</th>
                  <th class="py-2">Status pinjam</th>
                </tr>
              </thead>
              <tbody>
                @for (a of data.asetPpsus(); track a.id) {
                  <tr class="border-t border-slate-100">
                    <td class="py-3 pr-4">
                      <p class="font-medium text-slate-900">{{ a.namaAlat }}</p>
                      <p class="text-xs text-slate-500">{{ a.kodeAset }}</p>
                    </td>
                    <td class="py-3 pr-4 font-semibold">{{ a.jumlah }} {{ a.satuan }}</td>
                    <td class="py-3 pr-4">{{ a.jumlahBaik || 0 }}</td>
                    <td class="py-3 pr-4">{{ a.jumlahRusakRingan || 0 }}</td>
                    <td class="py-3">{{ a.statusPinjam }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="py-8 text-center text-slate-500">Belum ada stok alat.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="text-sm text-slate-500">
            {{ data.laporanKerjaBulanIni().length }} laporan kerja bulan ini ikut masuk PDF rekap PPSU.
          </p>
        }
      </article>
    </div>
  `,
})
export class LaporanComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly previewTab = signal<PreviewTab>(
    this.auth.canExportPsn() ? 'KESRA' : this.auth.canExportDaop() ? 'DAOP' : 'PPSU',
  );
  readonly rwId = signal('');
  readonly rtId = signal('');

  readonly tabOn = 'border-blue-600 bg-blue-50 text-blue-800';
  readonly tabOff = 'border-slate-200 bg-white text-slate-600';

  readonly abj = computed(() => {
    const user = this.auth.currentUser();
    if (user?.role === 'KOORD_RW' && user.rwId) return this.data.hitungAbj({ rwId: user.rwId });
    return this.data.hitungAbj();
  });

  readonly rwOptions = computed(() => {
    const user = this.auth.currentUser();
    let list = this.data.rws();
    if (user?.role === 'KOORD_RW' && user.rwId) {
      list = list.filter((r) => r.id === user.rwId);
    }
    return [...list].sort((a, b) => a.nomor.localeCompare(b.nomor, 'id'));
  });

  readonly rtOptions = computed(() => {
    const rw = this.rwId();
    let list = this.data.rts();
    const user = this.auth.currentUser();
    if (user?.role === 'KOORD_RW' && user.rwId) {
      list = list.filter((r) => r.rwId === user.rwId);
    }
    if (rw) list = list.filter((r) => r.rwId === rw);
    return [...list].sort((a, b) => a.nomor.localeCompare(b.nomor, 'id'));
  });

  readonly previewKesra = computed(() => {
    const user = this.auth.currentUser();
    let rows = this.data.abjPerRt();
    if (user?.role === 'KOORD_RW' && user.rwId) {
      rows = rows.filter((r) => r.rwId === user.rwId);
    }
    const rw = this.rwId();
    const rt = this.rtId();
    if (rw) rows = rows.filter((r) => r.rwId === rw);
    if (rt) rows = rows.filter((r) => r.rtId === rt);
    return rows;
  });

  readonly previewDaop = computed(() => {
    const user = this.auth.currentUser();
    let list = [...this.data.laporanKeuanganRts()];
    if (user?.role === 'KOORD_RW' && user.rwId) {
      const rtIds = new Set(this.data.rts().filter((r) => r.rwId === user.rwId).map((r) => r.id));
      list = list.filter((l) => (l.tingkat === 'RW' ? l.rwId === user.rwId : rtIds.has(l.rtId || '')));
    }
    const rwNomor = (rwId: string) =>
      Number.parseInt(this.data.rws().find((r) => r.id === rwId)?.nomor || '0', 10) || 0;
    const rtNomor = (rtId?: string) =>
      Number.parseInt(this.data.rts().find((r) => r.id === rtId)?.nomor || '0', 10) || 0;
    return list
      .sort((a, b) => {
        const byPeriode = b.tahun - a.tahun || b.bulan - a.bulan;
        if (byPeriode) return byPeriode;
        const byRw = rwNomor(a.rwId) - rwNomor(b.rwId);
        if (byRw) return byRw;
        if (a.tingkat !== b.tingkat) return a.tingkat === 'RW' ? -1 : 1;
        return rtNomor(a.rtId) - rtNomor(b.rtId);
      })
      .slice(0, 20);
  });

  onRwChange(value: string): void {
    this.rwId.set(value);
    this.rtId.set('');
  }

  daopBadge(status: string): string {
    if (status === 'SUDAH_UPLOAD_TTD') return 'badge-ok';
    if (status === 'BELUM_SETOR') return 'badge-danger';
    return 'badge-muted';
  }

  abjColor(status: string): string {
    if (status === 'AMAN') return 'text-emerald-600';
    if (status === 'ZONA_MERAH') return 'text-rose-600';
    return 'text-slate-500';
  }

  abjBadge(status: string): string {
    if (status === 'AMAN') return 'badge-ok';
    if (status === 'ZONA_MERAH') return 'badge-danger';
    return 'badge-muted';
  }
}
