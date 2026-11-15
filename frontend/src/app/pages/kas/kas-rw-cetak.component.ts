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

/** Rekap bulanan Kas RW untuk share grup BOD — status setoran per RT. */
@Component({
  selector: 'app-kas-rw-cetak',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/kas-rw" class="text-sm font-semibold text-blue-700">← Kembali ke Kas RW</a>
          <h1 class="page-title mt-1">Rekap Kas RW (Share BOD)</h1>
          <p class="page-sub">Cetak / PDF sekali sebulan — status setoran tiap RT + cuplikan buku kas.</p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <div>
            <label class="field-label" for="c-bln">Bulan</label>
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
          <h2 class="mt-1 text-lg font-extrabold uppercase">Rekap Kas &amp; Setoran RT</h2>
          <p class="mt-1 text-sm font-semibold">{{ labelRw() }}</p>
          <p class="mt-1 text-sm text-slate-600">Periode: {{ BULAN[bulan()] }} {{ tahun() }}</p>
          <p class="text-xs text-slate-500">Dicetak: {{ tanggalCetak }} · {{ auth.currentUser()?.name }}</p>
        </header>

        <section class="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
          <div class="rounded-lg border border-slate-200 px-2 py-2">
            <p class="text-[10px] uppercase text-slate-500">Saldo kas RW</p>
            <p class="font-extrabold text-emerald-700">{{ data.formatRp(ringkas().saldo) }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 px-2 py-2">
            <p class="text-[10px] uppercase text-slate-500">RT sudah setor</p>
            <p class="font-extrabold text-blue-800">{{ statusSetor().lunas }}/{{ statusSetor().total }}</p>
          </div>
          <div class="rounded-lg border border-slate-200 px-2 py-2">
            <p class="text-[10px] uppercase text-slate-500">Nominal setor</p>
            <p class="font-extrabold text-slate-900">{{ data.formatRp(statusSetor().nominal) }}</p>
          </div>
        </section>

        <section class="mt-6">
          <h3 class="mb-2 text-sm font-bold">Status setoran RT — {{ BULAN[bulan()] }} {{ tahun() }}</h3>
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 px-2 py-1 text-left">No</th>
                <th class="border border-slate-300 px-2 py-1 text-left">RT</th>
                <th class="border border-slate-300 px-2 py-1 text-left">Ketua</th>
                <th class="border border-slate-300 px-2 py-1 text-left">Status</th>
                <th class="border border-slate-300 px-2 py-1 text-left">Tgl setor</th>
                <th class="border border-slate-300 px-2 py-1 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              @for (row of daftarSetor(); track row.rtId; let i = $index) {
                <tr>
                  <td class="border border-slate-300 px-2 py-1">{{ i + 1 }}</td>
                  <td class="border border-slate-300 px-2 py-1 font-semibold">RT {{ row.nomor }}</td>
                  <td class="border border-slate-300 px-2 py-1">{{ row.namaKetua }}</td>
                  <td class="border border-slate-300 px-2 py-1">{{ row.lunas ? 'Lunas' : 'Belum' }}</td>
                  <td class="border border-slate-300 px-2 py-1">{{ row.tanggal || '—' }}</td>
                  <td class="border border-slate-300 px-2 py-1 text-right">
                    {{ row.lunas ? data.formatRp(row.nominal) : '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <section class="mt-6">
          <h3 class="mb-2 text-sm font-bold">Cuplikan buku kas RW (terbaru)</h3>
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
          JATI · rekap bulanan untuk grup BOD · catatan per RT di portal Ketua RW
        </p>
      </article>
    </div>
  `,
})
export class KasRwCetakComponent {
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

  readonly tahun = signal(this.qp().tahun);
  readonly bulan = signal(this.qp().bulan);
  readonly tanggalCetak = this.data.formatTanggalId();

  constructor() {
    effect(() => {
      const q = this.qp();
      this.tahun.set(q.tahun);
      this.bulan.set(q.bulan);
    });
  }

  readonly rwId = computed(() => this.auth.currentUser()?.rwId || 'rw-7');
  readonly labelRw = computed(() => {
    const rw = this.data.getRw(this.rwId());
    return rw ? this.data.labelRw(rw.nomor) : 'RW';
  });
  readonly ringkas = computed(() => this.data.ringkasKasRw(this.rwId()));
  readonly statusSetor = computed(() =>
    this.data.ringkasSetoranRtBulan(this.rwId(), this.tahun(), this.bulan()),
  );

  readonly daftarSetor = computed(() => {
    return this.data
      .rts()
      .filter((r) => r.rwId === this.rwId())
      .sort((a, b) => a.nomor.localeCompare(b.nomor, 'id'))
      .map((rt) => {
        const s = this.data.getSetoranRtKeRw(this.rwId(), rt.id, this.tahun(), this.bulan());
        return {
          rtId: rt.id,
          nomor: rt.nomor,
          namaKetua: rt.namaKetua,
          lunas: !!s,
          tanggal: s?.tanggalBayar,
          nominal: s?.nominal || 200_000,
        };
      });
  });

  readonly cuplikanKas = computed(() => this.data.kasTransaksiRwScoped(this.rwId()).slice(0, 12));

  cetak(): void {
    window.print();
  }
}
