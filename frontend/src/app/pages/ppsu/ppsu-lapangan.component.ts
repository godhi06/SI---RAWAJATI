import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import {
  FotoKerjaSlot,
  JenisKerjaPpsu,
  KategoriTugasPpsu,
  PrioritasUrgensiPpsu,
} from '../../core/models';
import { CameraCaptureComponent } from '../../shared/camera-capture.component';

type FieldTab = 'kerja' | 'gudang';
type FotoKey = 'before' | 'progress' | 'after';

@Component({
  selector: 'app-ppsu-lapangan',
  standalone: true,
  imports: [CommonModule, FormsModule, CameraCaptureComponent],
  template: `
    <div class="mx-auto max-w-lg space-y-4">
      <header>
        <p class="text-xs font-bold uppercase tracking-wider text-blue-700">PPSU Lapangan · Non-CRM</p>
        <h1 class="page-title text-xl sm:text-2xl">Halo, {{ auth.currentUser()?.name }}</h1>
        <p class="page-sub">Lapor kerja harian &amp; kelola pinjaman alat gudang — tampilan sederhana untuk HP.</p>
      </header>

      <!-- 2 tab only -->
      <div class="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-soft">
        <button
          type="button"
          class="rounded-xl px-3 py-3 text-sm font-bold transition"
          [class]="tab() === 'kerja' ? 'bg-blue-700 text-white' : 'text-slate-600'"
          (click)="tab.set('kerja')"
        >
          Lapor Kerja Rutin
        </button>
        <button
          type="button"
          class="rounded-xl px-3 py-3 text-sm font-bold transition"
          [class]="tab() === 'gudang' ? 'bg-blue-700 text-white' : 'text-slate-600'"
          (click)="tab.set('gudang')"
        >
          Ambil / Kembalikan Alat
        </button>
      </div>

      @if (tab() === 'kerja') {
        <form class="card space-y-4" (ngSubmit)="kirimKerja()">
          <h2 class="text-lg font-bold text-slate-900">Lapor Kerja Rutin (Non-CRM)</h2>
          <p class="text-sm text-slate-500">
            Ini <strong>bukti kerja</strong> (bukan absen masuk/pulang). Wajib 3 foto + GPS.
          </p>

          <div class="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-3">
            <p class="text-xs font-bold uppercase tracking-wide text-blue-700">Petugas pengunggah</p>
            <p class="mt-1 text-sm font-bold text-slate-900">{{ petugasAktif().nama }}</p>
            <p class="mt-0.5 text-xs text-slate-600">{{ petugasAktif().regu }}</p>
            <p class="mt-1 text-[11px] text-slate-500">Otomatis dari akun login — tidak perlu diketik ulang.</p>
          </div>

          <!-- Foto ditaruh atas supaya langsung kelihatan di HP (tidak perlu scroll jauh) -->
          <div class="space-y-3 rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-3">
            <p class="field-label mb-0 text-blue-900">📷 Upload foto wajib (3 slot)</p>
            <p class="text-xs text-slate-600">
              Tekan <strong>Kamera</strong> atau <strong>Galeri</strong>. Di HP: izinkan lokasi agar GPS
              asli tertanam.
            </p>
            @if (gpsStatus()) {
              <p class="text-xs font-semibold text-slate-700">{{ gpsStatus() }}</p>
            }

            @for (slot of fotoSlots; track slot.key) {
              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-bold text-slate-800">{{ slot.title }}</p>
                  @if (slot.data) {
                    <span class="badge-ok">Terunggah</span>
                  } @else {
                    <span class="badge-muted">Wajib</span>
                  }
                </div>

                <input
                  [id]="'ppsu-galeri-' + slot.key"
                  class="sr-only"
                  type="file"
                  accept="image/*"
                  (change)="onFoto($event, slot.key)"
                />

                <div class="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="btn-primary !py-2 text-sm"
                    (click)="bukaKameraSlot(slot.key)"
                  >
                    Kamera
                  </button>
                  <button
                    type="button"
                    class="btn-secondary !py-2 text-sm"
                    (click)="bukaInput('ppsu-galeri-' + slot.key)"
                  >
                    Galeri
                  </button>
                </div>

                @if (slot.data; as f) {
                  <div class="mt-2 space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <p>📎 {{ f.fileName }}</p>
                    <p>⏱ {{ formatTs(f.timestamp) }}</p>
                    <p>
                      📍 GPS {{ f.latitude }}, {{ f.longitude }}
                      @if (f.gpsSource === 'device') {
                        <span class="font-semibold text-emerald-700"> · GPS HP asli</span>
                      } @else {
                        <span class="font-semibold text-amber-700"> · fallback demo</span>
                      }
                    </p>
                    @if (f.accuracyMeters != null) {
                      <p>± {{ f.accuracyMeters }} m</p>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <div>
            <label class="field-label">Lokasi jalan / saluran</label>
            <select class="field-input" [(ngModel)]="lokasi" name="lokasi" required>
              <option value="">— Pilih lokasi Rawajati —</option>
              @for (loc of data.lokasiKerjaOptions; track loc) {
                <option [value]="loc">{{ loc }}</option>
              }
            </select>
          </div>

          <div>
            <label class="field-label">Jenis pekerjaan</label>
            <select class="field-input" [(ngModel)]="jenis" name="jenis" required>
              <option value="KURAS_SALURAN">Kuras Saluran / Tali Air</option>
              <option value="SAPU_JALAN">Sapu Jalan</option>
              <option value="BABAT_RUMPUT">Babat Rumput</option>
            </select>
          </div>

          <div>
            <label class="field-label">Kategori tugas</label>
            <select class="field-input" [(ngModel)]="kategori" name="kategori" required>
              <option value="PLOTING_RUTIN">Ploting Rutin Harian</option>
              <option value="URGENSI_RW">Permintaan Urgensi RW</option>
            </select>
          </div>

          @if (kategori === 'PLOTING_RUTIN') {
            <div>
              <label class="field-label" for="estimasi-area">Estimasi panjang / area kerja</label>
              <input
                id="estimasi-area"
                class="field-input"
                [(ngModel)]="estimasiArea"
                name="estimasiArea"
                placeholder="Contoh: Ruas ±300 meter"
                required
              />
            </div>
          } @else {
            <div>
              <label class="field-label" for="asal-rw">Asal laporan RW</label>
              <select id="asal-rw" class="field-input" [(ngModel)]="asalRwId" name="asalRwId" required>
                <option value="">— Pilih RW —</option>
                @for (rw of rwOptions(); track rw.id) {
                  <option [value]="rw.id">{{ data.labelRw(rw.nomor) }} · {{ rw.namaKetua }}</option>
                }
              </select>
            </div>
            <div>
              <label class="field-label" for="prioritas">Prioritas</label>
              <select id="prioritas" class="field-input" [(ngModel)]="prioritas" name="prioritas" required>
                <option value="DARURAT">Prioritas Darurat</option>
                <option value="NORMAL">Prioritas Normal</option>
              </select>
            </div>
          }

          <div>
            <label class="field-label">Catatan (opsional)</label>
            <textarea class="field-input" rows="2" [(ngModel)]="catatan" name="catatan"></textarea>
          </div>

          <button class="btn-primary w-full" type="submit" [disabled]="!bisaKirim() || fotoLoading()">
            {{ fotoLoading() ? 'Menyematkan GPS…' : 'Kirim Laporan Kerja' }}
          </button>

          @if (sukses()) {
            <p class="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              Laporan terkirim. Atasan (Ekbang) dapat memantau foto Before–Progress–After.
            </p>
          }
        </form>
      } @else {
        <div class="space-y-3">
          <h2 class="text-lg font-bold text-slate-900">Ambil / Kembalikan Alat Gudang</h2>
          @for (a of data.asetPpsus(); track a.id) {
            <article class="card !p-4">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-xs font-semibold text-slate-500">{{ a.kodeAset }}</p>
                  <h3 class="text-base font-bold text-slate-900">{{ a.namaAlat }}</h3>
                  <p class="mt-1 text-sm text-slate-500">
                    Stok {{ a.jumlah }} {{ a.satuan }} · {{ a.lokasiGudang }}
                  </p>
                  <p class="mt-2">
                    <span [class]="pinjamBadge(a.statusPinjam)">{{ a.statusPinjam }}</span>
                    @if (a.dipinjamOleh) {
                      <span class="ml-2 text-xs text-slate-500">oleh {{ a.dipinjamOleh }}</span>
                    }
                  </p>
                </div>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2">
                @if (a.statusPinjam === 'TERSEDIA') {
                  <button type="button" class="btn-primary !py-2.5 text-sm" (click)="pinjam(a.id)">
                    Pinjam
                  </button>
                  <button type="button" class="btn-danger !py-2.5 text-sm" (click)="rusak(a.id)">
                    Lapor Rusak
                  </button>
                } @else if (a.statusPinjam === 'DIPINJAM') {
                  <button type="button" class="btn-primary !py-2.5 text-sm" (click)="kembali(a.id)">
                    Kembalikan
                  </button>
                  <button type="button" class="btn-danger !py-2.5 text-sm" (click)="rusak(a.id)">
                    Lapor Rusak
                  </button>
                } @else {
                  <button type="button" class="btn-secondary col-span-2 !py-2.5 text-sm" disabled>
                    Menunggu perbaikan
                  </button>
                }
              </div>
            </article>
          }
        </div>
      }

      @if (kameraSlot(); as key) {
        <app-camera-capture (captured)="onKameraCaptured($event)" (closed)="kameraSlot.set(null)" />
      }
    </div>
  `,
})
export class PpsuLapanganComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly tab = signal<FieldTab>('kerja');
  readonly sukses = signal(false);
  readonly kameraSlot = signal<FotoKey | null>(null);
  readonly gpsStatus = signal<string | null>(null);
  readonly fotoLoading = signal(false);

  lokasi = 'Jl. Rawajati Timur';
  jenis: JenisKerjaPpsu = 'KURAS_SALURAN';
  kategori: KategoriTugasPpsu = 'PLOTING_RUTIN';
  estimasiArea = 'Ruas ±300 meter';
  asalRwId = '';
  prioritas: PrioritasUrgensiPpsu = 'DARURAT';
  catatan = '';

  fotoBefore: FotoKerjaSlot | null = null;
  fotoProgress: FotoKerjaSlot | null = null;
  fotoAfter: FotoKerjaSlot | null = null;

  readonly petugasAktif = computed(() => {
    const u = this.auth.currentUser();
    return {
      nama: u?.name || 'Petugas PPSU',
      regu: u?.reguPpsu || 'Regu belum diisi',
      id: u?.id || '',
    };
  });

  readonly rwOptions = computed(() =>
    [...this.data.rws()].sort(
      (a, b) => Number.parseInt(a.nomor, 10) - Number.parseInt(b.nomor, 10) || a.nomor.localeCompare(b.nomor, 'id'),
    ),
  );

  get fotoSlots() {
    return [
      { key: 'before' as const, title: 'Foto Before 0%', data: this.fotoBefore },
      { key: 'progress' as const, title: 'Foto Progress 50%', data: this.fotoProgress },
      { key: 'after' as const, title: 'Foto After 100%', data: this.fotoAfter },
    ];
  }

  bukaInput(id: string): void {
    document.getElementById(id)?.click();
  }

  bukaKameraSlot(key: FotoKey): void {
    this.kameraSlot.set(key);
  }

  onFoto(event: Event, key: FotoKey): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.applyFoto(file, key);
  }

  onKameraCaptured(file: File): void {
    const key = this.kameraSlot();
    this.kameraSlot.set(null);
    if (!key) return;
    this.applyFoto(file, key);
  }

  private applyFoto(file: File, key: FotoKey): void {
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    const label =
      key === 'before' ? 'BEFORE_0' : key === 'progress' ? 'PROGRESS_50' : 'AFTER_100';
    this.fotoLoading.set(true);
    this.gpsStatus.set('Mengambil GPS perangkat…');
    void this.data.ambilGpsPerangkat().then((gps) => {
      const slot = this.data.buatFotoSlot(label, name, gps);
      if (key === 'before') this.fotoBefore = slot;
      if (key === 'progress') this.fotoProgress = slot;
      if (key === 'after') this.fotoAfter = slot;
      this.gpsStatus.set(
        gps.gpsSource === 'device'
          ? 'GPS HP asli tertanam di foto.'
          : 'GPS perangkat tidak tersedia — memakai fallback demo Rawajati.',
      );
      this.fotoLoading.set(false);
    });
  }

  bisaKirim(): boolean {
    if (!(this.lokasi && this.fotoBefore && this.fotoProgress && this.fotoAfter)) return false;
    if (this.kategori === 'PLOTING_RUTIN') return !!this.estimasiArea.trim();
    return !!this.asalRwId;
  }

  kirimKerja(): void {
    const user = this.auth.currentUser();
    if (!user || !this.fotoBefore || !this.fotoProgress || !this.fotoAfter) return;

    const rw = this.data.rws().find((r) => r.id === this.asalRwId);
    this.data.addLaporanKerja({
      petugasUserId: user.id,
      petugasNama: user.name,
      reguLabel: user.reguPpsu || 'Regu belum diisi',
      lokasi: this.lokasi,
      jenisPekerjaan: this.jenis,
      kategoriTugas: this.kategori,
      estimasiArea: this.kategori === 'PLOTING_RUTIN' ? this.estimasiArea.trim() : undefined,
      asalRwId: this.kategori === 'URGENSI_RW' ? this.asalRwId : undefined,
      asalRwLabel:
        this.kategori === 'URGENSI_RW' && rw ? this.data.labelRw(rw.nomor) : undefined,
      prioritasUrgensi: this.kategori === 'URGENSI_RW' ? this.prioritas : undefined,
      catatan: this.catatan || 'Non-CRM',
      fotoBefore: this.fotoBefore,
      fotoProgress: this.fotoProgress,
      fotoAfter: this.fotoAfter,
    });

    this.fotoBefore = null;
    this.fotoProgress = null;
    this.fotoAfter = null;
    this.catatan = '';
    this.sukses.set(true);
  }

  pinjam(id: string): void {
    const nama = this.auth.currentUser()?.name || 'Petugas PPSU';
    this.data.pinjamAlat(id, nama);
  }

  kembali(id: string): void {
    this.data.kembalikanAlat(id);
  }

  rusak(id: string): void {
    this.data.laporAlatRusak(id);
  }

  pinjamBadge(status: string): string {
    if (status === 'TERSEDIA') return 'badge-ok';
    if (status === 'DIPINJAM') return 'badge-warn';
    return 'badge-danger';
  }

  formatTs(iso: string): string {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
