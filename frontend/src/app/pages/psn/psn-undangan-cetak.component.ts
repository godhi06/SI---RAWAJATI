import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-psn-undangan-cetak',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/psn" class="text-sm font-semibold text-blue-700">← Kembali ke Laporan PSN</a>
          <h1 class="page-title mt-1">Template PDF Undangan PSN</h1>
          <p class="page-sub">
            Cetak → pilih “Save as PDF”. File hasil bisa diunggah lagi di panel Undangan PSN · WA + PDF.
          </p>
        </div>
        <button type="button" class="btn-primary" (click)="cetak()">Cetak / Simpan PDF</button>
      </header>

      <article
        class="mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <header class="border-b-2 border-slate-900 pb-4 text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Pemerintah Provinsi DKI Jakarta
          </p>
          <p class="mt-1 text-sm font-semibold text-slate-700">Kota Administrasi Jakarta Selatan</p>
          <h2 class="mt-2 text-xl font-extrabold uppercase text-slate-900">Kelurahan Rawajati</h2>
          <p class="mt-1 text-xs text-slate-500">{{ data.kelurahan.alamatKantor }}</p>
        </header>

        <div class="mt-6 flex flex-wrap items-start justify-between gap-3 text-sm">
          <div>
            <p>
              <span class="font-semibold">Nomor</span> : {{ draft().nomorSurat }}
            </p>
            <p><span class="font-semibold">Sifat</span> : Biasa</p>
            <p><span class="font-semibold">Lampiran</span> : 1 (satu) berkas</p>
            <p><span class="font-semibold">Hal</span> : Undangan Pertemuan PSN Jumantik</p>
          </div>
          <div class="text-right">
            <p>Jakarta, {{ tanggalSurat }}</p>
          </div>
        </div>

        <div class="mt-6 text-sm leading-relaxed text-slate-800">
          <p>Kepada Yth.</p>
          <p class="font-semibold">Bapak/Ibu Ketua RW se-Kelurahan Rawajati</p>
          <p>di tempat</p>

          <p class="mt-6">Dengan hormat,</p>
          <p class="mt-3">
            Sehubungan dengan kegiatan Pemberantasan Sarang Nyamuk (PSN) Jumantik di wilayah Kelurahan Rawajati,
            bersama ini kami mengundang Bapak/Ibu untuk hadir dalam pertemuan, dengan ketentuan sebagai berikut:
          </p>

          <table class="mt-4 w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td class="w-36 py-1.5 align-top font-semibold">Hari/tanggal</td>
                <td class="py-1.5 align-top">: {{ draft().hariTanggal }}</td>
              </tr>
              <tr>
                <td class="py-1.5 align-top font-semibold">Waktu</td>
                <td class="py-1.5 align-top">: {{ draft().jam }}</td>
              </tr>
              <tr>
                <td class="py-1.5 align-top font-semibold">Tempat</td>
                <td class="py-1.5 align-top">: {{ draft().tempat }}</td>
              </tr>
              <tr>
                <td class="py-1.5 align-top font-semibold">Agenda</td>
                <td class="py-1.5 align-top">: {{ draft().agenda }}</td>
              </tr>
            </tbody>
          </table>

          <p class="mt-4">
            Demikian undangan ini disampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.
          </p>
        </div>

        <section class="mt-14 grid grid-cols-2 gap-8 text-center text-sm">
          <div></div>
          <div>
            <p class="text-slate-600">Lurah Rawajati</p>
            <div class="mt-16 border-b border-slate-400"></div>
            <p class="mt-2 font-semibold">Sariman, S.Sos, M.Si</p>
            <p class="text-xs text-slate-500">NIP. —</p>
          </div>
        </section>

        <p class="mt-10 text-xs text-slate-500 print:hidden">
          Tip: di dialog cetak browser, pilih printer “Microsoft Print to PDF” / “Save as PDF”.
        </p>
      </article>
    </div>
  `,
})
export class PsnUndanganCetakComponent {
  readonly data = inject(DataService);
  readonly draft = this.data.undanganPsnDraft;

  readonly tanggalSurat = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  cetak(): void {
    window.print();
  }
}
