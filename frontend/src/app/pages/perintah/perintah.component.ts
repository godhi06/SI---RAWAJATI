import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { PerintahLurah, PrioritasPerintah, StatusPerintahLurah } from '../../core/models';

type FilterPerintah = 'SEMUA' | 'AKTIF' | 'INBOX' | 'SELESAI';

@Component({
  selector: 'app-perintah',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Perintah &amp; Tindak Lanjut</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            Arahan Lurah → ditugaskan → dikerjakan → selesai
          </p>
          <p class="page-sub">
            @if (bisaBuat()) {
              Buat arahan, tugaskan ke Kasi / Ketua RW / PPSU, pantau status sampai selesai.
            } @else {
              Inbox tugas untuk Anda. Terima → kerjakan → tandai selesai.
            }
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">
            {{ data.perintahAktifCount() }} aktif
          </span>
          @if (inboxSaya() > 0) {
            <span class="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800">
              {{ inboxSaya() }} di inbox Anda
            </span>
          }
        </div>
      </header>

      @if (bisaBuat()) {
        <section class="card !p-5">
          <h2 class="text-lg font-bold text-slate-900">Buat perintah baru</h2>
          <p class="mt-1 text-sm text-slate-500">
            Contoh: cek saluran darurat, follow-up zona jentik, siapkan bahan rapat.
          </p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="field-label" for="pr-judul">Judul</label>
              <input
                id="pr-judul"
                class="field-input"
                [(ngModel)]="form.judul"
                placeholder="Contoh: Cek saluran Rawajati Timur sebelum hujan"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="field-label" for="pr-isi">Isi arahan</label>
              <textarea
                id="pr-isi"
                class="field-input min-h-[5rem]"
                [(ngModel)]="form.isi"
                placeholder="Jelaskan apa yang harus dikerjakan dan hasil yang diharapkan"
              ></textarea>
            </div>
            <div>
              <label class="field-label" for="pr-penerima">Ditugaskan ke</label>
              <select id="pr-penerima" class="field-input" [(ngModel)]="form.penerimaKey">
                <option value="">— Pilih penerima —</option>
                @for (opt of data.opsiPenerimaPerintah(); track opt.key) {
                  <option [value]="opt.key">{{ opt.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="field-label" for="pr-tenggat">Tenggat</label>
              <input id="pr-tenggat" class="field-input" type="date" [(ngModel)]="form.tenggatAt" />
            </div>
            <div>
              <label class="field-label" for="pr-prio">Prioritas</label>
              <select id="pr-prio" class="field-input" [(ngModel)]="form.prioritas">
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button type="button" class="btn-primary" (click)="kirim()">Kirim perintah</button>
          </div>
        </section>
      }

      <div class="flex flex-wrap gap-2">
        @for (f of filters; track f.id) {
          <button
            type="button"
            class="rounded-xl border-2 px-3 py-1.5 text-sm font-bold"
            [class]="filter() === f.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'"
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
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    [class]="badgeStatus(row.status)"
                  >
                    {{ data.labelStatusPerintah(row.status) }}
                  </span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    [class]="
                      row.prioritas === 'URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    "
                  >
                    {{ data.labelPrioritasPerintah(row.prioritas) }}
                  </span>
                </div>
                <h3 class="mt-2 text-base font-bold text-slate-900">{{ row.judul }}</h3>
                <p class="mt-1 whitespace-pre-line text-sm text-slate-600">{{ row.isi }}</p>
                <p class="mt-2 text-xs text-slate-500">
                  Dari <strong>{{ row.dibuatOlehNama }}</strong> → {{ row.penerimaLabel }}
                </p>
                <p class="mt-0.5 text-xs text-slate-500">
                  Tenggat {{ row.tenggatAt }}
                  @if (terlambat(row)) {
                    <span class="font-bold text-rose-600"> · terlambat</span>
                  }
                </p>
                @if (row.catatanTindakLanjut) {
                  <p class="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    Catatan: {{ row.catatanTindakLanjut }}
                  </p>
                }
              </div>
            </div>

            @if (bisaAksi(row)) {
              <div class="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                @if (row.status === 'BARU' || row.status === 'DITERIMA' || row.status === 'DIKERJAKAN') {
                  <div class="min-w-[12rem] flex-1">
                    <label class="field-label" [for]="'cat-' + row.id">Catatan tindak lanjut</label>
                    <input
                      [id]="'cat-' + row.id"
                      class="field-input"
                      [ngModel]="catatanDraft()[row.id] || ''"
                      (ngModelChange)="setCatatan(row.id, $event)"
                      placeholder="Opsional"
                    />
                  </div>
                }
                @if (row.status === 'BARU') {
                  <button type="button" class="btn-primary !py-2 text-sm" (click)="setStatus(row, 'DITERIMA')">
                    Terima
                  </button>
                }
                @if (row.status === 'DITERIMA') {
                  <button type="button" class="btn-primary !py-2 text-sm" (click)="setStatus(row, 'DIKERJAKAN')">
                    Mulai kerjakan
                  </button>
                }
                @if (row.status === 'DIKERJAKAN') {
                  <button type="button" class="btn-primary !py-2 text-sm" (click)="setStatus(row, 'SELESAI')">
                    Tandai selesai
                  </button>
                }
                @if (bisaBuat() && row.status !== 'SELESAI' && row.status !== 'DIBATALKAN') {
                  <button
                    type="button"
                    class="btn-secondary !py-2 text-sm text-rose-700"
                    (click)="setStatus(row, 'DIBATALKAN')"
                  >
                    Batalkan
                  </button>
                }
              </div>
            }
          </article>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            Belum ada perintah di filter ini.
          </p>
        }
      </section>
    </div>
  `,
})
export class PerintahComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly filter = signal<FilterPerintah>('AKTIF');
  readonly catatanDraft = signal<Record<string, string>>({});

  readonly filters: Array<{ id: FilterPerintah; label: string }> = [
    { id: 'INBOX', label: 'Inbox saya' },
    { id: 'AKTIF', label: 'Aktif' },
    { id: 'SELESAI', label: 'Selesai' },
    { id: 'SEMUA', label: 'Semua' },
  ];

  form = {
    judul: '',
    isi: '',
    penerimaKey: '',
    tenggatAt: new Date().toISOString().slice(0, 10),
    prioritas: 'NORMAL' as PrioritasPerintah,
  };

  readonly bisaBuat = computed(() => this.auth.hasRole('ADMIN_KEL'));

  readonly inboxSaya = computed(() => this.data.perintahInboxCount(this.auth.currentUser()));

  readonly daftar = computed(() => {
    const user = this.auth.currentUser();
    let list = this.data.perintahUntukUser(user);
    const f = this.filter();
    if (f === 'INBOX') {
      list = list.filter((p) => this.adalahPenerima(p) && p.status !== 'SELESAI' && p.status !== 'DIBATALKAN');
    } else if (f === 'AKTIF') {
      list = list.filter((p) => p.status === 'BARU' || p.status === 'DITERIMA' || p.status === 'DIKERJAKAN');
    } else if (f === 'SELESAI') {
      list = list.filter((p) => p.status === 'SELESAI' || p.status === 'DIBATALKAN');
    }
    return list;
  });

  badgeStatus(s: StatusPerintahLurah): string {
    const map: Record<StatusPerintahLurah, string> = {
      BARU: 'bg-sky-100 text-sky-800',
      DITERIMA: 'bg-indigo-100 text-indigo-800',
      DIKERJAKAN: 'bg-amber-100 text-amber-900',
      SELESAI: 'bg-emerald-100 text-emerald-800',
      DIBATALKAN: 'bg-slate-200 text-slate-600',
    };
    return map[s];
  }

  terlambat(row: PerintahLurah): boolean {
    if (row.status === 'SELESAI' || row.status === 'DIBATALKAN') return false;
    const today = new Date().toISOString().slice(0, 10);
    return row.tenggatAt < today;
  }

  adalahPenerima(row: PerintahLurah): boolean {
    const u = this.auth.currentUser();
    if (!u) return false;
    if (row.penerimaJenis === 'STAF' || row.penerimaJenis === 'PPSU') {
      return row.penerimaUserId === u.id;
    }
    if (row.penerimaJenis === 'RW') {
      return u.role === 'KOORD_RW' && row.penerimaRwId === u.rwId;
    }
    return false;
  }

  bisaAksi(row: PerintahLurah): boolean {
    if (row.status === 'SELESAI' || row.status === 'DIBATALKAN') {
      return this.bisaBuat() && row.status !== 'SELESAI';
    }
    return this.adalahPenerima(row) || this.bisaBuat();
  }

  setCatatan(id: string, value: string): void {
    this.catatanDraft.update((m) => ({ ...m, [id]: value }));
  }

  kirim(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const row = this.data.addPerintahLurah({
      ...this.form,
      dibuatOlehUserId: user.id,
      dibuatOlehNama: user.name,
    });
    if (!row) return;
    this.form = {
      judul: '',
      isi: '',
      penerimaKey: '',
      tenggatAt: new Date().toISOString().slice(0, 10),
      prioritas: 'NORMAL',
    };
    this.filter.set('AKTIF');
  }

  setStatus(row: PerintahLurah, status: StatusPerintahLurah): void {
    const cat = this.catatanDraft()[row.id];
    this.data.updateStatusPerintah(row.id, status, cat);
  }
}
