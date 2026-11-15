import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { JenisSetoranSosial, SetoranSosial } from '../../core/models';

@Component({
  selector: 'app-setoran-pmi-baznas-cetak',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/setoran-pmi-baznas" class="text-sm font-semibold text-blue-700">
            ← Kembali ke Setoran PMI &amp; BAZNAS
          </a>
          <h1 class="page-title mt-1">Cetak Report {{ jenis() }}</h1>
          <p class="page-sub">
            Periode {{ labelPeriode() }} — rekap kerja (bukan lembar TTD). Simpan PDF dari print browser.
          </p>
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
            @if (jenis() === 'PMI') {
              Laporan Rekap Setoran PMI
            } @else {
              Laporan Rekap Setoran BAZNAS
            }
          </h3>
          <p class="mt-2 text-base font-semibold text-slate-800">Periode: {{ labelPeriode() }}</p>
          <p class="mt-1 text-sm text-slate-500">Dicetak: {{ tanggalCetak }} · {{ auth.currentUser()?.name }}</p>
        </div>

        <section class="mt-6 grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-3">
          <div class="rounded-lg border border-slate-200 px-3 py-3">
            <p class="text-xs uppercase text-slate-500">Jumlah transaksi</p>
            <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ rows().length }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-3">
            <p class="text-xs uppercase text-slate-500">Total nominal</p>
            <p class="mt-1 text-xl font-extrabold text-blue-800">{{ data.formatRp(total()) }}</p>
          </div>
          @if (jenis() === 'PMI') {
            <div class="rounded-lg border border-slate-200 px-3 py-3">
              <p class="text-xs uppercase text-slate-500">Uang map / status</p>
              <p class="mt-1 text-lg font-extrabold text-slate-900">{{ data.formatRp(uangMap()) }}</p>
              <p class="text-xs" [class]="selisih() === 0 ? 'text-emerald-700' : 'text-amber-700'">
                {{ selisih() === 0 ? 'Klop dengan catatan' : 'Selisih: ' + data.formatRp(selisih()) }}
              </p>
            </div>
          } @else {
            <div class="rounded-lg border border-slate-200 px-3 py-3">
              <p class="text-xs uppercase text-slate-500">Dengan kupon</p>
              <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ denganKupon() }}</p>
            </div>
          }
        </section>

        <section class="mt-8">
          <h4 class="mb-3 text-base font-bold text-slate-900">Rincian setoran</h4>
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 px-2 py-1.5 text-left">No</th>
                <th class="border border-slate-300 px-2 py-1.5 text-left">Tanggal</th>
                <th class="border border-slate-300 px-2 py-1.5 text-left">Penyetor</th>
                <th class="border border-slate-300 px-2 py-1.5 text-left">Sumber</th>
                @if (jenis() === 'BAZNAS') {
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Kupon</th>
                }
                <th class="border border-slate-300 px-2 py-1.5 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id; let i = $index) {
                <tr>
                  <td class="border border-slate-300 px-2 py-1.5">{{ i + 1 }}</td>
                  <td class="border border-slate-300 px-2 py-1.5">{{ row.tanggalSetor }}</td>
                  <td class="border border-slate-300 px-2 py-1.5">{{ row.namaPenyetor }}</td>
                  <td class="border border-slate-300 px-2 py-1.5">{{ data.labelSumberSetoran(row.sumber) }}</td>
                  @if (jenis() === 'BAZNAS') {
                    <td class="border border-slate-300 px-2 py-1.5">
                      {{ row.nomorKupon || (row.adaKupon ? 'Ada' : '—') }}
                    </td>
                  }
                  <td class="border border-slate-300 px-2 py-1.5 text-right font-semibold">
                    {{ data.formatRp(row.nominal) }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td
                    class="border border-slate-300 px-2 py-6 text-center text-slate-500"
                    [attr.colspan]="jenis() === 'BAZNAS' ? 6 : 5"
                  >
                    Belum ada data periode ini.
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="bg-slate-50 font-bold">
                <td
                  class="border border-slate-300 px-2 py-2 text-right"
                  [attr.colspan]="jenis() === 'BAZNAS' ? 5 : 4"
                >
                  Total
                </td>
                <td class="border border-slate-300 px-2 py-2 text-right">{{ data.formatRp(total()) }}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <p class="mt-6 text-sm text-slate-600">
          @if (jenis() === 'PMI') {
            Rekap kerja untuk mencocokkan catatan dengan uang di map sebelum diserahkan ke PMI.
            Tidak perlu TTD basah — cukup arsip digital / print internal.
          } @else {
            Rekap kerja setoran BAZNAS periode ini. Tidak perlu TTD basah — cukup arsip digital / print internal.
          }
        </p>
        <p class="mt-2 text-xs text-slate-500">
          Dicetak {{ tanggalCetak }} · {{ pembuat()?.name || auth.currentUser()?.name }} ({{
            pembuat()?.jabatan || 'Staf'
          }})
        </p>
      </article>
    </div>
  `,
})
export class SetoranPmiBaznasCetakComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  private readonly route = inject(ActivatedRoute);

  private readonly query = toSignal(this.route.queryParamMap.pipe(map((q) => q)), {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly jenis = computed<JenisSetoranSosial>(() => {
    const j = this.query().get('jenis');
    return j === 'BAZNAS' ? 'BAZNAS' : 'PMI';
  });

  readonly bulan = computed(() => {
    const n = Number(this.query().get('bulan'));
    return n >= 1 && n <= 12 ? n : new Date().getMonth() + 1;
  });

  readonly tahun = computed(() => {
    const n = Number(this.query().get('tahun'));
    return n >= 2000 ? n : new Date().getFullYear();
  });

  readonly tanggalCetak = this.data.formatTanggalId(new Date());

  readonly bulanOptions = [
    '',
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  readonly labelPeriode = computed(
    () => `${this.bulanOptions[this.bulan()] || ''} ${this.tahun()}`,
  );

  readonly rows = computed(() =>
    this.data
      .setoranSosialPeriode(this.tahun(), this.bulan())
      .filter((s: SetoranSosial) => s.jenis === this.jenis()),
  );

  readonly total = computed(() => this.data.totalSetoranJenis(this.tahun(), this.bulan(), this.jenis()));

  readonly uangMap = computed(
    () => this.data.getRekapMapPmi(this.tahun(), this.bulan())?.totalUangMap ?? 0,
  );

  readonly selisih = computed(() => this.data.selisihMapPmi(this.tahun(), this.bulan()));

  readonly denganKupon = computed(
    () => this.rows().filter((r) => r.adaKupon || !!r.nomorKupon).length,
  );

  /** Metadata pencatat di kaki rekap (bukan blok TTD). */
  readonly pembuat = computed(() => {
    const me = this.auth.currentUser();
    if (me && !/lurah/i.test(me.jabatan || '') && me.email !== 'lurah@kelurahan.id') {
      return me;
    }
    return (
      this.data.users().find((u) => /sekretaris|sekkel/i.test(u.jabatan || '')) ||
      this.data.users().find((u) => u.email === 'sekkel@kelurahan.id') ||
      me
    );
  });

  cetak(): void {
    window.print();
  }
}
