import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import {
  KategoriWargaKhusus,
  StatusTinggalWarga,
  WargaPendatang,
  WargaTerdata,
} from '../../core/models';

type FilterKategori = KategoriWargaKhusus | 'SEMUA';

/** Buku data warga digital RT — cari + filter lansia/janda/bansos + edit NIK/KK. */
@Component({
  selector: 'app-data-warga',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Data List Warga</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            @if (auth.isDasawisma()) {
              Portal Dasawisma / PKK — bantu isi data, verifikasi oleh Ketua RT
            } @else if (auth.isKetuaRt()) {
              Daftar warga {{ wilayahLabel() }} — ganti fotokopi KK &amp; catatan manual
            } @else {
              Pantauan data warga wilayah — tetap / kos / kontrak
            }
          </p>
          <p class="page-sub">
            Edit data langsung ikut ke portal Ketua RT. Tambah warga baru dari Dasawisma perlu disahkan Ketua RT dulu.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a routerLink="/app/surat-keterangan" class="btn-secondary !py-2 !px-3 text-sm">Surat Keterangan</a>
          <span class="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
            {{ ringkas().tetap }} tetap
          </span>
          <span class="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800">
            {{ ringkas().kos }} kos/kontrak
          </span>
          @if (totalPending() > 0) {
            <span class="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">
              {{ totalPending() }} menunggu verifikasi
            </span>
          }
        </div>
      </header>

      <section class="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          class="card !p-4 text-left transition"
          [class.ring-2]="filterKat() === 'LANSIA'"
          [class.ring-amber-500]="filterKat() === 'LANSIA'"
          (click)="toggleFilter('LANSIA')"
        >
          <p class="text-xs font-bold uppercase text-amber-700">Lansia</p>
          <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ katRingkas().lansia }}</p>
          <p class="text-xs text-slate-500">Klik untuk filter</p>
        </button>
        <button
          type="button"
          class="card !p-4 text-left transition"
          [class.ring-2]="filterKat() === 'JANDA'"
          [class.ring-rose-500]="filterKat() === 'JANDA'"
          (click)="toggleFilter('JANDA')"
        >
          <p class="text-xs font-bold uppercase text-rose-700">Janda</p>
          <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ katRingkas().janda }}</p>
          <p class="text-xs text-slate-500">Klik untuk filter</p>
        </button>
        <button
          type="button"
          class="card !p-4 text-left transition"
          [class.ring-2]="filterKat() === 'PENERIMA_BANSOS'"
          [class.ring-blue-500]="filterKat() === 'PENERIMA_BANSOS'"
          (click)="toggleFilter('PENERIMA_BANSOS')"
        >
          <p class="text-xs font-bold uppercase text-blue-700">Penerima bansos</p>
          <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ katRingkas().bansos }}</p>
          <p class="text-xs text-slate-500">Siap sorting bantuan</p>
        </button>
      </section>

      <section class="card !p-4 space-y-3">
        <label class="field-label" for="cari-warga">Cari warga (nama / NIK / KK / program bansos)</label>
        <input
          id="cari-warga"
          class="field-input"
          [ngModel]="q()"
          (ngModelChange)="q.set($event)"
          placeholder="Contoh: Herlan · Latifah · PKH · BPNT…"
        />
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-xl border-2 px-3 py-1.5 text-xs font-bold"
            [class]="filterKat() === 'SEMUA' ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200'"
            (click)="filterKat.set('SEMUA')"
          >
            Semua
          </button>
          @for (k of kategoriOptions; track k) {
            <button
              type="button"
              class="rounded-xl border-2 px-3 py-1.5 text-xs font-bold"
              [class]="chipClass(k)"
              (click)="toggleFilter(k)"
            >
              {{ data.labelKategoriWarga(k) }}
            </button>
          }
        </div>
      </section>

      @if (pendingWarga().length && (auth.canVerifikasiWarga() || auth.isDasawisma() || auth.isStafKelurahan() || auth.hasRole('KOORD_RW'))) {
        <section class="space-y-3">
          <h2 class="text-base font-bold text-slate-900">Antrian warga baru (menunggu sah RT)</h2>
          @for (w of pendingWarga(); track w.id) {
            <article class="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4">
              <p class="font-bold text-slate-900">{{ w.nama }} · {{ w.nik }}</p>
              <p class="mt-1 text-sm text-slate-600">{{ w.alamat }}</p>
              <p class="mt-1 text-xs text-slate-500">
                Dicatat {{ w.dicatatOleh }} · {{ data.labelWilayah(w.rtId) }}
                @if (w.hubunganKk) {
                  · {{ w.hubunganKk }}
                }
              </p>
              @if (auth.canVerifikasiWarga()) {
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="sahWarga(w)">
                    Sahkan → buku warga
                  </button>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="tolakWarga(w)">
                    Tolak
                  </button>
                </div>
              } @else {
                <p class="mt-2 text-xs font-semibold text-amber-800">Menunggu pengesahan Ketua RT</p>
              }
            </article>
          }
        </section>
      }

      @if (pendingKos().length && (auth.canVerifikasiWarga() || auth.isDasawisma() || auth.isStafKelurahan() || auth.hasRole('KOORD_RW'))) {
        <section class="space-y-3">
          <h2 class="text-base font-bold text-slate-900">Antrian laporan kos (menunggu RT)</h2>
          @for (p of pendingKos(); track p.id) {
            <article class="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4">
              <p class="font-bold text-slate-900">{{ p.namaPenghuni }} · {{ p.nik }}</p>
              <p class="mt-1 text-sm text-slate-600">
                Kos {{ p.alamatKos }} · pemilik {{ p.namaPemilikKos }}
                @if (p.asalDaerah) {
                  · asal {{ p.asalDaerah }}
                }
              </p>
              <p class="mt-1 text-xs text-slate-500">
                Masuk {{ p.tanggalMasuk }} · foto {{ p.fotoKtpName }} · {{ data.labelWilayah(p.rtId) }}
              </p>
              @if (auth.canVerifikasiWarga()) {
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="terimaKos(p)">
                    Terima → buku warga
                  </button>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="tolakKos(p)">
                    Tolak
                  </button>
                </div>
              } @else {
                <p class="mt-2 text-xs font-semibold text-amber-800">Menunggu verifikasi Ketua RT</p>
              }
            </article>
          }
        </section>
      }

      @if (bisaInput()) {
        <section class="card space-y-3 !p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-base font-bold text-slate-900">
              {{ auth.isDasawisma() ? 'Ajukan warga baru (antrian RT)' : 'Catat warga baru' }}
            </h2>
            @if (!tambahOpen()) {
              <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="bukaTambah()">
                + {{ auth.isDasawisma() ? 'Ajukan warga' : 'Tambah warga' }}
              </button>
            }
          </div>
          @if (tambahOpen()) {
            <ng-container *ngTemplateOutlet="formWarga; context: { mode: 'tambah' }" />
          }
        </section>
      }

      <section class="space-y-3">
        <h2 class="text-base font-bold text-slate-900">
          Daftar warga ({{ daftar().length }})
          @if (filterKat() !== 'SEMUA') {
            <span class="text-sm font-semibold text-blue-700">
              · filter {{ data.labelKategoriWarga($any(filterKat())) }}
            </span>
          }
        </h2>
        @for (w of daftar(); track w.id) {
          <article class="rounded-xl border border-slate-200 bg-white p-4">
            @if (editId() === w.id) {
              <p class="mb-2 text-sm font-bold text-blue-800">Edit data — NIK / KK / kategori bantuan</p>
              <ng-container *ngTemplateOutlet="formWarga; context: { mode: 'edit' }" />
            } @else {
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-bold text-slate-900">{{ w.nama }}</p>
                    <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="badgeTinggal(w.statusTinggal)">
                      {{ data.labelStatusTinggal(w.statusTinggal) }}
                    </span>
                    @if (w.statusVerifikasi === 'PENDING') {
                      <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                        Menunggu RT
                      </span>
                    }
                    @for (k of w.kategoriKhusus || []; track k) {
                      <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="badgeKategori(k)">
                        {{ data.labelKategoriWarga(k) }}
                      </span>
                    }
                  </div>
                  <p class="mt-1 font-mono text-xs text-slate-600">NIK {{ w.nik }}</p>
                  @if (w.noKk) {
                    <p class="font-mono text-xs text-slate-500">KK {{ w.noKk }}</p>
                  }
                  <p class="mt-1 text-sm text-slate-600">{{ w.alamat }}</p>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ data.labelWilayah(w.rtId) }}
                    @if (w.hubunganKk) {
                      · {{ w.hubunganKk }}
                    }
                    @if (w.pekerjaan) {
                      · {{ w.pekerjaan }}
                    }
                    @if (w.programBansos) {
                      · program {{ w.programBansos }}
                    }
                  </p>
                </div>
                <div class="flex flex-wrap gap-2 shrink-0">
                  @if (bisaInput()) {
                    <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="mulaiEdit(w)">
                      Edit
                    </button>
                  }
                  <a
                    class="btn-primary !py-2 !px-3 text-sm"
                    [routerLink]="['/app/surat-keterangan']"
                    [queryParams]="{ highlight: w.id }"
                  >
                    Buat SK
                  </a>
                </div>
              </div>
            }
          </article>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            @if (q().trim() || filterKat() !== 'SEMUA') {
              Tidak ada warga yang cocok dengan filter / pencarian ini.
            } @else {
              Belum ada data warga.
            }
          </p>
        }
      </section>
    </div>

    <ng-template #formWarga let-mode="mode">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="field-label">Nama lengkap</label>
          <input class="field-input" [(ngModel)]="form.nama" [name]="'wt-nama-' + mode" />
        </div>
        <div>
          <label class="field-label">NIK</label>
          <input class="field-input" [(ngModel)]="form.nik" [name]="'wt-nik-' + mode" inputmode="numeric" />
        </div>
        <div>
          <label class="field-label">No. KK</label>
          <input class="field-input" [(ngModel)]="form.noKk" [name]="'wt-kk-' + mode" inputmode="numeric" />
        </div>
        <div>
          <label class="field-label">Status tinggal</label>
          <select class="field-input" [(ngModel)]="form.statusTinggal" [name]="'wt-status-' + mode">
            <option value="TETAP">Warga tetap</option>
            <option value="KOS">Kos</option>
            <option value="KONTRAK">Kontrak</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="field-label">Alamat di RT</label>
          <input class="field-input" [(ngModel)]="form.alamat" [name]="'wt-alamat-' + mode" />
        </div>
        <div>
          <label class="field-label">Hubungan KK</label>
          <input
            class="field-input"
            [(ngModel)]="form.hubunganKk"
            [name]="'wt-hub-' + mode"
            placeholder="Kepala Keluarga / Istri / …"
          />
        </div>
        <div>
          <label class="field-label">Pekerjaan</label>
          <input class="field-input" [(ngModel)]="form.pekerjaan" [name]="'wt-kerja-' + mode" />
        </div>
        <div>
          <label class="field-label">Jenis kelamin</label>
          <select class="field-input" [(ngModel)]="form.jenisKelamin" [name]="'wt-jk-' + mode">
            <option value="">—</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <div>
          <label class="field-label">Asal daerah (kos/kontrak)</label>
          <input class="field-input" [(ngModel)]="form.asalDaerah" [name]="'wt-asal-' + mode" />
        </div>
        <div class="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p class="field-label mb-2">Kategori khusus (untuk sorting bantuan)</p>
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input type="checkbox" [(ngModel)]="form.isLansia" [name]="'wt-lansia-' + mode" />
              Lansia
            </label>
            <label class="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input type="checkbox" [(ngModel)]="form.isJanda" [name]="'wt-janda-' + mode" />
              Janda
            </label>
            <label class="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input type="checkbox" [(ngModel)]="form.isBansos" [name]="'wt-bansos-' + mode" />
              Penerima bansos
            </label>
          </div>
          @if (form.isBansos) {
            <div class="mt-3">
              <label class="field-label">Program bansos / bantuan</label>
              <input
                class="field-input"
                [(ngModel)]="form.programBansos"
                [name]="'wt-prog-' + mode"
                placeholder="PKH · BPNT · BST · CSR swasta · bansos kelurahan…"
              />
            </div>
          }
        </div>
        <div class="sm:col-span-2">
          <label class="field-label">Nama file arsip KK / KTP (demo)</label>
          <input
            class="field-input"
            [(ngModel)]="form.fotoKkName"
            [name]="'wt-foto-' + mode"
            placeholder="KK-Nama.jpg / KTP-Nama.jpg"
          />
        </div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        @if (mode === 'edit') {
          <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanEdit()">Simpan perubahan</button>
          <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
        } @else {
          <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpan()">Simpan</button>
          <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalTambah()">Batal</button>
        }
      </div>
    </ng-template>
  `,
})
export class DataWargaComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly q = signal('');
  readonly filterKat = signal<FilterKategori>('SEMUA');
  readonly tambahOpen = signal(false);
  readonly editId = signal<string | null>(null);
  readonly kategoriOptions: KategoriWargaKhusus[] = ['LANSIA', 'JANDA', 'PENERIMA_BANSOS'];

  form = this.emptyForm();

  readonly wilayahLabel = computed(() => {
    const u = this.auth.currentUser();
    if (u?.rtId) return this.data.labelWilayah(u.rtId);
    if (u?.rwId) {
      const rw = this.data.getRw(u.rwId);
      return rw ? this.data.labelRw(rw.nomor) : 'wilayah RW';
    }
    return this.data.kelurahan.nama;
  });

  readonly daftar = computed(() =>
    this.data.cariWargaTerdata(this.auth.currentUser(), this.q(), this.filterKat()),
  );

  readonly pendingKos = computed(() => this.data.wargaPendatangPendingScoped(this.auth.currentUser()));
  readonly pendingWarga = computed(() => this.data.wargaTerdataPendingScoped(this.auth.currentUser()));
  readonly totalPending = computed(() => this.pendingKos().length + this.pendingWarga().length);

  readonly ringkas = computed(() => {
    const list = this.data
      .wargaTerdataScoped(this.auth.currentUser())
      .filter((w) => w.statusVerifikasi === 'DITERIMA');
    return {
      tetap: list.filter((w) => w.statusTinggal === 'TETAP').length,
      kos: list.filter((w) => w.statusTinggal === 'KOS' || w.statusTinggal === 'KONTRAK').length,
    };
  });

  readonly katRingkas = computed(() => this.data.ringkasKategoriWarga(this.auth.currentUser()));

  bisaInput(): boolean {
    return this.auth.isKetuaRt() || this.auth.isDasawisma() || this.auth.isStafKelurahan();
  }

  toggleFilter(k: KategoriWargaKhusus): void {
    this.filterKat.update((cur) => (cur === k ? 'SEMUA' : k));
  }

  chipClass(k: KategoriWargaKhusus): string {
    const on = this.filterKat() === k;
    if (k === 'LANSIA') return on ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-slate-200';
    if (k === 'JANDA') return on ? 'border-rose-600 bg-rose-50 text-rose-900' : 'border-slate-200';
    return on ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200';
  }

  badgeTinggal(s: StatusTinggalWarga): string {
    if (s === 'TETAP') return 'bg-emerald-100 text-emerald-800';
    if (s === 'KOS') return 'bg-sky-100 text-sky-800';
    return 'bg-violet-100 text-violet-800';
  }

  badgeKategori(k: KategoriWargaKhusus): string {
    if (k === 'LANSIA') return 'bg-amber-100 text-amber-900';
    if (k === 'JANDA') return 'bg-rose-100 text-rose-900';
    return 'bg-blue-100 text-blue-900';
  }

  emptyForm() {
    return {
      nama: '',
      nik: '',
      noKk: '',
      statusTinggal: 'TETAP' as StatusTinggalWarga,
      alamat: '',
      hubunganKk: '',
      pekerjaan: '',
      jenisKelamin: '' as '' | 'L' | 'P',
      asalDaerah: '',
      fotoKkName: '',
      isLansia: false,
      isJanda: false,
      isBansos: false,
      programBansos: '',
    };
  }

  kategoriFromForm(): KategoriWargaKhusus[] {
    const tags: KategoriWargaKhusus[] = [];
    if (this.form.isLansia) tags.push('LANSIA');
    if (this.form.isJanda) tags.push('JANDA');
    if (this.form.isBansos) tags.push('PENERIMA_BANSOS');
    return tags;
  }

  bukaTambah(): void {
    this.batalEdit();
    this.form = this.emptyForm();
    this.tambahOpen.set(true);
  }

  batalTambah(): void {
    this.tambahOpen.set(false);
    this.form = this.emptyForm();
  }

  mulaiEdit(w: WargaTerdata): void {
    this.tambahOpen.set(false);
    this.editId.set(w.id);
    this.form = {
      nama: w.nama,
      nik: w.nik,
      noKk: w.noKk || '',
      statusTinggal: w.statusTinggal,
      alamat: w.alamat,
      hubunganKk: w.hubunganKk || '',
      pekerjaan: w.pekerjaan || '',
      jenisKelamin: w.jenisKelamin || '',
      asalDaerah: w.asalDaerah || '',
      fotoKkName: w.fotoKkName || w.fotoKtpName || '',
      isLansia: this.data.wargaPunyaKategori(w, 'LANSIA'),
      isJanda: this.data.wargaPunyaKategori(w, 'JANDA'),
      isBansos: this.data.wargaPunyaKategori(w, 'PENERIMA_BANSOS'),
      programBansos: w.programBansos || '',
    };
  }

  batalEdit(): void {
    this.editId.set(null);
    this.form = this.emptyForm();
  }

  simpan(): void {
    const u = this.auth.currentUser();
    const rtId = u?.rtId || this.data.rts().find((r) => r.id === 'rt-1')?.id || '';
    if (!rtId) return;
    const kategoriKhusus = this.kategoriFromForm();
    /** Dasawisma: antrian RT. Ketua RT / staf: langsung sah. */
    const perluSahRt = this.auth.isDasawisma();
    const row = this.data.addWargaTerdata({
      rtId,
      nama: this.form.nama,
      nik: this.form.nik,
      noKk: this.form.noKk || undefined,
      statusTinggal: this.form.statusTinggal,
      alamat: this.form.alamat,
      hubunganKk: this.form.hubunganKk.trim() || undefined,
      pekerjaan: this.form.pekerjaan.trim() || undefined,
      jenisKelamin: this.form.jenisKelamin || undefined,
      asalDaerah: this.form.asalDaerah.trim() || undefined,
      fotoKkName: this.form.fotoKkName.trim() || undefined,
      kategoriKhusus: kategoriKhusus.length ? kategoriKhusus : undefined,
      programBansos: this.form.isBansos ? this.form.programBansos.trim() || undefined : undefined,
      statusVerifikasi: perluSahRt ? 'PENDING' : 'DITERIMA',
      dicatatOleh: u?.name || 'Petugas',
    });
    if (row) this.batalTambah();
  }

  simpanEdit(): void {
    const id = this.editId();
    if (!id) return;
    const kategoriKhusus = this.kategoriFromForm();
    const ok = this.data.updateWargaTerdata(id, {
      nama: this.form.nama,
      nik: this.form.nik,
      noKk: this.form.noKk || undefined,
      statusTinggal: this.form.statusTinggal,
      alamat: this.form.alamat,
      hubunganKk: this.form.hubunganKk.trim() || undefined,
      pekerjaan: this.form.pekerjaan.trim() || undefined,
      jenisKelamin: this.form.jenisKelamin || undefined,
      asalDaerah: this.form.asalDaerah.trim() || undefined,
      fotoKkName: this.form.fotoKkName.trim() || undefined,
      kategoriKhusus,
      programBansos: this.form.isBansos ? this.form.programBansos.trim() || undefined : undefined,
    });
    if (ok) this.batalEdit();
  }

  terimaKos(p: WargaPendatang): void {
    const u = this.auth.currentUser();
    if (!u) return;
    this.data.verifikasiWarga(p.id, 'DITERIMA', u.id, u.name);
  }

  tolakKos(p: WargaPendatang): void {
    const u = this.auth.currentUser();
    if (!u) return;
    this.data.verifikasiWarga(p.id, 'DITOLAK', u.id, u.name, 'Data kurang lengkap / tidak sesuai');
  }

  sahWarga(w: WargaTerdata): void {
    const u = this.auth.currentUser();
    if (!u) return;
    this.data.verifikasiWargaTerdata(w.id, 'DITERIMA', u.name);
  }

  tolakWarga(w: WargaTerdata): void {
    const u = this.auth.currentUser();
    if (!u) return;
    this.data.verifikasiWargaTerdata(w.id, 'DITOLAK', u.name, 'Data kurang lengkap / tidak sesuai');
  }
}
