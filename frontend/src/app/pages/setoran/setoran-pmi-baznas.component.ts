import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { JenisSetoranSosial, SumberSetoranSosial } from '../../core/models';

@Component({
  selector: 'app-setoran-pmi-baznas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Setoran PMI &amp; BAZNAS</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            Rekap map ↔ catatan — ganti Excel agar laporan ke PMI klop
          </p>
          <p class="page-sub">
            Catat setoran saat diterima. PMI nominal bebas; BAZNAS
            {{ data.formatRp(data.nominalWajibBaznas) }} + kupon.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a
            class="btn-secondary text-sm"
            [routerLink]="['/app/setoran-pmi-baznas/cetak']"
            [queryParams]="{ jenis: 'PMI', bulan: bulan(), tahun: tahun() }"
          >
            Cetak PDF PMI
          </a>
          <a
            class="btn-primary text-sm"
            [routerLink]="['/app/setoran-pmi-baznas/cetak']"
            [queryParams]="{ jenis: 'BAZNAS', bulan: bulan(), tahun: tahun() }"
          >
            Cetak PDF BAZNAS
          </a>
        </div>
      </header>

      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="field-label" for="bln">Bulan rekap</label>
          <select id="bln" class="field-input" [ngModel]="bulan()" (ngModelChange)="onPeriodeBulan(+$event)">
            @for (m of bulanOptions; track m.id) {
              <option [value]="m.id">{{ m.label }}</option>
            }
          </select>
        </div>
        <div>
          <label class="field-label" for="thn">Tahun</label>
          <select id="thn" class="field-input" [ngModel]="tahun()" (ngModelChange)="onPeriodeTahun(+$event)">
            @for (y of tahunOptions; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>
      </div>

      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article class="card">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Total catatan PMI</p>
          <p class="mt-2 text-2xl font-extrabold text-slate-900">{{ data.formatRp(totalPmi()) }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ hitungJenis('PMI') }} transaksi</p>
        </article>
        <article class="card">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Uang di map PMI</p>
          <p class="mt-2 text-2xl font-extrabold text-slate-900">{{ data.formatRp(uangMap()) }}</p>
          <p class="mt-1 text-xs text-slate-500">Dihitung fisik dari map</p>
        </article>
        <article class="card">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Status map vs catatan</p>
          <p
            class="mt-2 text-2xl font-extrabold"
            [class]="selisih() === 0 ? 'text-emerald-600' : 'text-amber-600'"
          >
            {{ selisih() === 0 ? 'Klop' : data.formatRp(selisih()) }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            {{ selisih() === 0 ? 'Siap dilanjutkan ke PMI' : 'Selisih map − catatan' }}
          </p>
        </article>
        <article class="card">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Total BAZNAS</p>
          <p class="mt-2 text-2xl font-extrabold text-slate-900">{{ data.formatRp(totalBaznas()) }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ hitungJenis('BAZNAS') }} kupon/setor</p>
        </article>
      </section>

      <section class="card !p-5">
        <h2 class="text-lg font-bold text-slate-900">Catat setoran masuk</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label class="field-label" for="jenis">Jenis</label>
            <select id="jenis" class="field-input" [(ngModel)]="form.jenis" (ngModelChange)="onJenisChange()">
              <option value="PMI">PMI</option>
              <option value="BAZNAS">BAZNAS ({{ data.formatRp(data.nominalWajibBaznas) }})</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="sumber">Sumber</label>
            <select id="sumber" class="field-input" [(ngModel)]="form.sumber">
              <option value="RT">Ketua RT</option>
              <option value="RW">Ketua RW</option>
              <option value="TAMU_LAYANAN">Tamu layanan</option>
            </select>
          </div>

          @if (form.sumber === 'RT') {
            <div class="sm:col-span-2">
              <label class="field-label" for="rt">Pilih RT</label>
              <select id="rt" class="field-input" [(ngModel)]="form.rtId" (ngModelChange)="onPilihRt($event)">
                <option value="">— pilih —</option>
                @for (rt of data.rts(); track rt.id) {
                  <option [value]="rt.id">{{ data.labelWilayah(rt.id) }} — {{ rt.namaKetua }}</option>
                }
              </select>
            </div>
          }
          @if (form.sumber === 'RW') {
            <div class="sm:col-span-2">
              <label class="field-label" for="rw">Pilih RW</label>
              <select id="rw" class="field-input" [(ngModel)]="form.rwId" (ngModelChange)="onPilihRw($event)">
                <option value="">— pilih —</option>
                @for (rw of data.rws(); track rw.id) {
                  <option [value]="rw.id">RW {{ rw.nomor }} — {{ rw.namaKetua }}</option>
                }
              </select>
            </div>
          }
          @if (form.sumber === 'TAMU_LAYANAN') {
            <div class="sm:col-span-2">
              <label class="field-label" for="nama-tamu">Nama tamu / keterangan</label>
              <input
                id="nama-tamu"
                class="field-input"
                [(ngModel)]="form.namaPenyetor"
                placeholder="Contoh: Tamu layanan — Bpk. Andi"
              />
            </div>
          }

          <div>
            <label class="field-label" for="nominal">Nominal (Rp)</label>
            <input
              id="nominal"
              class="field-input"
              type="number"
              min="0"
              [(ngModel)]="form.nominal"
              [disabled]="form.jenis === 'BAZNAS'"
            />
            @if (form.jenis === 'BAZNAS') {
              <p class="mt-1 text-xs text-slate-500">Otomatis {{ data.formatRp(data.nominalWajibBaznas) }}</p>
            }
          </div>
          <div>
            <label class="field-label" for="tgl">Tanggal setor</label>
            <input id="tgl" class="field-input" type="date" [(ngModel)]="form.tanggalSetor" />
          </div>

          @if (form.jenis === 'BAZNAS') {
            <div>
              <label class="field-label" for="kupon">Nomor kupon (opsional)</label>
              <input id="kupon" class="field-input" [(ngModel)]="form.nomorKupon" placeholder="BZ-…" />
            </div>
            <div class="flex items-end pb-2">
              <label class="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" [(ngModel)]="form.adaKupon" class="h-4 w-4" />
                Kupon sudah diberikan
              </label>
            </div>
          }

          <div class="sm:col-span-2">
            <label class="field-label" for="catatan">Catatan (opsional)</label>
            <input id="catatan" class="field-input" [(ngModel)]="form.catatan" placeholder="Setor bareng DAOP, dll." />
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button type="button" class="btn-primary" (click)="simpanSetoran()">Simpan catatan</button>
        </div>
      </section>

      <section class="card !p-5">
        <h2 class="text-lg font-bold text-slate-900">Cocokkan uang map PMI</h2>
        <p class="mt-1 text-sm text-slate-500">
          Isi total uang fisik di map periode ini, lalu bandingkan dengan total catatan PMI.
        </p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label class="field-label" for="map-rp">Total uang di map (Rp)</label>
            <input id="map-rp" class="field-input" type="number" min="0" [(ngModel)]="formMap.totalUangMap" />
          </div>
          <div>
            <label class="field-label" for="map-cat">Catatan hitung map</label>
            <input id="map-cat" class="field-input" [(ngModel)]="formMap.catatan" />
          </div>
        </div>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm text-slate-600">
            Catatan PMI: <strong>{{ data.formatRp(totalPmi()) }}</strong>
            · Map: <strong>{{ data.formatRp(+formMap.totalUangMap || 0) }}</strong>
          </p>
          <button type="button" class="btn-secondary" (click)="simpanMap()">Simpan hitung map</button>
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
            [class]="filterJenis() === 'SEMUA' ? tabOn : tabOff"
            (click)="filterJenis.set('SEMUA')"
          >
            Semua
          </button>
          <button
            type="button"
            class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
            [class]="filterJenis() === 'PMI' ? tabOn : tabOff"
            (click)="filterJenis.set('PMI')"
          >
            PMI
          </button>
          <button
            type="button"
            class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
            [class]="filterJenis() === 'BAZNAS' ? tabOn : tabOff"
            (click)="filterJenis.set('BAZNAS')"
          >
            BAZNAS
          </button>
        </div>

        @for (row of daftarFiltered(); track row.id) {
          <article class="card !p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {{ row.jenis }} · {{ data.labelSumberSetoran(row.sumber) }} · {{ row.tanggalSetor }}
                </p>
                <h3 class="mt-1 text-base font-bold text-slate-900">{{ row.namaPenyetor }}</h3>
                <p class="mt-1 text-lg font-extrabold text-blue-800">{{ data.formatRp(row.nominal) }}</p>
                @if (row.jenis === 'BAZNAS') {
                  <p class="mt-1 text-sm text-slate-600">
                    Kupon: {{ row.adaKupon ? 'ya' : 'belum' }}
                    @if (row.nomorKupon) {
                      · {{ row.nomorKupon }}
                    }
                  </p>
                }
                @if (row.catatan) {
                  <p class="mt-1 text-sm text-slate-500">{{ row.catatan }}</p>
                }
                <p class="mt-1 text-xs text-slate-400">Dicatat {{ row.dicatatOleh }}</p>
              </div>
              <button type="button" class="text-sm font-bold text-rose-600" (click)="hapus(row.id)">Hapus</button>
            </div>
          </article>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Belum ada catatan setoran periode ini.
          </p>
        }
      </section>
    </div>
  `,
})
export class SetoranPmiBaznasComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly bulan = signal(new Date().getMonth() + 1);
  readonly tahun = signal(new Date().getFullYear());
  readonly filterJenis = signal<'SEMUA' | JenisSetoranSosial>('SEMUA');

  readonly tabOn = 'border-blue-600 bg-blue-50 text-blue-800';
  readonly tabOff = 'border-slate-200 bg-white text-slate-600';

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

  form = {
    jenis: 'PMI' as JenisSetoranSosial,
    sumber: 'RT' as SumberSetoranSosial,
    namaPenyetor: '',
    rtId: '',
    rwId: '',
    nominal: 50_000,
    adaKupon: true,
    nomorKupon: '',
    tanggalSetor: new Date().toISOString().slice(0, 10),
    catatan: '',
  };

  formMap = {
    totalUangMap: 0,
    catatan: '',
  };

  constructor() {
    this.syncFormMap();
  }

  readonly totalPmi = computed(() => this.data.totalSetoranJenis(this.tahun(), this.bulan(), 'PMI'));
  readonly totalBaznas = computed(() => this.data.totalSetoranJenis(this.tahun(), this.bulan(), 'BAZNAS'));
  readonly uangMap = computed(() => this.data.getRekapMapPmi(this.tahun(), this.bulan())?.totalUangMap ?? 0);
  readonly selisih = computed(() => this.data.selisihMapPmi(this.tahun(), this.bulan()));

  readonly daftar = computed(() => this.data.setoranSosialPeriode(this.tahun(), this.bulan()));

  readonly daftarFiltered = computed(() => {
    const f = this.filterJenis();
    const list = this.daftar();
    return f === 'SEMUA' ? list : list.filter((s) => s.jenis === f);
  });

  hitungJenis(jenis: JenisSetoranSosial): number {
    return this.daftar().filter((s) => s.jenis === jenis).length;
  }

  onJenisChange(): void {
    if (this.form.jenis === 'BAZNAS') {
      this.form.nominal = this.data.nominalWajibBaznas;
      this.form.adaKupon = true;
    } else if (!this.form.nominal) {
      this.form.nominal = 50_000;
    }
  }

  onPilihRt(rtId: string): void {
    const rt = this.data.getRt(rtId);
    if (!rt) return;
    this.form.namaPenyetor = rt.namaKetua;
    this.form.rwId = rt.rwId;
  }

  onPilihRw(rwId: string): void {
    const rw = this.data.getRw(rwId);
    if (!rw) return;
    this.form.namaPenyetor = rw.namaKetua;
  }

  onPeriodeBulan(m: number): void {
    this.bulan.set(m);
    this.syncFormMap();
  }

  onPeriodeTahun(y: number): void {
    this.tahun.set(y);
    this.syncFormMap();
  }

  syncFormMap(): void {
    const r = this.data.getRekapMapPmi(this.tahun(), this.bulan());
    this.formMap.totalUangMap = r?.totalUangMap ?? this.data.totalSetoranJenis(this.tahun(), this.bulan(), 'PMI');
    this.formMap.catatan = r?.catatan ?? '';
  }

  simpanSetoran(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    if (this.form.sumber === 'RT' && !this.form.rtId) {
      this.data.showToast('Pilih RT dulu.');
      return;
    }
    if (this.form.sumber === 'RW' && !this.form.rwId) {
      this.data.showToast('Pilih RW dulu.');
      return;
    }
    const row = this.data.addSetoranSosial({
      jenis: this.form.jenis,
      sumber: this.form.sumber,
      namaPenyetor: this.form.namaPenyetor,
      rtId: this.form.sumber === 'RT' ? this.form.rtId : undefined,
      rwId: this.form.sumber === 'RW' ? this.form.rwId : this.form.sumber === 'RT' ? this.form.rwId : undefined,
      nominal: this.form.nominal,
      adaKupon: this.form.adaKupon,
      nomorKupon: this.form.nomorKupon,
      tanggalSetor: this.form.tanggalSetor,
      periodeTahun: this.tahun(),
      periodeBulan: this.bulan(),
      catatan: this.form.catatan,
      dicatatOleh: user.name,
    });
    if (!row) return;
    this.form.namaPenyetor = '';
    this.form.rtId = '';
    this.form.rwId = '';
    this.form.nomorKupon = '';
    this.form.catatan = '';
    if (this.form.jenis === 'PMI') this.form.nominal = 50_000;
  }

  simpanMap(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.data.simpanRekapMapPmi({
      tahun: this.tahun(),
      bulan: this.bulan(),
      totalUangMap: this.formMap.totalUangMap,
      updatedBy: user.name,
      catatan: this.formMap.catatan,
    });
  }

  hapus(id: string): void {
    this.data.hapusSetoranSosial(id);
  }
}
