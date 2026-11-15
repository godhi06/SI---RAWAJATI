import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-ppsu-saluran',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <header>
        <h1 class="page-title">Pengurasan Saluran Air</h1>
        <p class="page-sub">Jadwal dan log pelaksanaan PPSU.</p>
      </header>

      <form class="card grid gap-4 md:grid-cols-2" (ngSubmit)="tambah()">
        <div>
          <label class="field-label">Nama lokasi</label>
          <input class="field-input" [(ngModel)]="namaLokasi" name="namaLokasi" required />
        </div>
        <div>
          <label class="field-label">Tanggal rencana</label>
          <input type="date" class="field-input" [(ngModel)]="tanggal" name="tanggal" required />
        </div>
        <div class="md:col-span-2">
          <label class="field-label">Ruas saluran</label>
          <input class="field-input" [(ngModel)]="ruas" name="ruas" />
        </div>
        <div class="md:col-span-2">
          <label class="field-label">Petugas / tim</label>
          <input class="field-input" [(ngModel)]="petugas" name="petugas" />
        </div>
        <div class="md:col-span-2">
          <button class="btn-primary" type="submit">Tambah jadwal</button>
        </div>
      </form>

      <div class="grid gap-3">
        @for (k of data.kegiatanSalurans(); track k.id) {
          <article class="card">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span class="badge-muted">{{ k.statusKegiatan }}</span>
                <h2 class="mt-2 text-lg font-semibold">{{ k.namaLokasi }}</h2>
                <p class="text-ink-600">{{ k.ruasSaluran }}</p>
                <p class="mt-1 text-sm text-ink-500">
                  Rencana {{ k.tanggalRencana }}
                  @if (k.tanggalRealisasi) {
                    · Realisasi {{ k.tanggalRealisasi }}
                  }
                  · {{ k.petugas }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                @if (k.statusKegiatan === 'DIJADWALKAN') {
                  <button type="button" class="btn-secondary" (click)="data.updateKegiatanStatus(k.id, 'BERLANGSUNG')">
                    Mulai
                  </button>
                }
                @if (k.statusKegiatan === 'BERLANGSUNG' || k.statusKegiatan === 'DIJADWALKAN') {
                  <button
                    type="button"
                    class="btn-primary"
                    (click)="data.updateKegiatanStatus(k.id, 'SELESAI', today)"
                  >
                    Selesai
                  </button>
                }
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
})
export class PpsuSaluranComponent {
  readonly data = inject(DataService);
  readonly today = new Date().toISOString().slice(0, 10);

  namaLokasi = '';
  tanggal = this.today;
  ruas = '';
  petugas = 'Tim PPSU Rawajati A';

  tambah(): void {
    if (!this.namaLokasi || !this.tanggal) return;
    this.data.addKegiatan({
      namaLokasi: this.namaLokasi,
      ruasSaluran: this.ruas,
      tanggalRencana: this.tanggal,
      statusKegiatan: 'DIJADWALKAN',
      petugas: this.petugas,
    });
    this.namaLokasi = '';
    this.ruas = '';
  }
}
