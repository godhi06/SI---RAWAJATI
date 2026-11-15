import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-laporan-resmi',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/laporan" class="text-sm font-semibold text-blue-700">← Kembali ke Export Laporan</a>
          <h1 class="page-title mt-1">Laporan Resmi Jumat</h1>
          <p class="page-sub">Pratinjau cetak dengan kop surat kelurahan — siap disimpan sebagai PDF.</p>
        </div>
        <button type="button" class="btn-primary" (click)="cetak()">Unduh / Cetak PDF</button>
      </header>

      <!-- Lembar resmi -->
      <article
        id="lembar-laporan"
        class="mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <header class="border-b-2 border-slate-900 pb-4">
          <div class="flex items-start gap-4">
            <!-- Placeholder logo netral (bukan logo resmi pemkot) -->
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
                Kelurahan Rawajati, Kecamatan Pancoran,<br class="hidden sm:block" />
                Kota Administrasi Jakarta Selatan
              </h2>
              <p class="mt-2 text-xs text-slate-500">{{ data.kelurahan.alamatKantor }}</p>
            </div>
          </div>
        </header>

        <div class="mt-6 text-center">
          <h3 class="text-lg font-bold uppercase tracking-wide text-slate-950 underline decoration-slate-900/40 underline-offset-4">
            Laporan Monitoring PSN Jumantik — Rekap Jumat
          </h3>
          <p class="mt-2 text-base text-slate-700">Tanggal: {{ data.formatTanggalId() }}</p>
          <p class="mt-1 text-sm text-slate-500">
            Angka Bebas Jentik (ABJ) Kelurahan: <strong>{{ abjKel().abj }}%</strong>
            —
            <span
              class="font-semibold"
              [class]="
                abjKel().status === 'AMAN'
                  ? 'text-emerald-700'
                  : abjKel().status === 'ZONA_MERAH'
                    ? 'text-rose-600'
                    : 'text-slate-500'
              "
            >
              {{ data.labelZona(abjKel().status) }}
            </span>
          </p>
        </div>

        <section class="mt-8">
          <h4 class="mb-3 text-base font-bold text-slate-900">A. Rekap ABJ per RW</h4>
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 px-2 py-2 text-left">RW</th>
                <th class="border border-slate-300 px-2 py-2 text-right">Diperiksa</th>
                <th class="border border-slate-300 px-2 py-2 text-right">Bebas Jentik</th>
                <th class="border border-slate-300 px-2 py-2 text-right">Positif</th>
                <th class="border border-slate-300 px-2 py-2 text-right">ABJ (%)</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Status Zona</th>
              </tr>
            </thead>
            <tbody>
              @for (row of abjRw(); track row.rwId) {
                <tr>
                  <td class="border border-slate-300 px-2 py-2">{{ row.scopeLabel }}</td>
                  <td class="border border-slate-300 px-2 py-2 text-right">{{ row.diperiksa }}</td>
                  <td class="border border-slate-300 px-2 py-2 text-right">{{ row.bebasJentik }}</td>
                  <td class="border border-slate-300 px-2 py-2 text-right">{{ row.positif }}</td>
                  <td class="border border-slate-300 px-2 py-2 text-right font-semibold">{{ row.abj }}</td>
                  <td class="border border-slate-300 px-2 py-2">{{ data.labelZona(row.status) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <section class="mt-8">
          <h4 class="mb-3 text-base font-bold text-slate-900">B. Rekap ABJ per RT</h4>
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 px-2 py-2 text-left">Wilayah</th>
                <th class="border border-slate-300 px-2 py-2 text-right">Diperiksa</th>
                <th class="border border-slate-300 px-2 py-2 text-right">Bebas</th>
                <th class="border border-slate-300 px-2 py-2 text-right">Positif</th>
                <th class="border border-slate-300 px-2 py-2 text-right">ABJ (%)</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Status Zona</th>
              </tr>
            </thead>
            <tbody>
              @for (row of abjRt(); track row.rtId) {
                <tr [class]="row.status === 'ZONA_MERAH' ? 'bg-red-50' : ''">
                  <td class="border border-slate-300 px-2 py-2">{{ row.scopeLabel }}</td>
                  <td class="border border-slate-300 px-2 py-2 text-right">{{ row.diperiksa }}</td>
                  <td class="border border-slate-300 px-2 py-2 text-right">{{ row.bebasJentik }}</td>
                  <td class="border border-slate-300 px-2 py-2 text-right">{{ row.positif }}</td>
                  <td class="border border-slate-300 px-2 py-2 text-right font-semibold">{{ row.abj }}</td>
                  <td class="border border-slate-300 px-2 py-2 font-semibold">{{ data.labelZona(row.status) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <section class="mt-8 grid gap-2 text-sm text-slate-700">
          <p>
            <strong>C. Operasional PPSU:</strong>
            {{ data.saluranSelesaiCount() }} pengurasan selesai · {{ data.saluranJadwalCount() }} dijadwalkan ·
            {{ data.asetRusakCount() }} alat perlu perhatian · {{ data.laporanKerjaBulanIni().length }} laporan kerja
            bulan ini.
          </p>
          <p class="text-xs text-slate-500">
            Catatan: Ambang aman ABJ internal kelurahan adalah ≥ 95%. Dokumen ini merupakan keluaran SI-RAWAJATI untuk
            pendukung operasional Kelurahan Rawajati.
          </p>
        </section>

        <section class="mt-14 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <p class="text-slate-600">Mengetahui,</p>
            <p class="font-semibold text-slate-900">Sekretaris Kelurahan</p>
            <div class="mt-16 border-b border-slate-400"></div>
            <p class="mt-2 font-semibold">Maya Kartika</p>
          </div>
          <div>
            <p class="text-slate-600">{{ data.kelurahan.kota }}, {{ shortDate }}</p>
            <p class="font-semibold text-slate-900">Lurah Rawajati</p>
            <div class="mt-16 border-b border-slate-400"></div>
            <p class="mt-2 font-semibold">Sariman, S.Sos, M.Si</p>
            <p class="text-xs text-slate-500">NIP. —</p>
          </div>
        </section>
      </article>
    </div>
  `,
  styles: [
    `
      @media print {
        :host {
          display: block;
        }
      }
    `,
  ],
})
export class LaporanResmiComponent {
  readonly data = inject(DataService);

  readonly abjKel = computed(() => this.data.hitungAbj());
  readonly abjRw = computed(() => this.data.abjPerRw());
  readonly abjRt = computed(() => this.data.abjPerRt());

  readonly shortDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  cetak(): void {
    window.print();
  }
}
