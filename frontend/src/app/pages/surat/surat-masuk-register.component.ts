import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { StatusSuratMasuk } from '../../core/models';

/** Buku register surat masuk — cetak PDF arsip bulanan (bukan layar kerja disposisi). */
@Component({
  selector: 'app-surat-masuk-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/surat-masuk" class="text-sm font-semibold text-blue-700">
            ← Kembali ke Surat Masuk Dinas
          </a>
          <h1 class="page-title mt-1">Register Surat Masuk</h1>
          <p class="page-sub">
            Buku agenda arsip bulanan — cetak untuk map / kecamatan. Data dari modul Surat Masuk Dinas.
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <div>
            <label class="field-label" for="reg-bln">Bulan (tgl terima)</label>
            <select id="reg-bln" class="field-input" [ngModel]="bulan()" (ngModelChange)="bulan.set(+$event)">
              @for (m of bulanOptions; track m.id) {
                <option [value]="m.id">{{ m.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label" for="reg-thn">Tahun</label>
            <select id="reg-thn" class="field-input" [ngModel]="tahun()" (ngModelChange)="tahun.set(+$event)">
              @for (y of tahunOptions; track y) {
                <option [value]="y">{{ y }}</option>
              }
            </select>
          </div>
          <button type="button" class="btn-primary" (click)="cetak()" [disabled]="!rows().length">
            Unduh / Cetak PDF
          </button>
        </div>
      </header>

      <article
        class="mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <header class="border-b-2 border-slate-900 pb-4">
          <div class="flex items-start gap-4">
            <div
              class="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-slate-800 bg-slate-50 text-slate-800"
              aria-hidden="true"
            >
              <span class="text-[10px] font-bold leading-none tracking-wide">LOGO</span>
              <span class="mt-0.5 text-[9px] font-semibold leading-none">RWJ</span>
            </div>
            <div class="min-w-0 flex-1 text-center sm:pr-16">
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                Pemerintah Provinsi DKI Jakarta
              </p>
              <p class="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Kota Administrasi Jakarta Selatan
              </p>
              <h2 class="mt-2 text-xl font-extrabold uppercase leading-snug text-slate-900 sm:text-2xl">
                Kelurahan Rawajati, Kecamatan Pancoran
              </h2>
              <p class="mt-2 text-xs text-slate-500">{{ data.kelurahan.alamatKantor }}</p>
            </div>
          </div>
        </header>

        <div class="mt-6 text-center">
          <h3
            class="text-lg font-bold uppercase tracking-wide text-slate-950 underline decoration-slate-900/40 underline-offset-4"
          >
            Buku Register Surat Masuk
          </h3>
          <p class="mt-2 text-base font-semibold text-slate-800">Periode: {{ labelPeriode() }}</p>
          <p class="mt-1 text-sm text-slate-500">Dicetak: {{ tanggalCetak }} · {{ auth.currentUser()?.name }}</p>
        </div>

        <section class="mt-6 grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4">
          <div class="rounded-lg border border-slate-200 px-3 py-3">
            <p class="text-xs uppercase text-slate-500">Total surat</p>
            <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ ringkas().total }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-3">
            <p class="text-xs uppercase text-slate-500">Belum disposisi</p>
            <p class="mt-1 text-2xl font-extrabold text-amber-700">{{ ringkas().baru }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-3">
            <p class="text-xs uppercase text-slate-500">Dalam proses</p>
            <p class="mt-1 text-2xl font-extrabold text-blue-800">{{ ringkas().proses }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-3">
            <p class="text-xs uppercase text-slate-500">Selesai / arsip</p>
            <p class="mt-1 text-2xl font-extrabold text-emerald-700">{{ ringkas().selesai }}</p>
          </div>
        </section>

        <section class="mt-8">
          <h4 class="mb-3 text-base font-bold text-slate-900">Daftar agenda masuk</h4>
          @if (rows().length) {
            <table class="w-full border-collapse text-[11px] leading-snug">
              <thead>
                <tr class="bg-slate-50">
                  <th class="border border-slate-300 px-1.5 py-1.5 text-left">No</th>
                  <th class="border border-slate-300 px-1.5 py-1.5 text-left">Tgl terima</th>
                  <th class="border border-slate-300 px-1.5 py-1.5 text-left">No. agenda</th>
                  <th class="border border-slate-300 px-1.5 py-1.5 text-left">Asal / No. surat</th>
                  <th class="border border-slate-300 px-1.5 py-1.5 text-left">Perihal</th>
                  <th class="border border-slate-300 px-1.5 py-1.5 text-left">Disposisi</th>
                  <th class="border border-slate-300 px-1.5 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.id; let i = $index) {
                  <tr>
                    <td class="border border-slate-300 px-1.5 py-1.5 align-top">{{ i + 1 }}</td>
                    <td class="border border-slate-300 px-1.5 py-1.5 align-top whitespace-nowrap">
                      {{ row.tanggalTerima }}
                    </td>
                    <td class="border border-slate-300 px-1.5 py-1.5 align-top font-semibold">
                      {{ row.nomorAgenda }}
                    </td>
                    <td class="border border-slate-300 px-1.5 py-1.5 align-top">
                      <span class="font-semibold">{{ row.asal }}</span>
                      @if (row.nomorSuratAsal) {
                        <br />
                        <span class="text-slate-500">{{ row.nomorSuratAsal }}</span>
                      }
                    </td>
                    <td class="border border-slate-300 px-1.5 py-1.5 align-top">{{ row.perihal }}</td>
                    <td class="border border-slate-300 px-1.5 py-1.5 align-top">
                      {{ row.disposisiLabel || '—' }}
                    </td>
                    <td class="border border-slate-300 px-1.5 py-1.5 align-top">
                      {{ data.labelStatusSuratMasuk(row.status) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              Belum ada surat masuk pada periode {{ labelPeriode() }}.
            </p>
          }
        </section>

        <footer class="mt-10 grid gap-8 text-sm sm:grid-cols-2">
          <div>
            <p class="text-slate-600">Dicatat / diperiksa</p>
            <div class="mt-14 border-b border-slate-400"></div>
            <p class="mt-1 text-xs text-slate-500">Nama &amp; paraf staf</p>
          </div>
          <div class="text-right sm:text-left">
            <p class="text-slate-600">{{ data.kelurahan.nama }}, {{ tanggalCetak }}</p>
            <p class="mt-1">Mengetahui,</p>
            <p>Lurah {{ data.kelurahan.nama }}</p>
            <div class="mt-14 border-b border-slate-400 sm:ml-auto sm:w-56"></div>
            <p class="mt-1 text-xs text-slate-500">Nama &amp; stempel</p>
          </div>
        </footer>

        <p class="mt-6 text-[10px] text-slate-400 print:mt-4">
          SI-RAWAJATI · Register surat masuk · dicetak dari data operasional Surat Masuk Dinas
        </p>
      </article>
    </div>
  `,
})
export class SuratMasukRegisterComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly bulan = signal(new Date().getMonth() + 1);
  readonly tahun = signal(new Date().getFullYear());

  readonly bulanOptions = [
    { id: 1, label: 'Januari' },
    { id: 2, label: 'Februari' },
    { id: 3, label: 'Maret' },
    { id: 4, label: 'April' },
    { id: 5, label: 'Mei' },
    { id: 6, label: 'Juni' },
    { id: 7, label: 'Juli' },
    { id: 8, label: 'Agustus' },
    { id: 9, label: 'September' },
    { id: 10, label: 'Oktober' },
    { id: 11, label: 'November' },
    { id: 12, label: 'Desember' },
  ];

  readonly tahunOptions = [2025, 2026, 2027];
  readonly tanggalCetak = this.data.formatTanggalId(new Date());

  readonly labelPeriode = computed(() => {
    const m = this.bulanOptions.find((x) => x.id === this.bulan())?.label ?? '';
    return `${m} ${this.tahun()}`;
  });

  readonly rows = computed(() => {
    const y = this.tahun();
    const m = this.bulan();
    return [...this.data.suratMasuks()]
      .filter((s) => this.inMonth(s.tanggalTerima, y, m))
      .sort((a, b) => a.tanggalTerima.localeCompare(b.tanggalTerima) || a.nomorAgenda.localeCompare(b.nomorAgenda));
  });

  readonly ringkas = computed(() => {
    const list = this.rows();
    const isSelesai = (s: StatusSuratMasuk) => s === 'SELESAI' || s === 'DIARSIPKAN';
    const isProses = (s: StatusSuratMasuk) => s === 'DIDISPOSISI' || s === 'DIPROSES';
    return {
      total: list.length,
      baru: list.filter((s) => s.status === 'BARU').length,
      proses: list.filter((s) => isProses(s.status)).length,
      selesai: list.filter((s) => isSelesai(s.status)).length,
    };
  });

  private inMonth(iso: string, year: number, month: number): boolean {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  }

  cetak(): void {
    window.print();
  }
}
