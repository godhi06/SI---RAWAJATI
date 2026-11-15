import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { KategoriKasRt } from '../../core/models';

type TabKas = 'IURAN' | 'BUKU';

const BULAN_LABEL = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/** Kas RT: matriks iuran (NIK/KK) + buku kas — siap cetak share warga. */
@Component({
  selector: 'app-kas-rt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Kas RT</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            {{ labelWilayah() }} — iuran warga + buku kas (tertaut NIK/KK)
          </p>
          <p class="page-sub">
            Ganti Excel/WA bendahara. Cetak rekap untuk dishare ke warga (tanpa NIK di lembar publik).
          </p>
        </div>
        <a
          class="btn-primary !py-2 !px-3 text-sm"
          [routerLink]="['/app/kas-rt/cetak']"
          [queryParams]="{ tahun: tahun(), bulan: bulanFokus() }"
        >
          Cetak / Share warga
        </a>
      </header>

      @if (ringkas(); as r) {
        <section class="grid gap-3 sm:grid-cols-3">
          <article class="card !p-4">
            <p class="text-xs font-bold uppercase text-slate-500">Saldo kas</p>
            <p class="mt-1 text-2xl font-extrabold text-emerald-700">{{ data.formatRp(r.saldo) }}</p>
          </article>
          <article class="card !p-4">
            <p class="text-xs font-bold uppercase text-slate-500">Masuk (debet)</p>
            <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ data.formatRp(r.debet) }}</p>
          </article>
          <article class="card !p-4">
            <p class="text-xs font-bold uppercase text-slate-500">Iuran {{ BULAN_LABEL[bulanFokus()] }} {{ tahun() }}</p>
            <p class="mt-1 text-2xl font-extrabold text-blue-800">
              {{ iuranBulan().lunas }}/{{ iuranBulan().total }}
            </p>
            <p class="text-xs text-slate-500">KK sudah bayar</p>
          </article>
        </section>
      }

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-xl border-2 px-4 py-2 text-sm font-bold"
          [class]="tab() === 'IURAN' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200'"
          (click)="tab.set('IURAN')"
        >
          Matriks iuran
        </button>
        <button
          type="button"
          class="rounded-xl border-2 px-4 py-2 text-sm font-bold"
          [class]="tab() === 'BUKU' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200'"
          (click)="tab.set('BUKU')"
        >
          Buku kas harian
        </button>
      </div>

      @if (tab() === 'IURAN') {
        <section class="card space-y-3 !p-4">
          <div class="flex flex-wrap items-end gap-3">
            <div>
              <label class="field-label" for="thn-iu">Tahun</label>
              <select id="thn-iu" class="field-input" [ngModel]="tahun()" (ngModelChange)="tahun.set(+$event)">
                <option [value]="2025">2025</option>
                <option [value]="2026">2026</option>
                <option [value]="2027">2027</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="bln-iu">Fokus bulan (rekap)</label>
              <select
                id="bln-iu"
                class="field-input"
                [ngModel]="bulanFokus()"
                (ngModelChange)="bulanFokus.set(+$event)"
              >
                @for (b of bulanOptions; track b) {
                  <option [value]="b">{{ BULAN_LABEL[b] }}</option>
                }
              </select>
            </div>
            <input
              class="field-input max-w-xs flex-1"
              [ngModel]="q()"
              (ngModelChange)="q.set($event)"
              placeholder="Cari nama / NIK / KK…"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[52rem] border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50">
                  <th class="border border-slate-200 px-2 py-1.5 text-left">No</th>
                  <th class="border border-slate-200 px-2 py-1.5 text-left">Nama · NIK · KK</th>
                  @for (b of bulanOptions; track b) {
                    <th class="border border-slate-200 px-1 py-1.5 text-center">{{ BULAN_LABEL[b] }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (w of wargaIuran(); track w.id; let i = $index) {
                  <tr>
                    <td class="border border-slate-200 px-2 py-1 align-top">{{ i + 1 }}</td>
                    <td class="border border-slate-200 px-2 py-1 align-top">
                      <p class="font-bold text-slate-900">{{ w.nama }}</p>
                      <p class="font-mono text-[10px] text-slate-500">NIK {{ w.nik }}</p>
                      @if (w.noKk) {
                        <p class="font-mono text-[10px] text-slate-400">KK {{ w.noKk }}</p>
                      }
                    </td>
                    @for (b of bulanOptions; track b) {
                      <td class="border border-slate-200 px-0.5 py-0.5 text-center align-middle">
                        @if (data.getIuran(w.id, tahun(), b); as iu) {
                          <button
                            type="button"
                            class="w-full rounded bg-emerald-50 px-0.5 py-1 font-semibold text-emerald-800 hover:bg-rose-50 hover:text-rose-700"
                            title="Klik untuk hapus"
                            (click)="hapusIuran(iu.id)"
                          >
                            {{ labelTglPendek(iu.tanggalBayar) }}
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="w-full rounded px-0.5 py-1 text-slate-300 hover:bg-blue-50 hover:text-blue-700"
                            title="Tandai sudah bayar"
                            (click)="tandaiBayar(w.id, b)"
                          >
                            ·
                          </button>
                        }
                      </td>
                    }
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="14" class="border border-slate-200 px-3 py-8 text-center text-slate-500">
                      @if (q().trim()) {
                        Tidak ada nama / NIK / KK yang cocok dengan “{{ q() }}”.
                      } @else {
                        Belum ada warga KK. Isi dulu di
                        <a routerLink="/app/data-warga" class="font-semibold text-blue-700">Data Warga</a>.
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-slate-500">
            Klik sel kosong = tandai bayar hari ini · klik tanggal hijau = hapus. NIK/KK dari database warga.
          </p>
        </section>
      }

      @if (tab() === 'BUKU') {
        <section class="card space-y-3 !p-4">
          <p class="text-sm font-bold text-slate-800">Catat transaksi</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="field-label">Tanggal</label>
              <input type="date" class="field-input" [(ngModel)]="formKas.tanggal" name="kas-tgl" />
            </div>
            <div>
              <label class="field-label">Kategori</label>
              <select class="field-input" [(ngModel)]="formKas.kategori" name="kas-kat">
                @for (k of kategoriOptions; track k) {
                  <option [value]="k">{{ data.labelKategoriKas(k) }}</option>
                }
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="field-label">Uraian</label>
              <input class="field-input" [(ngModel)]="formKas.uraian" name="kas-ura" />
            </div>
            <div>
              <label class="field-label">Debet (masuk)</label>
              <input type="number" class="field-input" [(ngModel)]="formKas.debet" name="kas-deb" min="0" />
            </div>
            <div>
              <label class="field-label">Kredit (keluar)</label>
              <input type="number" class="field-input" [(ngModel)]="formKas.kredit" name="kas-kre" min="0" />
            </div>
          </div>
          <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanKas()">Simpan</button>

          <div class="overflow-x-auto pt-2">
            <table class="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50">
                  <th class="border border-slate-200 px-2 py-1.5 text-left">Tgl</th>
                  <th class="border border-slate-200 px-2 py-1.5 text-left">Uraian</th>
                  <th class="border border-slate-200 px-2 py-1.5 text-right">Debet</th>
                  <th class="border border-slate-200 px-2 py-1.5 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody>
                @for (k of bukuKas(); track k.id) {
                  <tr
                    [class.bg-amber-50]="k.kategori === 'IURAN_WARGA'"
                    [class.bg-emerald-50]="k.kategori === 'SETOR_RW'"
                  >
                    <td class="border border-slate-200 px-2 py-1 whitespace-nowrap">{{ k.tanggal }}</td>
                    <td class="border border-slate-200 px-2 py-1">
                      <p>{{ k.uraian }}</p>
                      <p class="text-[10px] text-slate-500">{{ data.labelKategoriKas(k.kategori) }}</p>
                    </td>
                    <td class="border border-slate-200 px-2 py-1 text-right font-semibold text-emerald-800">
                      {{ k.debet ? data.formatRp(k.debet) : '—' }}
                    </td>
                    <td class="border border-slate-200 px-2 py-1 text-right font-semibold text-rose-700">
                      {{ k.kredit ? data.formatRp(k.kredit) : '—' }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="border border-slate-200 px-3 py-6 text-center text-slate-500">
                      Belum ada transaksi.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
})
export class KasRtComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  readonly BULAN_LABEL = BULAN_LABEL;

  readonly tab = signal<TabKas>('IURAN');
  readonly tahun = signal(2026);
  readonly bulanFokus = signal(new Date().getMonth() + 1);
  readonly q = signal('');
  readonly bulanOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly kategoriOptions: KategoriKasRt[] = [
    'IURAN_WARGA',
    'SETOR_RW',
    'SAMPAH',
    'BANTUAN_SAKIT',
    'OPERASIONAL',
    'DONASI',
    'LAINNYA',
  ];

  formKas = {
    tanggal: new Date().toISOString().slice(0, 10),
    uraian: '',
    kategori: 'IURAN_WARGA' as KategoriKasRt,
    debet: 0,
    kredit: 0,
  };

  readonly rtId = computed(() => {
    const u = this.auth.currentUser();
    if (u?.rtId) return u.rtId;
    return 'rt-1';
  });

  readonly labelWilayah = computed(() => this.data.labelWilayah(this.rtId()));

  readonly ringkas = computed(() => this.data.ringkasKasRt(this.rtId()));

  readonly iuranBulan = computed(() =>
    this.data.ringkasIuranBulan(this.rtId(), this.tahun(), this.bulanFokus()),
  );

  readonly wargaIuran = computed(() => {
    const needle = this.q().trim().toLowerCase();
    const rtId = this.rtId();
    let list = this.data
      .wargaIuranScoped(this.auth.currentUser())
      .filter((w) => w.rtId === rtId)
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    if (!needle) return list;
    return list.filter((w) => {
      const hay = [w.nama, w.nik, w.noKk, w.alamat].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(needle);
    });
  });

  readonly bukuKas = computed(() => this.data.kasTransaksiScoped(this.rtId()));

  labelTglPendek(iso: string): string {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return '✓';
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  tandaiBayar(wargaId: string, bulan: number): void {
    const u = this.auth.currentUser();
    this.data.setIuranBayar({
      rtId: this.rtId(),
      wargaTerdataId: wargaId,
      tahun: this.tahun(),
      bulan,
      tanggalBayar: new Date().toISOString().slice(0, 10),
      dicatatOleh: u?.name || 'Bendahara RT',
    });
  }

  hapusIuran(id: string): void {
    this.data.hapusIuran(id);
  }

  simpanKas(): void {
    const u = this.auth.currentUser();
    const row = this.data.addKasTransaksi({
      rtId: this.rtId(),
      tanggal: this.formKas.tanggal,
      uraian: this.formKas.uraian,
      kategori: this.formKas.kategori,
      debet: Number(this.formKas.debet) || 0,
      kredit: Number(this.formKas.kredit) || 0,
      dicatatOleh: u?.name || 'Bendahara RT',
    });
    if (row) {
      this.formKas = {
        tanggal: new Date().toISOString().slice(0, 10),
        uraian: '',
        kategori: 'IURAN_WARGA',
        debet: 0,
        kredit: 0,
      };
    }
  }
}
