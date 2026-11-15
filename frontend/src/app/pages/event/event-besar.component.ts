import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { EventBesar, StatusChecklistItem, StatusEventBesar } from '../../core/models';

@Component({
  selector: 'app-event-besar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="page-title">Checklist Event Besar</h1>
        <p class="mt-1 text-sm font-semibold text-blue-700">17-an, Ramadan, pencoblosan — tugas per orang</p>
        <p class="page-sub">Lurah pantau mana yang belum selesai sebelum hari-H.</p>
      </header>

      <section class="card !p-5">
        <h2 class="text-lg font-bold text-slate-900">Buat event</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="field-label" for="ev-nama">Nama event</label>
            <input id="ev-nama" class="field-input" [(ngModel)]="form.nama" placeholder="Persiapan 17 Agustus" />
          </div>
          <div>
            <label class="field-label" for="ev-tgl">Tanggal</label>
            <input id="ev-tgl" type="date" class="field-input" [(ngModel)]="form.tanggal" />
          </div>
          <div>
            <label class="field-label" for="ev-lok">Lokasi</label>
            <input id="ev-lok" class="field-input" [(ngModel)]="form.lokasi" />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label" for="ev-desk">Deskripsi</label>
            <input id="ev-desk" class="field-input" [(ngModel)]="form.deskripsi" />
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button type="button" class="btn-primary" (click)="buatEvent()">Simpan event</button>
        </div>
      </section>

      <section class="space-y-4">
        @for (ev of data.eventBesarsSorted(); track ev.id) {
          <article class="card !p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="badgeEv(ev.status)">
                  {{ data.labelStatusEvent(ev.status) }}
                </span>
                <h3 class="mt-2 text-lg font-bold text-slate-900">{{ ev.nama }}</h3>
                <p class="text-sm text-slate-600">{{ ev.tanggal }} · {{ ev.lokasi }}</p>
                @if (ev.deskripsi) {
                  <p class="mt-1 text-sm text-slate-500">{{ ev.deskripsi }}</p>
                }
              </div>
              <div class="flex flex-wrap gap-2">
                @if (ev.status === 'PERSIAPAN') {
                  <button type="button" class="btn-secondary !py-1.5 text-xs" (click)="setEv(ev, 'BERLANGSUNG')">
                    Mulai
                  </button>
                }
                @if (ev.status === 'PERSIAPAN' || ev.status === 'BERLANGSUNG') {
                  <button type="button" class="btn-primary !py-1.5 text-xs" (click)="setEv(ev, 'SELESAI')">
                    Selesai
                  </button>
                }
              </div>
            </div>

            <p class="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Checklist · {{ doneCount(ev) }}/{{ ev.checklist.length }} selesai
            </p>
            <ul class="mt-2 space-y-2">
              @for (c of ev.checklist; track c.id) {
                <li class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
                  <div>
                    <p class="text-sm font-semibold text-slate-900">{{ c.judul }}</p>
                    <p class="text-xs text-slate-500">
                      PIC {{ c.picNama }}
                      @if (c.tenggatAt) {
                        · tenggat {{ c.tenggatAt }}
                      }
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <button
                      type="button"
                      class="rounded-lg px-2 py-1 text-[11px] font-bold"
                      [class]="c.status === 'TODO' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'"
                      (click)="setItem(ev.id, c.id, 'TODO')"
                    >
                      Belum
                    </button>
                    <button
                      type="button"
                      class="rounded-lg px-2 py-1 text-[11px] font-bold"
                      [class]="c.status === 'PROGRESS' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'"
                      (click)="setItem(ev.id, c.id, 'PROGRESS')"
                    >
                      Proses
                    </button>
                    <button
                      type="button"
                      class="rounded-lg px-2 py-1 text-[11px] font-bold"
                      [class]="c.status === 'DONE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'"
                      (click)="setItem(ev.id, c.id, 'DONE')"
                    >
                      Selesai
                    </button>
                  </div>
                </li>
              } @empty {
                <li class="text-sm text-slate-500">Belum ada tugas.</li>
              }
            </ul>

            @if (ev.status === 'PERSIAPAN' || ev.status === 'BERLANGSUNG') {
              <div class="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-4">
                <input
                  class="field-input sm:col-span-2"
                  placeholder="Tugas baru"
                  [ngModel]="draft()[ev.id]?.judul || ''"
                  (ngModelChange)="patchDraft(ev.id, 'judul', $event)"
                />
                <input
                  class="field-input"
                  placeholder="PIC"
                  [ngModel]="draft()[ev.id]?.picNama || ''"
                  (ngModelChange)="patchDraft(ev.id, 'picNama', $event)"
                />
                <button type="button" class="btn-secondary !py-2 text-sm" (click)="tambahItem(ev.id)">
                  + Tugas
                </button>
              </div>
            }
          </article>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            Belum ada event.
          </p>
        }
      </section>
    </div>
  `,
})
export class EventBesarComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  readonly draft = signal<Record<string, { judul: string; picNama: string }>>({});

  form = {
    nama: '',
    tanggal: new Date().toISOString().slice(0, 10),
    lokasi: 'Aula Lt. 2 Kelurahan Rawajati',
    deskripsi: '',
  };

  badgeEv(s: StatusEventBesar): string {
    const map: Record<StatusEventBesar, string> = {
      PERSIAPAN: 'bg-sky-100 text-sky-800',
      BERLANGSUNG: 'bg-amber-100 text-amber-900',
      SELESAI: 'bg-emerald-100 text-emerald-800',
      DIBATALKAN: 'bg-slate-200 text-slate-600',
    };
    return map[s];
  }

  doneCount(ev: EventBesar): number {
    return ev.checklist.filter((c) => c.status === 'DONE').length;
  }

  buatEvent(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const row = this.data.addEventBesar({ ...this.form, dibuatOleh: user.name });
    if (!row) return;
    this.form = {
      nama: '',
      tanggal: new Date().toISOString().slice(0, 10),
      lokasi: 'Aula Lt. 2 Kelurahan Rawajati',
      deskripsi: '',
    };
  }

  patchDraft(eventId: string, key: 'judul' | 'picNama', value: string): void {
    this.draft.update((m) => ({
      ...m,
      [eventId]: { judul: m[eventId]?.judul || '', picNama: m[eventId]?.picNama || '', [key]: value },
    }));
  }

  tambahItem(eventId: string): void {
    const d = this.draft()[eventId] || { judul: '', picNama: '' };
    this.data.addChecklistItem(eventId, d);
    this.draft.update((m) => ({ ...m, [eventId]: { judul: '', picNama: '' } }));
  }

  setItem(eventId: string, itemId: string, status: StatusChecklistItem): void {
    this.data.updateChecklistStatus(eventId, itemId, status);
  }

  setEv(ev: EventBesar, status: StatusEventBesar): void {
    this.data.updateStatusEvent(ev.id, status);
  }
}
