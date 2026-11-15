import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import {
  KategoriPengaduan,
  PengaduanWilayah,
  PrioritasPengaduan,
  StatusPengaduan,
} from '../../core/models';

type FilterPg = 'TERBUKA' | 'BARU' | 'SELESAI' | 'SEMUA';

@Component({
  selector: 'app-pengaduan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Aduan RW / Lapangan</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            Masalah warga via RW (genangan, PJU, sampah) — bukan surat dinas
          </p>
          <p class="page-sub">
            @if (auth.hasRole('ADMIN_KEL')) {
              Lurah/Kasi tugaskan ke Kasi/PPSU. Beda dari menu Surat Masuk Dinas.
            } @else if (auth.hasRole('KOORD_RW')) {
              Catat aduan warga wilayah Anda; pantau sampai selesai.
            } @else {
              Kerjakan aduan lapangan yang ditugaskan ke Anda.
            }
          </p>
        </div>
        <span class="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">
          {{ data.pengaduanTerbukaCount() }} terbuka
        </span>
      </header>

      @if (bisaLapor()) {
        <section class="card !p-5">
          <h2 class="text-lg font-bold text-slate-900">Catat pengaduan baru</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="field-label" for="pg-judul">Judul</label>
              <input
                id="pg-judul"
                class="field-input"
                [(ngModel)]="form.judul"
                placeholder="Contoh: Genangan air di Rawajati Timur"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="field-label" for="pg-isi">Uraian</label>
              <textarea
                id="pg-isi"
                class="field-input min-h-[4.5rem]"
                [(ngModel)]="form.isi"
                placeholder="Lokasi, dampak, permintaan warga"
              ></textarea>
            </div>
            <div>
              <label class="field-label" for="pg-kat">Kategori</label>
              <select id="pg-kat" class="field-input" [(ngModel)]="form.kategori">
                @for (k of kategoriOptions; track k.id) {
                  <option [value]="k.id">{{ k.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="field-label" for="pg-prio">Prioritas</label>
              <select id="pg-prio" class="field-input" [(ngModel)]="form.prioritas">
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="field-label" for="pg-lok">Lokasi (opsional)</label>
              <input id="pg-lok" class="field-input" [(ngModel)]="form.lokasi" placeholder="Jalan / patokan" />
            </div>
            @if (auth.hasRole('ADMIN_KEL')) {
              <div>
                <label class="field-label" for="pg-rw">RW pelapor</label>
                <select id="pg-rw" class="field-input" [(ngModel)]="form.rwId">
                  <option value="">— Pilih RW —</option>
                  @for (rw of data.rws(); track rw.id) {
                    <option [value]="rw.id">
                      {{ data.labelRw(rw.nomor) }} · {{ rw.namaKetua }}
                    </option>
                  }
                </select>
              </div>
            }
          </div>
          <div class="mt-4 flex justify-end">
            <button type="button" class="btn-primary" (click)="kirim()">Kirim pengaduan</button>
          </div>
        </section>
      }

      <div class="flex flex-wrap gap-2">
        @for (f of filters; track f.id) {
          <button
            type="button"
            class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
            [class]="
              filter() === f.id
                ? 'border-blue-600 bg-blue-50 text-blue-800'
                : 'border-slate-200 bg-white text-slate-600'
            "
            (click)="filter.set(f.id)"
          >
            {{ f.label }}
          </button>
        }
      </div>

      <section class="space-y-3">
        @for (row of daftar(); track row.id) {
          <article
            class="card !p-4"
            [class.ring-2]="row.prioritas === 'URGENT' && row.status !== 'SELESAI'"
            [class.ring-amber-300]="row.prioritas === 'URGENT' && row.status !== 'SELESAI'"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="badgeStatus(row.status)">
                {{ data.labelStatusPengaduan(row.status) }}
              </span>
              <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                {{ data.labelKategoriPengaduan(row.kategori) }}
              </span>
              @if (row.prioritas === 'URGENT') {
                <span class="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">Urgent</span>
              }
            </div>
            <h3 class="mt-2 text-base font-bold text-slate-900">{{ row.judul }}</h3>
            <p class="mt-1 whitespace-pre-line text-sm text-slate-600">{{ row.isi }}</p>
            <p class="mt-2 text-xs text-slate-500">
              {{ row.pelaporNama }}
              · {{ rwLabel(row.rwId) }}
              @if (row.lokasi) {
                · {{ row.lokasi }}
              }
            </p>
            @if (row.disposisiLabel) {
              <p class="mt-1 text-xs text-slate-500">Disposisi → {{ row.disposisiLabel }}</p>
            }
            @if (row.catatanDisposisi) {
              <p class="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-700">
                Arahan: {{ row.catatanDisposisi }}
              </p>
            }
            @if (row.catatanSelesai) {
              <p class="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-slate-700">
                Selesai: {{ row.catatanSelesai }}
              </p>
            }

            @if (auth.hasRole('ADMIN_KEL') && row.status === 'BARU') {
              <div class="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                <div class="min-w-[12rem] flex-1">
                  <label class="field-label" [for]="'disp-' + row.id">Disposisi ke</label>
                  <select
                    [id]="'disp-' + row.id"
                    class="field-input"
                    [ngModel]="disposisiKey()[row.id] || ''"
                    (ngModelChange)="setDisposisiKey(row.id, $event)"
                  >
                    <option value="">— Pilih —</option>
                    @for (opt of data.opsiPenerimaPerintah(); track opt.key) {
                      <option [value]="opt.key">{{ opt.label }}</option>
                    }
                  </select>
                </div>
                <div class="min-w-[10rem] flex-1">
                  <label class="field-label" [for]="'catd-' + row.id">Catatan arahan</label>
                  <input
                    [id]="'catd-' + row.id"
                    class="field-input"
                    [ngModel]="catatan()[row.id] || ''"
                    (ngModelChange)="setCatatan(row.id, $event)"
                  />
                </div>
                <button type="button" class="btn-primary !py-2 text-sm" (click)="disposisi(row)">
                  Disposisi
                </button>
                <button
                  type="button"
                  class="btn-secondary !py-2 text-sm text-rose-700"
                  (click)="setStatus(row, 'DITOLAK')"
                >
                  Tolak
                </button>
              </div>
            }

            @if (bisaProses(row)) {
              <div class="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                <div class="min-w-[12rem] flex-1">
                  <label class="field-label" [for]="'cats-' + row.id">Catatan</label>
                  <input
                    [id]="'cats-' + row.id"
                    class="field-input"
                    [ngModel]="catatan()[row.id] || ''"
                    (ngModelChange)="setCatatan(row.id, $event)"
                    placeholder="Opsional"
                  />
                </div>
                @if (row.status === 'DIDISPOSISI') {
                  <button type="button" class="btn-primary !py-2 text-sm" (click)="setStatus(row, 'DIPROSES')">
                    Mulai proses
                  </button>
                }
                @if (row.status === 'DIPROSES' || row.status === 'DIDISPOSISI') {
                  <button type="button" class="btn-primary !py-2 text-sm" (click)="setStatus(row, 'SELESAI')">
                    Tandai selesai
                  </button>
                }
              </div>
            }
          </article>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            Belum ada pengaduan di filter ini.
          </p>
        }
      </section>
    </div>
  `,
})
export class PengaduanComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly filter = signal<FilterPg>('TERBUKA');
  readonly catatan = signal<Record<string, string>>({});
  readonly disposisiKey = signal<Record<string, string>>({});

  readonly filters: Array<{ id: FilterPg; label: string }> = [
    { id: 'BARU', label: 'Belum disposisi' },
    { id: 'TERBUKA', label: 'Terbuka' },
    { id: 'SELESAI', label: 'Selesai' },
    { id: 'SEMUA', label: 'Semua' },
  ];

  readonly kategoriOptions: Array<{ id: KategoriPengaduan; label: string }> = [
    { id: 'SALURAN', label: 'Saluran / genangan' },
    { id: 'KEBERSIHAN', label: 'Kebersihan' },
    { id: 'PENERANGAN', label: 'Penerangan / PJU' },
    { id: 'KEAMANAN', label: 'Keamanan' },
    { id: 'ADMINISTRASI', label: 'Administrasi' },
    { id: 'LAIN', label: 'Lainnya' },
  ];

  form = {
    judul: '',
    isi: '',
    kategori: 'SALURAN' as KategoriPengaduan,
    prioritas: 'NORMAL' as PrioritasPengaduan,
    lokasi: '',
    rwId: '',
  };

  readonly bisaLapor = computed(
    () => this.auth.hasRole('ADMIN_KEL') || this.auth.hasRole('KOORD_RW'),
  );

  readonly daftar = computed(() => {
    let list = this.data.pengaduanUntukUser(this.auth.currentUser());
    const f = this.filter();
    if (f === 'BARU') list = list.filter((p) => p.status === 'BARU');
    else if (f === 'TERBUKA') {
      list = list.filter(
        (p) => p.status === 'BARU' || p.status === 'DIDISPOSISI' || p.status === 'DIPROSES',
      );
    } else if (f === 'SELESAI') {
      list = list.filter((p) => p.status === 'SELESAI' || p.status === 'DITOLAK');
    }
    return list;
  });

  rwLabel(rwId: string): string {
    const rw = this.data.getRw(rwId);
    return rw ? this.data.labelRw(rw.nomor) : 'RW';
  }

  badgeStatus(s: StatusPengaduan): string {
    const map: Record<StatusPengaduan, string> = {
      BARU: 'bg-sky-100 text-sky-800',
      DIDISPOSISI: 'bg-indigo-100 text-indigo-800',
      DIPROSES: 'bg-amber-100 text-amber-900',
      SELESAI: 'bg-emerald-100 text-emerald-800',
      DITOLAK: 'bg-slate-200 text-slate-600',
    };
    return map[s];
  }

  bisaProses(row: PengaduanWilayah): boolean {
    if (row.status !== 'DIDISPOSISI' && row.status !== 'DIPROSES') return false;
    const u = this.auth.currentUser();
    if (!u) return false;
    if (this.auth.hasRole('ADMIN_KEL')) return true;
    if (row.disposisiJenis === 'PPSU') return row.disposisiUserId === u.id;
    if (row.disposisiJenis === 'RW') {
      return u.role === 'KOORD_RW' && row.disposisiRwId === u.rwId;
    }
    if (row.disposisiJenis === 'STAF') return row.disposisiUserId === u.id;
    return false;
  }

  setCatatan(id: string, v: string): void {
    this.catatan.update((m) => ({ ...m, [id]: v }));
  }

  setDisposisiKey(id: string, v: string): void {
    this.disposisiKey.update((m) => ({ ...m, [id]: v }));
  }

  kirim(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const rwId = this.auth.hasRole('KOORD_RW') ? user.rwId || '' : this.form.rwId;
    const row = this.data.addPengaduan({
      ...this.form,
      rwId,
      pelaporNama: user.name,
      pelaporUserId: user.id,
    });
    if (!row) return;
    this.form = {
      judul: '',
      isi: '',
      kategori: 'SALURAN',
      prioritas: 'NORMAL',
      lokasi: '',
      rwId: '',
    };
    this.filter.set('TERBUKA');
  }

  disposisi(row: PengaduanWilayah): void {
    this.data.disposisiPengaduan(row.id, this.disposisiKey()[row.id] || '', this.catatan()[row.id]);
  }

  setStatus(row: PengaduanWilayah, status: StatusPengaduan): void {
    this.data.updateStatusPengaduan(row.id, status, this.catatan()[row.id]);
  }
}
