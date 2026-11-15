import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

const BULAN = [
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

/** Lembar share warga: siapa sudah bayar + ringkas kas (tanpa NIK). */
@Component({
  selector: 'app-kas-rt-cetak',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/kas-rt" class="text-sm font-semibold text-blue-700">← Kembali ke Kas RT</a>
          <h1 class="page-title mt-1">Rekap Kas &amp; Iuran (Share Warga)</h1>
          <p class="page-sub">Cetak / PDF / foto lalu kirim ke grup WA — tanpa menampilkan NIK.</p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <div>
            <label class="field-label" for="c-bln">Bulan iuran</label>
            <select id="c-bln" class="field-input" [ngModel]="bulan()" (ngModelChange)="bulan.set(+$event)">
              @for (b of bulanOptions; track b) {
                <option [value]="b">{{ BULAN[b] }}</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label" for="c-thn">Tahun</label>
            <select id="c-thn" class="field-input" [ngModel]="tahun()" (ngModelChange)="tahun.set(+$event)">
              <option [value]="2025">2025</option>
              <option [value]="2026">2026</option>
              <option [value]="2027">2027</option>
            </select>
          </div>
          <button type="button" class="btn-primary" (click)="cetak()">Unduh / Cetak PDF</button>
        </div>
      </header>

      <article
        class="mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <header class="border-b-2 border-slate-900 pb-3 text-center">
          <p class="text-xs font-bold uppercase tracking-wide">{{ data.kelurahan.nama }}</p>
          <h2 class="mt-1 text-lg font-extrabold uppercase">Rekap Kas &amp; Iuran Warga</h2>
          <p class="mt-1 text-sm font-semibold">{{ labelWilayah() }}</p>
          <p class="mt-1 text-sm text-slate-600">Periode iuran: {{ BULAN[bulan()] }} {{ tahun() }}</p>
          <p class="text-xs text-slate-500">Dicetak: {{ tanggalCetak }} · {{ auth.currentUser()?.name }}</p>
        </header>

        <section class="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
          <div class="rounded-lg border border-slate-200 px-2 py-2">
            <p class="text-[10px] uppercase text-slate-500">Saldo kas</p>
            <p class="font-extrabold text-emerald-700">{{ data.formatRp(ringkas().saldo) }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 px-2 py-2">
            <p class="text-[10px] uppercase text-slate-500">Sudah bayar</p>
            <p class="font-extrabold text-blue-800">{{ statusIuran().lunas }} KK</p>
          </div>
          <div class="rounded-lg border border-slate-200 px-2 py-2">
            <p class="text-[10px] uppercase text-slate-500">Belum bayar</p>
            <p class="font-extrabold text-amber-700">{{ statusIuran().belum }} KK</p>
          </div>
        </section>

        <section class="mt-6">
          <h3 class="mb-2 text-sm font-bold">Status iuran {{ BULAN[bulan()] }} {{ tahun() }}</h3>
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 px-2 py-1 text-left">No</th>
                <th class="border border-slate-300 px-2 py-1 text-left">Nama</th>
                <th class="border border-slate-300 px-2 py-1 text-left">Status</th>
                <th class="border border-slate-300 px-2 py-1 text-left">Tgl bayar</th>
              </tr>
            </thead>
            <tbody>
              @for (row of daftarIuran(); track row.id; let i = $index) {
                <tr>
                  <td class="border border-slate-300 px-2 py-1">{{ i + 1 }}</td>
                  <td class="border border-slate-300 px-2 py-1 font-semibold">{{ row.nama }}</td>
                  <td class="border border-slate-300 px-2 py-1">
                    {{ row.lunas ? 'Lunas' : 'Belum' }}
                  </td>
                  <td class="border border-slate-300 px-2 py-1">{{ row.tanggal || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <section class="mt-6">
          <h3 class="mb-2 text-sm font-bold">Cuplikan buku kas (terbaru)</h3>
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 px-2 py-1 text-left">Tgl</th>
                <th class="border border-slate-300 px-2 py-1 text-left">Uraian</th>
                <th class="border border-slate-300 px-2 py-1 text-right">Masuk</th>
                <th class="border border-slate-300 px-2 py-1 text-right">Keluar</th>
              </tr>
            </thead>
            <tbody>
              @for (k of cuplikanKas(); track k.id) {
                <tr>
                  <td class="border border-slate-300 px-2 py-1 whitespace-nowrap">{{ k.tanggal }}</td>
                  <td class="border border-slate-300 px-2 py-1">{{ k.uraian }}</td>
                  <td class="border border-slate-300 px-2 py-1 text-right">
                    {{ k.debet ? data.formatRp(k.debet) : '—' }}
                  </td>
                  <td class="border border-slate-300 px-2 py-1 text-right">
                    {{ k.kredit ? data.formatRp(k.kredit) : '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <p class="mt-6 text-[10px] text-slate-500">
          JATI · transparansi kas RT · data iuran tertaut database warga (NIK/KK di sistem, tidak dicetak di
          lembar publik)
        </p>
      </article>
    </div>
  `,
})
export class KasRtCetakComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  readonly BULAN = BULAN;
  readonly bulanOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  private readonly route = inject(ActivatedRoute);
  private readonly qp = toSignal(
    this.route.queryParamMap.pipe(
      map((q) => ({
        tahun: Number(q.get('tahun')) || new Date().getFullYear(),
        bulan: Number(q.get('bulan')) || new Date().getMonth() + 1,
      })),
    ),
    {
      initialValue: {
        tahun: new Date().getFullYear(),
        bulan: new Date().getMonth() + 1,
      },
    },
  );

  /** Bisa diganti di UI; seed awal dari query ?tahun=&bulan= */
  readonly tahun = signal(this.qp().tahun);
  readonly bulan = signal(this.qp().bulan);
  readonly tanggalCetak = this.data.formatTanggalId();

  constructor() {
    // Sinkron ulang jika navigasi dari Kas RT dengan query params baru
    effect(() => {
      const q = this.qp();
      this.tahun.set(q.tahun);
      this.bulan.set(q.bulan);
    });
  }

  readonly rtId = computed(() => this.auth.currentUser()?.rtId || 'rt-1');
  readonly labelWilayah = computed(() => this.data.labelWilayah(this.rtId()));
  readonly ringkas = computed(() => this.data.ringkasKasRt(this.rtId()));

  readonly daftarIuran = computed(() => {
    const warga = this.data
      .wargaIuranScoped(this.auth.currentUser())
      .filter((w) => w.rtId === this.rtId())
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    return warga.map((w) => {
      const iu = this.data.getIuran(w.id, this.tahun(), this.bulan());
      return {
        id: w.id,
        nama: w.nama,
        lunas: !!iu,
        tanggal: iu?.tanggalBayar,
      };
    });
  });

  readonly statusIuran = computed(() => {
    const list = this.daftarIuran();
    const lunas = list.filter((x) => x.lunas).length;
    return { lunas, belum: list.length - lunas };
  });

  readonly cuplikanKas = computed(() => this.data.kasTransaksiScoped(this.rtId()).slice(0, 12));

  cetak(): void {
    window.print();
  }
}
