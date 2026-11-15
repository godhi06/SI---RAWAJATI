import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { KategoriKasRw } from '../../core/models';

type TabKasRw = 'SETORAN' | 'BUKU';

const BULAN_LABEL = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Kas RW: matriks setoran per RT + buku kas + cetak BOD. */
@Component({
  selector: 'app-kas-rw',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Kas RW</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            {{ labelRw() }} — setoran per RT + buku kas RW
          </p>
          <p class="page-sub">
            Tandai RT mana yang sudah setor. Cetak rekap bulanan untuk grup BOD (mirip share Kas RT).
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a routerLink="/app/rekap-warga-rw" class="btn-secondary !py-2 !px-3 text-sm">Rekap warga</a>
          <a
            class="btn-primary !py-2 !px-3 text-sm"
            [routerLink]="['/app/kas-rw/cetak']"
            [queryParams]="{ tahun: tahun(), bulan: bulanFokus() }"
          >
            Cetak / Share BOD
          </a>
        </div>
      </header>

      @if (ringkas(); as r) {
        <section class="grid gap-3 sm:grid-cols-3">
          <article class="card !p-4">
            <p class="text-xs font-bold uppercase text-slate-500">Saldo kas RW</p>
            <p class="mt-1 text-2xl font-extrabold text-emerald-700">{{ data.formatRp(r.saldo) }}</p>
          </article>
          <article class="card !p-4">
            <p class="text-xs font-bold uppercase text-slate-500">Masuk (debet)</p>
            <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ data.formatRp(r.debet) }}</p>
          </article>
          <article class="card !p-4">
            <p class="text-xs font-bold uppercase text-slate-500">
              Setoran {{ BULAN_LABEL[bulanFokus()] }} {{ tahun() }}
            </p>
            <p class="mt-1 text-2xl font-extrabold text-blue-800">
              {{ setoranBulan().lunas }}/{{ setoranBulan().total }}
            </p>
            <p class="text-xs text-slate-500">RT sudah setor · {{ data.formatRp(setoranBulan().nominal) }}</p>
          </article>
        </section>
      }

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-xl border-2 px-4 py-2 text-sm font-bold"
          [class]="tab() === 'SETORAN' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200'"
          (click)="tab.set('SETORAN')"
        >
          Matriks setoran RT
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

      @if (tab() === 'SETORAN') {
        <section class="card space-y-3 !p-4">
          <div class="flex flex-wrap items-end gap-3">
            <div>
              <label class="field-label" for="thn-setor">Tahun</label>
              <select id="thn-setor" class="field-input" [ngModel]="tahun()" (ngModelChange)="tahun.set(+$event)">
                <option [value]="2025">2025</option>
                <option [value]="2026">2026</option>
                <option [value]="2027">2027</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="bln-setor">Fokus bulan (rekap)</label>
              <select
                id="bln-setor"
                class="field-input"
                [ngModel]="bulanFokus()"
                (ngModelChange)="bulanFokus.set(+$event)"
              >
                @for (b of bulanOptions; track b) {
                  <option [value]="b">{{ BULAN_LABEL[b] }}</option>
                }
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[44rem] border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50">
                  <th class="border border-slate-200 px-2 py-1.5 text-left">RT</th>
                  <th class="border border-slate-200 px-2 py-1.5 text-left">Ketua</th>
                  @for (b of bulanOptions; track b) {
                    <th class="border border-slate-200 px-1 py-1.5 text-center">{{ BULAN_LABEL[b] }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (rt of daftarRt(); track rt.id) {
                  <tr>
                    <td class="border border-slate-200 px-2 py-1 font-bold">RT {{ rt.nomor }}</td>
                    <td class="border border-slate-200 px-2 py-1 text-slate-600">{{ rt.namaKetua }}</td>
                    @for (b of bulanOptions; track b) {
                      <td class="border border-slate-200 px-0.5 py-0.5 text-center align-middle">
                        @if (data.getSetoranRtKeRw(rwId(), rt.id, tahun(), b); as s) {
                          <button
                            type="button"
                            class="w-full rounded bg-emerald-50 px-0.5 py-1 font-semibold text-emerald-800 hover:bg-rose-50 hover:text-rose-700"
                            title="Klik untuk hapus"
                            (click)="hapusSetoran(s.id)"
                          >
                            {{ labelTglPendek(s.tanggalBayar) }}
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="w-full rounded px-0.5 py-1 text-slate-300 hover:bg-blue-50 hover:text-blue-700"
                            title="Tandai sudah setor"
                            (click)="tandaiSetor(rt.id, b)"
                          >
                            ·
                          </button>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-slate-500">
            Klik sel kosong = tandai RT sudah setor (default Rp200.000) · klik tanggal hijau = hapus. Catatan per RT.
          </p>
        </section>
      }

      @if (tab() === 'BUKU') {
        <section class="card space-y-3 !p-4">
          <p class="text-sm font-bold text-slate-800">Catat transaksi kas RW</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="field-label">Tanggal</label>
              <input type="date" class="field-input" [(ngModel)]="form.tanggal" name="krw-tgl" />
            </div>
            <div>
              <label class="field-label">Kategori</label>
              <select class="field-input" [(ngModel)]="form.kategori" name="krw-kat">
                @for (k of kategoriOptions; track k) {
                  <option [value]="k">{{ data.labelKategoriKasRw(k) }}</option>
                }
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="field-label">Uraian</label>
              <input
                class="field-input"
                [(ngModel)]="form.uraian"
                name="krw-ura"
                placeholder="Mis. Santunan meninggal keluarga … RT 00x"
              />
            </div>
            <div>
              <label class="field-label">Debet (masuk)</label>
              <input type="number" class="field-input" [(ngModel)]="form.debet" name="krw-deb" min="0" />
            </div>
            <div>
              <label class="field-label">Kredit (keluar)</label>
              <input type="number" class="field-input" [(ngModel)]="form.kredit" name="krw-kre" min="0" />
            </div>
          </div>
          <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpan()">Simpan</button>

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
                @for (k of buku(); track k.id) {
                  <tr
                    [class.bg-amber-50]="k.kategori === 'SETOR_RT'"
                    [class.bg-rose-50]="k.kategori === 'SANTUNAN_MENINGGAL'"
                  >
                    <td class="border border-slate-200 px-2 py-1 whitespace-nowrap">{{ k.tanggal }}</td>
                    <td class="border border-slate-200 px-2 py-1">
                      <p>{{ k.uraian }}</p>
                      <p class="text-[10px] text-slate-500">{{ data.labelKategoriKasRw(k.kategori) }}</p>
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
export class KasRwComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  readonly BULAN_LABEL = BULAN_LABEL;

  readonly tab = signal<TabKasRw>('SETORAN');
  readonly tahun = signal(2026);
  readonly bulanFokus = signal(new Date().getMonth() + 1);
  readonly bulanOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  readonly kategoriOptions: KategoriKasRw[] = [
    'SETOR_RT',
    'IURAN_RW',
    'SANTUNAN_MENINGGAL',
    'BANTUAN_SAKIT',
    'OPERASIONAL',
    'DONASI',
    'LAINNYA',
  ];

  form = {
    tanggal: new Date().toISOString().slice(0, 10),
    uraian: '',
    kategori: 'SANTUNAN_MENINGGAL' as KategoriKasRw,
    debet: 0,
    kredit: 0,
  };

  readonly rwId = computed(() => this.auth.currentUser()?.rwId || 'rw-7');
  readonly labelRw = computed(() => {
    const rw = this.data.getRw(this.rwId());
    return rw ? this.data.labelRw(rw.nomor) : 'RW';
  });
  readonly ringkas = computed(() => this.data.ringkasKasRw(this.rwId()));
  readonly buku = computed(() => this.data.kasTransaksiRwScoped(this.rwId()));
  readonly daftarRt = computed(() =>
    this.data
      .rts()
      .filter((r) => r.rwId === this.rwId())
      .sort((a, b) => a.nomor.localeCompare(b.nomor, 'id')),
  );
  readonly setoranBulan = computed(() =>
    this.data.ringkasSetoranRtBulan(this.rwId(), this.tahun(), this.bulanFokus()),
  );

  labelTglPendek(iso: string): string {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return '✓';
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  tandaiSetor(rtId: string, bulan: number): void {
    const u = this.auth.currentUser();
    this.data.setSetoranRtBayar({
      rwId: this.rwId(),
      rtId,
      tahun: this.tahun(),
      bulan,
      tanggalBayar: new Date().toISOString().slice(0, 10),
      dicatatOleh: u?.name || 'Bendahara RW',
    });
  }

  hapusSetoran(id: string): void {
    this.data.hapusSetoranRt(id);
  }

  simpan(): void {
    const u = this.auth.currentUser();
    const row = this.data.addKasTransaksiRw({
      rwId: this.rwId(),
      tanggal: this.form.tanggal,
      uraian: this.form.uraian,
      kategori: this.form.kategori,
      debet: Number(this.form.debet) || 0,
      kredit: Number(this.form.kredit) || 0,
      dicatatOleh: u?.name || 'Bendahara RW',
    });
    if (row) {
      this.form = {
        tanggal: new Date().toISOString().slice(0, 10),
        uraian: '',
        kategori: 'SANTUNAN_MENINGGAL',
        debet: 0,
        kredit: 0,
      };
    }
  }
}
