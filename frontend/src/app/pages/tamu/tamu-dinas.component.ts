import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { TujuanKunjungan } from '../../core/models';

@Component({
  selector: 'app-tamu-dinas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Buku Tamu Dinas</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">Kunjungan ke kelurahan — siapa datang & dampingan</p>
          <p class="page-sub">Ganti buku tulis / Excel. Berguna untuk monitoring Lurah & arsip kunjungan.</p>
        </div>
        <span class="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800">
          {{ data.tamuDinasHariIniCount() }} hari ini
        </span>
      </header>

      <section class="card !p-5">
        <h2 class="text-lg font-bold text-slate-900">Catat kunjungan</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label class="field-label" for="td-nama">Nama tamu</label>
            <input id="td-nama" class="field-input" [(ngModel)]="form.namaTamu" />
          </div>
          <div>
            <label class="field-label" for="td-instansi">Instansi</label>
            <input id="td-instansi" class="field-input" [(ngModel)]="form.instansi" />
          </div>
          <div>
            <label class="field-label" for="td-jabatan">Jabatan (opsional)</label>
            <input id="td-jabatan" class="field-input" [(ngModel)]="form.jabatan" />
          </div>
          <div>
            <label class="field-label" for="td-tujuan">Tujuan</label>
            <select id="td-tujuan" class="field-input" [(ngModel)]="form.tujuan">
              @for (t of tujuanOptions; track t.id) {
                <option [value]="t.id">{{ t.label }}</option>
              }
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="field-label" for="td-kep">Keperluan</label>
            <input id="td-kep" class="field-input" [(ngModel)]="form.keperluan" />
          </div>
          <div>
            <label class="field-label" for="td-tgl">Tanggal</label>
            <input id="td-tgl" type="date" class="field-input" [(ngModel)]="form.tanggal" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="field-label" for="td-jam">Jam datang</label>
              <input id="td-jam" type="time" class="field-input" [(ngModel)]="form.jamDatang" />
            </div>
            <div>
              <label class="field-label" for="td-pulang">Jam pulang</label>
              <input id="td-pulang" type="time" class="field-input" [(ngModel)]="form.jamPulang" />
            </div>
          </div>
          <div>
            <label class="field-label" for="td-damp">Didampingi oleh</label>
            <select id="td-damp" class="field-input" [(ngModel)]="form.didampingiUserId">
              <option value="">— Pilih / ketik manual di bawah —</option>
              @for (s of data.opsiStafDisposisi(); track s.userId) {
                <option [value]="s.userId">{{ s.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label" for="td-damp-nama">Nama pendamping (jika manual)</label>
            <input id="td-damp-nama" class="field-input" [(ngModel)]="form.didampingiOleh" />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label" for="td-cat">Catatan</label>
            <input id="td-cat" class="field-input" [(ngModel)]="form.catatan" />
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button type="button" class="btn-primary" (click)="simpan()">Simpan tamu</button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-bold text-slate-900">Riwayat ({{ data.tamuDinasSorted().length }})</h2>
        @for (row of data.tamuDinasSorted(); track row.id) {
          <article class="card !p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {{ data.labelTujuanKunjungan(row.tujuan) }}
                </span>
                <h3 class="mt-2 text-base font-bold text-slate-900">{{ row.namaTamu }}</h3>
                <p class="text-sm text-slate-600">
                  {{ row.instansi }}
                  @if (row.jabatan) {
                    · {{ row.jabatan }}
                  }
                </p>
                <p class="mt-1 text-sm text-slate-700">{{ row.keperluan }}</p>
                <p class="mt-2 text-xs text-slate-500">
                  {{ row.tanggal }} · {{ row.jamDatang }}
                  @if (row.jamPulang) {
                    – {{ row.jamPulang }}
                  }
                  · dampingan {{ row.didampingiOleh }}
                </p>
                @if (row.catatan) {
                  <p class="mt-1 text-xs text-slate-500">{{ row.catatan }}</p>
                }
              </div>
            </div>
          </article>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            Belum ada kunjungan tercatat.
          </p>
        }
      </section>
    </div>
  `,
})
export class TamuDinasComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly tujuanOptions: Array<{ id: TujuanKunjungan; label: string }> = [
    { id: 'KOORDINASI', label: 'Koordinasi' },
    { id: 'MONITORING', label: 'Monitoring' },
    { id: 'SOSIALISASI', label: 'Sosialisasi' },
    { id: 'LAYANAN', label: 'Layanan' },
    { id: 'LAIN', label: 'Lainnya' },
  ];

  form = {
    namaTamu: '',
    instansi: '',
    jabatan: '',
    tujuan: 'KOORDINASI' as TujuanKunjungan,
    keperluan: '',
    tanggal: new Date().toISOString().slice(0, 10),
    jamDatang: '09:00',
    jamPulang: '',
    didampingiUserId: '',
    didampingiOleh: '',
    catatan: '',
  };

  readonly hariIni = computed(() => this.data.tamuDinasHariIniCount());

  simpan(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const staf = this.data.opsiStafDisposisi().find((s) => s.userId === this.form.didampingiUserId);
    const dampNama = staf?.label.split(' · ')[0] || this.form.didampingiOleh || user.name;
    const row = this.data.addTamuDinas({
      ...this.form,
      didampingiOleh: dampNama,
      didampingiUserId: this.form.didampingiUserId || undefined,
      dicatatOleh: user.name,
    });
    if (!row) return;
    this.form = {
      namaTamu: '',
      instansi: '',
      jabatan: '',
      tujuan: 'KOORDINASI',
      keperluan: '',
      tanggal: new Date().toISOString().slice(0, 10),
      jamDatang: '09:00',
      jamPulang: '',
      didampingiUserId: '',
      didampingiOleh: '',
      catatan: '',
    };
  }
}
