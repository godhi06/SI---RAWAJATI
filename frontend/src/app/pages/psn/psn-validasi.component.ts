import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-psn-validasi',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5">
      <header>
        <h1 class="page-title">Validasi Rekap PSN</h1>
        <p class="page-sub">
          Untuk Koordinator RW: tinjau laporan kader. Angka ABJ sudah terhitung saat kader kirim;
          tombol Setujui menandai laporan sudah dicek RW.
        </p>
      </header>

      <div class="grid gap-4">
        @for (row of antrian(); track row.id) {
          <article class="card">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-ink-500">{{ data.labelWilayah(row.rtId) }}</p>
                <h2 class="text-xl font-semibold text-ink-950">
                  {{ row.tanggalPemeriksaan }} —
                  {{ row.statusJentik === 'ADA' ? 'Ada jentik' : 'Bebas jentik' }}
                </h2>
                <p class="mt-1 text-ink-600">
                  Sumber: {{ row.sumber === 'KADER_RT' ? 'Kader RT' : 'Mandiri' }} · Status:
                  {{ data.labelStatusLaporanPsn(row.statusLaporan) }}
                </p>
                @if (row.catatan) {
                  <p class="mt-2 text-sm text-ink-500">Catatan: {{ row.catatan }}</p>
                }
              </div>
              <div class="flex flex-wrap gap-2">
                @if (row.statusLaporan === 'MENUNGGU_VERIFIKASI' && auth.hasRole('OP_RT', 'ADMIN_KEL', 'KOORD_RW')) {
                  <button type="button" class="btn-primary" (click)="terimaMandiri(row.id)">Verifikasi Mandiri</button>
                }
                @if (row.statusLaporan === 'SUBMITTED' || row.statusLaporan === 'MENUNGGU_VERIFIKASI') {
                  <button type="button" class="btn-primary" (click)="setujui(row.id)">Setujui (dicek RW)</button>
                  <button type="button" class="btn-danger" (click)="tolak(row.id)">Tolak / Revisi</button>
                }
              </div>
            </div>
          </article>
        } @empty {
          <div class="card text-center text-ink-500">Tidak ada antrian validasi saat ini.</div>
        }
      </div>
    </div>
  `,
})
export class PsnValidasiComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly antrian = computed(() => {
    const user = this.auth.currentUser();
    let list = this.data
      .laporanPsns()
      .filter((l) => ['SUBMITTED', 'MENUNGGU_VERIFIKASI'].includes(l.statusLaporan));
    if (user?.role === 'KOORD_RW' && user.rwId) {
      const ids = this.data
        .rts()
        .filter((r) => r.rwId === user.rwId)
        .map((r) => r.id);
      list = list.filter((l) => ids.includes(l.rtId));
    }
    return list;
  });

  terimaMandiri(id: string): void {
    this.data.updateStatusLaporan(id, 'SUBMITTED', 'Diverifikasi dari laporan mandiri');
  }

  setujui(id: string): void {
    this.data.updateStatusLaporan(id, 'VALIDATED_RW');
  }

  tolak(id: string): void {
    this.data.updateStatusLaporan(id, 'REJECTED', 'Dikembalikan untuk revisi');
  }
}
