import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';

/** Rekap bulanan PPSU bergaya lembar resmi — cetak/PDF, bukan CSV mentah. */
@Component({
  selector: 'app-laporan-ppsu-rekap',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/dashboard" class="text-sm font-semibold text-blue-700">← Kembali ke Dashboard</a>
          <h1 class="page-title mt-1">Rekap Bulanan PPSU</h1>
          <p class="page-sub">Pratinjau cetak dengan kop surat — siap disimpan sebagai PDF dari browser.</p>
        </div>
        <button type="button" class="btn-primary" (click)="cetak()">Unduh / Cetak PDF</button>
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
                Kelurahan Rawajati, Kecamatan Pancoran,<br class="hidden sm:block" />
                Kota Administrasi Jakarta Selatan
              </h2>
              <p class="mt-2 text-xs text-slate-500">{{ data.kelurahan.alamatKantor }}</p>
            </div>
          </div>
        </header>

        <div class="mt-6 text-center">
          <h3
            class="text-lg font-bold uppercase tracking-wide text-slate-950 underline decoration-slate-900/40 underline-offset-4"
          >
            Rekap Bulanan Operasional PPSU (Non-CRM)
          </h3>
          <p class="mt-2 text-base text-slate-700">Periode: {{ periodeBulan }}</p>
          <p class="mt-1 text-sm text-slate-500">
            {{ data.laporanKerjaBulanIni().length }} laporan kerja ·
            {{ data.alatDipinjamCount() }} alat dipinjam ·
            {{ data.asetRusakCount() }} alat perlu perhatian
          </p>
        </div>

        <section class="mt-8">
          <h4 class="mb-3 text-base font-bold text-slate-900">A. Laporan Kerja Lapangan</h4>
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 px-2 py-2 text-left">Tanggal</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Petugas / Regu</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Lokasi</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Kategori &amp; jenis</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Bukti Foto</th>
              </tr>
            </thead>
            <tbody>
              @for (lap of data.laporanKerjaBulanIni(); track lap.id) {
                <tr>
                  <td class="border border-slate-300 px-2 py-2 whitespace-nowrap">
                    {{ formatTanggal(lap.createdAt) }}
                  </td>
                  <td class="border border-slate-300 px-2 py-2">
                    <p>{{ lap.petugasNama }}</p>
                    <p class="text-xs text-slate-500">{{ lap.reguLabel }}</p>
                  </td>
                  <td class="border border-slate-300 px-2 py-2">{{ lap.lokasi }}</td>
                  <td class="border border-slate-300 px-2 py-2">
                    <p>{{ data.labelKategoriTugasPpsu(lap.kategoriTugas) }}</p>
                    <p class="text-xs text-slate-600">{{ data.labelJenisKerja(lap.jenisPekerjaan) }}</p>
                    <p class="text-xs text-slate-500">{{ data.labelDetailTugasPpsu(lap) }}</p>
                  </td>
                  <td class="border border-slate-300 px-2 py-2 text-xs text-slate-600">
                    Before → Progress → After (tersimpan di sistem)
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="border border-slate-300 px-2 py-4 text-center text-slate-500">
                    Belum ada laporan kerja bulan ini.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <section class="mt-8">
          <h4 class="mb-3 text-base font-bold text-slate-900">B. Status Gudang Alat</h4>
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 px-2 py-2 text-left">Nama Alat</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Status</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Dipinjam Oleh</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Kondisi</th>
              </tr>
            </thead>
            <tbody>
              @for (a of data.asetPpsus(); track a.id) {
                <tr>
                  <td class="border border-slate-300 px-2 py-2 font-medium">{{ a.namaAlat }}</td>
                  <td class="border border-slate-300 px-2 py-2">{{ a.statusPinjam }}</td>
                  <td class="border border-slate-300 px-2 py-2">{{ a.dipinjamOleh || '—' }}</td>
                  <td class="border border-slate-300 px-2 py-2">{{ a.kondisi }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <p class="mt-6 text-xs text-slate-500">
          Dokumen pendukung operasional SI-RAWAJATI · Kelurahan Rawajati. Bukan pengganti sistem resmi Pemprov DKI.
        </p>

        <section class="mt-14 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <p class="text-slate-600">Mengetahui,</p>
            <p class="font-semibold text-slate-900">Kasi Ekbang</p>
            <div class="mt-16 border-b border-slate-400"></div>
            <p class="mt-2 font-semibold">Rudi Hartono</p>
          </div>
          <div>
            <p class="text-slate-600">{{ data.kelurahan.kota }}, {{ shortDate }}</p>
            <p class="font-semibold text-slate-900">Lurah Rawajati</p>
            <div class="mt-16 border-b border-slate-400"></div>
            <p class="mt-2 font-semibold">Sariman, S.Sos, M.Si</p>
          </div>
        </section>
      </article>
    </div>
  `,
})
export class LaporanPpsuRekapComponent {
  readonly data = inject(DataService);

  readonly shortDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  readonly periodeBulan = new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  formatTanggal(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  cetak(): void {
    window.print();
  }
}
