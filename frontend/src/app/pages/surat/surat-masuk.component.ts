import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { StatusSuratMasuk, SuratMasuk } from '../../core/models';

type FilterSm = 'TERBUKA' | 'BARU' | 'SELESAI' | 'SEMUA';

@Component({
  selector: 'app-surat-masuk',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Surat Masuk Dinas</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            Surat resmi dari Camat / Dinas / instansi — bukan aduan RW
          </p>
          <p class="page-sub">Catat agenda surat → tugaskan ke Kasi → selesai / arsip.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a routerLink="/app/surat-masuk/register" class="btn-secondary !py-2 !px-3 text-sm">
            Cetak Register PDF
          </a>
          <span class="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">
            {{ data.suratMasukTerbukaCount() }} terbuka
          </span>
        </div>
      </header>

      <section class="card !p-5">
        <h2 class="text-lg font-bold text-slate-900">Catat surat masuk</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label class="field-label" for="sm-asal">Asal surat</label>
            <input id="sm-asal" class="field-input" [(ngModel)]="form.asal" placeholder="Camat / Dinas / …" />
          </div>
          <div>
            <label class="field-label" for="sm-no">No. surat asal (opsional)</label>
            <input id="sm-no" class="field-input" [(ngModel)]="form.nomorSuratAsal" />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label" for="sm-perihal">Perihal</label>
            <input id="sm-perihal" class="field-input" [(ngModel)]="form.perihal" />
          </div>
          <div>
            <label class="field-label" for="sm-ts">Tanggal surat</label>
            <input id="sm-ts" type="date" class="field-input" [(ngModel)]="form.tanggalSurat" />
          </div>
          <div>
            <label class="field-label" for="sm-tt">Tanggal terima</label>
            <input id="sm-tt" type="date" class="field-input" [(ngModel)]="form.tanggalTerima" />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label" for="sm-ringkas">Ringkasan (opsional)</label>
            <textarea id="sm-ringkas" class="field-input min-h-[3.5rem]" [(ngModel)]="form.ringkasan"></textarea>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button type="button" class="btn-primary" (click)="simpan()">Catat surat</button>
        </div>
      </section>

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
          <article class="card !p-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="badge(row.status)">
                {{ data.labelStatusSuratMasuk(row.status) }}
              </span>
              <span class="font-mono text-xs font-bold text-blue-800">{{ row.nomorAgenda }}</span>
            </div>
            <h3 class="mt-2 text-base font-bold text-slate-900">{{ row.perihal }}</h3>
            <p class="mt-1 text-sm text-slate-600">
              Dari {{ row.asal }}
              @if (row.nomorSuratAsal) {
                · {{ row.nomorSuratAsal }}
              }
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Surat {{ row.tanggalSurat }} · terima {{ row.tanggalTerima }} · oleh {{ row.dicatatOleh }}
            </p>
            @if (row.ringkasan) {
              <p class="mt-2 text-sm text-slate-600">{{ row.ringkasan }}</p>
            }
            @if (row.disposisiLabel) {
              <p class="mt-2 text-xs text-slate-500">Disposisi → {{ row.disposisiLabel }}</p>
            }
            @if (row.catatanDisposisi) {
              <p class="mt-1 rounded-lg bg-blue-50 px-3 py-2 text-sm">Arahan: {{ row.catatanDisposisi }}</p>
            }
            @if (row.catatanSelesai) {
              <p class="mt-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm">Selesai: {{ row.catatanSelesai }}</p>
            }

            @if (row.status === 'BARU') {
              <div class="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                <div class="min-w-[12rem] flex-1">
                  <label class="field-label">Disposisi ke</label>
                  <select
                    class="field-input"
                    [ngModel]="disp()[row.id] || ''"
                    (ngModelChange)="setDisp(row.id, $event)"
                  >
                    <option value="">— Pilih staf —</option>
                    @for (s of data.opsiStafDisposisi(); track s.userId) {
                      <option [value]="s.userId">{{ s.label }}</option>
                    }
                  </select>
                </div>
                <div class="min-w-[10rem] flex-1">
                  <label class="field-label">Catatan</label>
                  <input
                    class="field-input"
                    [ngModel]="cat()[row.id] || ''"
                    (ngModelChange)="setCat(row.id, $event)"
                  />
                </div>
                <button type="button" class="btn-primary !py-2 text-sm" (click)="disposisi(row)">Disposisi</button>
              </div>
            }

            @if (row.status === 'DIDISPOSISI' || row.status === 'DIPROSES') {
              <div class="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                @if (row.status === 'DIDISPOSISI') {
                  <button type="button" class="btn-secondary !py-2 text-sm" (click)="setStatus(row, 'DIPROSES')">
                    Mulai proses
                  </button>
                }
                <button type="button" class="btn-primary !py-2 text-sm" (click)="setStatus(row, 'SELESAI')">
                  Tandai selesai
                </button>
              </div>
            }
          </article>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            Belum ada surat di filter ini.
          </p>
        }
      </section>
    </div>
  `,
})
export class SuratMasukComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  readonly filter = signal<FilterSm>('TERBUKA');
  readonly cat = signal<Record<string, string>>({});
  readonly disp = signal<Record<string, string>>({});

  readonly filters: Array<{ id: FilterSm; label: string }> = [
    { id: 'BARU', label: 'Belum disposisi' },
    { id: 'TERBUKA', label: 'Terbuka' },
    { id: 'SELESAI', label: 'Selesai' },
    { id: 'SEMUA', label: 'Semua' },
  ];

  form = {
    asal: '',
    nomorSuratAsal: '',
    perihal: '',
    tanggalSurat: new Date().toISOString().slice(0, 10),
    tanggalTerima: new Date().toISOString().slice(0, 10),
    ringkasan: '',
  };

  readonly daftar = computed(() => {
    let list = this.data.suratMasuksSorted();
    const f = this.filter();
    if (f === 'BARU') list = list.filter((s) => s.status === 'BARU');
    else if (f === 'TERBUKA') {
      list = list.filter(
        (s) => s.status === 'BARU' || s.status === 'DIDISPOSISI' || s.status === 'DIPROSES',
      );
    } else if (f === 'SELESAI') {
      list = list.filter((s) => s.status === 'SELESAI' || s.status === 'DIARSIPKAN');
    }
    return list;
  });

  badge(s: StatusSuratMasuk): string {
    const map: Record<StatusSuratMasuk, string> = {
      BARU: 'bg-sky-100 text-sky-800',
      DIDISPOSISI: 'bg-indigo-100 text-indigo-800',
      DIPROSES: 'bg-amber-100 text-amber-900',
      SELESAI: 'bg-emerald-100 text-emerald-800',
      DIARSIPKAN: 'bg-slate-200 text-slate-600',
    };
    return map[s];
  }

  setCat(id: string, v: string): void {
    this.cat.update((m) => ({ ...m, [id]: v }));
  }
  setDisp(id: string, v: string): void {
    this.disp.update((m) => ({ ...m, [id]: v }));
  }

  simpan(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const row = this.data.addSuratMasuk({ ...this.form, dicatatOleh: user.name });
    if (!row) return;
    this.form = {
      asal: '',
      nomorSuratAsal: '',
      perihal: '',
      tanggalSurat: new Date().toISOString().slice(0, 10),
      tanggalTerima: new Date().toISOString().slice(0, 10),
      ringkasan: '',
    };
  }

  disposisi(row: SuratMasuk): void {
    this.data.disposisiSuratMasuk(row.id, this.disp()[row.id] || '', this.cat()[row.id]);
  }

  setStatus(row: SuratMasuk, status: StatusSuratMasuk): void {
    this.data.updateStatusSuratMasuk(row.id, status, this.cat()[row.id]);
  }
}
