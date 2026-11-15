import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { LaporanKeuanganRt } from '../../core/models';

@Component({
  selector: 'app-daop-cetak',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a routerLink="/app/daop" class="text-sm font-semibold text-blue-700">← Kembali</a>
          <h1 class="page-title mt-1">
            @if (untukKetuaRt()) {
              Unduh Form DAOP (Word)
            } @else {
              Cetak Form Laporan DAOP
            }
          </h1>
          <p class="page-sub">
            @if (untukKetuaRt()) {
              Ketua RT mengunduh file Word
              @if (punyaTemplateResmi()) {
                <strong>(template resmi kelurahan)</strong>
              } @else {
                (form demo — menunggu template resmi dari staf/Lurah)
              }
              , mengisi &amp; TTD bersama Bendahara, lalu cetak untuk
              <strong>stempel basah Ketua RT</strong>.
            } @else {
              Form DAOP bulanan {{ laporan()?.tingkat === 'RW' ? 'Ketua RW' : 'Ketua RT' }}.
              @if (punyaTemplateResmi()) {
                Menggunakan template resmi yang diunggah staf/Lurah.
              } @else {
                Belum ada template resmi — unduhan memakai form demo sistem.
              }
            }
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-primary" (click)="unduhWord()">
            @if (punyaTemplateResmi()) {
              Unduh template resmi
            } @else {
              Unduh Word (.doc)
            }
          </button>
          @if (!untukKetuaRt()) {
            <button type="button" class="btn-secondary" (click)="tandaiCetak()">Tandai Sudah Cetak</button>
            <button type="button" class="btn-secondary" (click)="cetakBrowser()">Cetak / PDF browser</button>
          }
        </div>
      </header>

      @if (untukKetuaRt()) {
        <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p class="font-bold">Alur Ketua RT</p>
          <ol class="mt-2 list-decimal space-y-1 pl-5">
            <li>Unduh form Word di atas</li>
            <li>Isi / ketik di Microsoft Word (pemasukan, pengeluaran, catatan)</li>
            <li>TTD Ketua RT &amp; TTD Bendahara RT di Word (atau TTD basah di kertas nanti)</li>
            <li>Cetak kertas dari Word → tempel <strong>stempel basah Ketua RT</strong></li>
            <li>Foto/scan lembar bertanda tangan + stempel → upload di menu Laporan DAOP</li>
          </ol>
        </div>
      }

      @if (laporan(); as lap) {
        <article class="mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10">
          <p class="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pratinjau isi yang ikut ke file Word
          </p>
          <header class="border-b-2 border-slate-900 pb-4 text-center">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Pemerintah Provinsi DKI Jakarta
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-700">Kota Administrasi Jakarta Selatan</p>
            <h2 class="mt-2 text-xl font-extrabold uppercase text-slate-900">Kelurahan Rawajati</h2>
            <p class="mt-1 text-xs text-slate-500">{{ data.kelurahan.alamatKantor }}</p>
          </header>

          <div class="mt-6 text-center">
            <h3 class="text-lg font-bold uppercase underline decoration-slate-400 underline-offset-4">
              {{ data.labelJenisKeuanganRt(lap.jenis) }}
              {{ lap.tingkat === 'RW' ? 'TINGKAT RW' : 'TINGKAT RT' }}
            </h3>
            <p class="mt-2 text-base text-slate-700">{{ lap.periodeLabel }}</p>
            <p class="mt-1 font-semibold text-slate-900">{{ data.labelDaopWilayah(lap) }}</p>
          </div>

          <section class="mt-8 space-y-3 text-sm text-slate-800">
            <p>
              <span class="font-semibold">{{ lap.tingkat === 'RW' ? 'Ketua RW:' : 'Ketua RT:' }}</span>
              {{ data.labelDaopKetua(lap) }}
            </p>
            <table class="mt-4 w-full border-collapse">
              <tbody>
                <tr>
                  <td class="border border-slate-300 px-3 py-2 font-semibold">Pemasukan</td>
                  <td class="border border-slate-300 px-3 py-2 text-right">{{ data.formatRp(lap.pemasukan) }}</td>
                </tr>
                <tr>
                  <td class="border border-slate-300 px-3 py-2 font-semibold">Pengeluaran</td>
                  <td class="border border-slate-300 px-3 py-2 text-right">
                    {{ data.formatRp(lap.pengeluaran) }}
                  </td>
                </tr>
                <tr class="bg-slate-50">
                  <td class="border border-slate-300 px-3 py-2 font-bold">Saldo</td>
                  <td class="border border-slate-300 px-3 py-2 text-right font-bold">
                    {{ data.formatRp(lap.saldo) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="pt-2 text-slate-600">
              Catatan: {{ lap.catatan || '(bisa dilengkapi di Word)' }}
            </p>
          </section>

          <section class="mt-14 grid grid-cols-2 gap-8 text-center text-sm">
            <div>
              <p class="text-slate-600">{{ lap.tingkat === 'RW' ? 'Bendahara RW' : 'Bendahara RT' }}</p>
              <div class="mt-16 border-b border-slate-400"></div>
              <p class="mt-2 text-xs text-slate-500">(TTD Bendahara)</p>
            </div>
            <div>
              <p class="text-slate-600">{{ data.kelurahan.kota }}, ………………</p>
              <p class="font-semibold text-slate-900">
                {{ lap.tingkat === 'RW' ? 'Ketua RW' : 'Ketua RT' }}
              </p>
              <div class="mt-16 border-b border-slate-400"></div>
              <p class="mt-2 font-semibold">{{ data.labelDaopKetua(lap) }}</p>
              <p class="text-xs text-slate-500">(TTD + stempel basah setelah dicetak)</p>
            </div>
          </section>
        </article>
      } @else {
        <div class="card text-center text-slate-500">Laporan tidak ditemukan.</div>
      }
    </div>
  `,
})
export class DaopCetakComponent {
  readonly data = inject(DataService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') || '')), {
    initialValue: '',
  });

  readonly laporan = computed(() => {
    const id = this.id();
    return id ? this.data.getLaporanKeuangan(id) : undefined;
  });

  /** Portal Ketua RT: hanya unduh Word (bukan print browser). */
  readonly untukKetuaRt = computed(() => this.auth.isKetuaRtUser());

  readonly punyaTemplateResmi = computed(() => !!this.data.templateDaopKosong()?.objectUrl);

  tandaiCetak(): void {
    const lap = this.laporan();
    if (!lap) return;
    this.data.markCetakKeuanganRt(lap.id);
  }

  cetakBrowser(): void {
    const lap = this.laporan();
    if (lap) this.data.markCetakKeuanganRt(lap.id);
    window.print();
  }

  unduhWord(): void {
    const lap = this.laporan();
    if (!lap) return;
    this.data.markCetakKeuanganRt(lap.id);

    // Prioritas: template kosong resmi dari Lurah / staf kelurahan
    if (this.data.unduhTemplateDaopKosongJikaAda()) {
      return;
    }

    // Fallback demo: generate form Word dari sistem
    const html = this.buildWordHtml(lap);
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword;charset=utf-8',
    });
    const wilayah = this.data.labelDaopWilayah(lap).replace(/[\\/:*?"<>|]+/g, '-');
    const filename = `DAOP-${wilayah}-${lap.periodeLabel.replace(/\s+/g, '-')}.doc`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.data.showToast(
      'Form demo diunduh (belum ada template resmi). Staf/Lurah bisa unggah template di Master Data.',
    );
  }

  private buildWordHtml(lap: LaporanKeuanganRt): string {
    const tingkat = lap.tingkat === 'RW' ? 'RW' : 'RT';
    const ketuaLabel = tingkat === 'RW' ? 'Ketua RW' : 'Ketua RT';
    const bendaharaLabel = tingkat === 'RW' ? 'Bendahara RW' : 'Bendahara RT';
    const wilayah = this.data.labelDaopWilayah(lap);
    const ketua = this.data.labelDaopKetua(lap);
    const jenis = this.data.labelJenisKeuanganRt(lap.jenis);
    const catatan = lap.catatan || '';

    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Laporan DAOP ${wilayah}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #111; }
  .center { text-align: center; }
  .header { border-bottom: 2.5pt solid #000; padding-bottom: 8pt; margin-bottom: 16pt; }
  h1 { font-size: 16pt; text-transform: uppercase; margin: 6pt 0; }
  h2 { font-size: 13pt; text-transform: uppercase; text-decoration: underline; margin: 12pt 0 4pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 12pt; }
  td { border: 1pt solid #333; padding: 6pt 8pt; }
  .sign { width: 100%; margin-top: 48pt; }
  .sign td { border: none; vertical-align: top; width: 50%; text-align: center; padding-top: 8pt; }
  .line { border-bottom: 1pt solid #333; height: 64pt; margin: 0 24pt; }
  .muted { font-size: 9pt; color: #444; }
  .box { border: 1pt dashed #666; padding: 10pt; margin-top: 10pt; min-height: 48pt; }
  .alur { font-size: 9pt; color: #333; margin-top: 28pt; border-top: 1pt solid #999; padding-top: 8pt; }
</style>
</head>
<body>
  <div class="header center">
    <div style="font-size:10pt; letter-spacing:2pt; text-transform:uppercase;">Pemerintah Provinsi DKI Jakarta</div>
    <div>Kota Administrasi Jakarta Selatan</div>
    <h1>Kelurahan Rawajati</h1>
    <div class="muted">${this.escape(this.data.kelurahan.alamatKantor)}</div>
  </div>

  <div class="center">
    <h2>${this.escape(jenis)} TINGKAT ${tingkat}</h2>
    <div>${this.escape(lap.periodeLabel)}</div>
    <div><strong>${this.escape(wilayah)}</strong></div>
  </div>

  <p style="margin-top:18pt;"><strong>${ketuaLabel}:</strong> ${this.escape(ketua)}</p>

  <p class="muted">Angka di bawah bisa diubah / dilengkapi saat mengedit di Microsoft Word.</p>
  <table>
    <tr>
      <td style="width:40%;"><strong>Pemasukan</strong></td>
      <td style="text-align:right;">${this.escape(this.data.formatRp(lap.pemasukan))}</td>
    </tr>
    <tr>
      <td><strong>Pengeluaran</strong></td>
      <td style="text-align:right;">${this.escape(this.data.formatRp(lap.pengeluaran))}</td>
    </tr>
    <tr>
      <td><strong>Saldo</strong></td>
      <td style="text-align:right;"><strong>${this.escape(this.data.formatRp(lap.saldo))}</strong></td>
    </tr>
  </table>

  <p style="margin-top:14pt;"><strong>Catatan:</strong></p>
  <div class="box">${catatan ? this.escape(catatan) : '&nbsp;'}</div>

  <table class="sign">
    <tr>
      <td>
        <div>${bendaharaLabel}</div>
        <div class="line"></div>
        <div class="muted">(TTD ${bendaharaLabel} &amp; nama jelas)</div>
      </td>
      <td>
        <div>${this.escape(this.data.kelurahan.kota)}, ....................</div>
        <div><strong>${ketuaLabel}</strong></div>
        <div class="line"></div>
        <div><strong>${this.escape(ketua)}</strong></div>
        <div class="muted">(TTD ${ketuaLabel})</div>
        <div class="muted" style="margin-top:6pt;">Setelah dicetak: tempel <strong>stempel basah ${ketuaLabel}</strong></div>
      </td>
    </tr>
  </table>

  <div class="alur">
    Alur Ketua RT: unduh Word → isi &amp; TTD Ketua + Bendahara → cetak kertas → stempel basah Ketua RT
    → foto/scan → upload di JATI (atau datang ke kelurahan dibantu staf).
  </div>
</body>
</html>`;
  }

  private escape(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
