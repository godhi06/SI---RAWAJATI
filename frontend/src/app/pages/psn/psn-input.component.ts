import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { KategoriBangunan, StatusJentik } from '../../core/models';
import { CameraCaptureComponent } from '../../shared/camera-capture.component';

type ModeBangunan = 'KETIK' | 'DAFTAR';

@Component({
  selector: 'app-psn-input',
  standalone: true,
  imports: [CommonModule, FormsModule, CameraCaptureComponent],
  template: `
    <div class="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 class="page-title">Input Jumat Pagi</h1>
        <p class="page-sub">
          Untuk kader Jumantik yang keliling: ketik nama bangunan, catat jentik, dan
          <strong>wajib ambil foto bukti</strong> dari HP.
        </p>
      </header>

      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <div class="rounded-xl border border-blue-100 bg-blue-50 px-2 py-3 text-center sm:px-3">
          <p class="text-xl font-bold text-blue-800 sm:text-2xl">{{ countBy('RUMAH_WARGA') }}</p>
          <p class="text-xs font-semibold text-blue-700 sm:text-sm">Rumah Warga</p>
        </div>
        <div class="rounded-xl border border-indigo-100 bg-indigo-50 px-2 py-3 text-center sm:px-3">
          <p class="text-xl font-bold text-indigo-800 sm:text-2xl">{{ countBy('KOS_KONTRAKAN') }}</p>
          <p class="text-xs font-semibold text-indigo-700 sm:text-sm">Kos/Kontrakan</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center sm:px-3">
          <p class="text-xl font-bold text-slate-800 sm:text-2xl">{{ countBy('FASUM') }}</p>
          <p class="text-xs font-semibold text-slate-600 sm:text-sm">Fasum</p>
        </div>
      </div>

      <form class="card space-y-5" (ngSubmit)="submit()">
        <div>
          <label class="field-label" for="tanggal">Tanggal pemeriksaan</label>
          <input id="tanggal" type="date" class="field-input" [(ngModel)]="tanggal" name="tanggal" required />
        </div>

        <div class="space-y-3">
          <p class="field-label">Bangunan yang diperiksa</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-xl border-2 px-3 py-2.5 text-sm font-bold"
              [class]="
                modeBangunan === 'KETIK'
                  ? 'border-blue-600 bg-blue-50 text-blue-800'
                  : 'border-slate-200 bg-white text-slate-600'
              "
              (click)="modeBangunan = 'KETIK'"
            >
              Ketik nama
            </button>
            <button
              type="button"
              class="rounded-xl border-2 px-3 py-2.5 text-sm font-bold"
              [class]="
                modeBangunan === 'DAFTAR'
                  ? 'border-blue-600 bg-blue-50 text-blue-800'
                  : 'border-slate-200 bg-white text-slate-600'
              "
              (click)="modeBangunan = 'DAFTAR'"
            >
              Pilih dari daftar
            </button>
          </div>

          @if (modeBangunan === 'KETIK') {
            <div>
              <label class="field-label" for="label-bangunan">Nama bangunan / panggilan</label>
              <input
                id="label-bangunan"
                class="field-input"
                type="text"
                name="labelBangunan"
                [(ngModel)]="labelBangunan"
                list="saran-bangunan"
                placeholder='Contoh: rumah ucok, bangunan kontrakan gang 2…'
                required
                autocomplete="off"
              />
              <datalist id="saran-bangunan">
                @for (s of saranBangunan(); track s) {
                  <option [value]="s"></option>
                }
              </datalist>
              <p class="mt-1.5 text-xs text-slate-500">
                Boleh nama akrab — mekanisme tempat tinggal sering berubah (kos/kontrakan).
              </p>
            </div>
            <div>
              <label class="field-label" for="kategori-bangunan">Jenis bangunan</label>
              <select
                id="kategori-bangunan"
                class="field-input"
                name="kategoriBangunan"
                [(ngModel)]="kategoriBangunan"
                required
              >
                <option value="RUMAH_WARGA">Rumah Warga</option>
                <option value="KOS_KONTRAKAN">Kos/Kontrakan</option>
                <option value="FASUM">Fasum</option>
              </select>
            </div>
          } @else {
            <div>
              <label class="field-label" for="rumah">Pilih dari master RT</label>
              <select id="rumah" class="field-input" [(ngModel)]="rumahId" name="rumah" required>
                <option value="">— Pilih bangunan —</option>
                @for (group of rumahGroups(); track group.kategori) {
                  <optgroup [label]="group.label">
                    @for (r of group.items; track r.id) {
                      <option [value]="r.id">
                        [{{ group.label }}] No. {{ r.noRumah }} · {{ r.namaKk }} · {{ r.alamat }}
                      </option>
                    }
                  </optgroup>
                }
              </select>
              <p class="mt-2 text-sm text-slate-500">
                Total {{ totalBangunan() }} bangunan aktif di RT ini.
              </p>
            </div>
          }
        </div>

        <div>
          <p class="field-label">Status jentik</p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="min-h-16 rounded-2xl border-2 px-4 py-4 text-lg font-bold"
              [class]="
                statusJentik === 'TIDAK_ADA'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white'
              "
              (click)="statusJentik = 'TIDAK_ADA'"
            >
              Tidak Ada Jentik
            </button>
            <button
              type="button"
              class="min-h-16 rounded-2xl border-2 px-4 py-4 text-lg font-bold"
              [class]="statusJentik === 'ADA' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white'"
              (click)="statusJentik = 'ADA'"
            >
              Ada Jentik
            </button>
          </div>
        </div>

        <div>
          <label class="field-label" for="kontainer">Jumlah kontainer diperiksa (opsional)</label>
          <input
            id="kontainer"
            type="number"
            min="0"
            class="field-input"
            [(ngModel)]="jumlahKontainer"
            name="kontainer"
          />
        </div>

        <div class="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p class="field-label mb-0">Foto bukti pemeriksaan (wajib)</p>
          <p class="mb-3 text-sm text-slate-600">
            Wajib foto bak mandi / kontainer air. Di laptop: kamera webcam; di HP: kamera HP.
          </p>

          <input
            #fotoGaleri
            class="sr-only"
            type="file"
            accept="image/*"
            (change)="onFoto($event)"
          />

          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" class="btn-primary" (click)="bukaKamera.set(true)">
              Ambil dari Kamera
            </button>
            <button type="button" class="btn-secondary" (click)="fotoGaleri.click()">
              Pilih dari Galeri
            </button>
          </div>

          @if (fotoName) {
            <div class="mt-3 space-y-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700">
              <p class="font-semibold text-emerald-800">✓ Foto terunggah</p>
              <p>📎 {{ fotoName }}</p>
              <p>⏱ {{ formatTs(fotoTimestamp) }}</p>
              <p>📍 GPS {{ fotoLatitude }}, {{ fotoLongitude }}</p>
            </div>
          } @else {
            <p class="mt-2 text-xs font-semibold text-rose-600">Belum ada foto — laporan tidak bisa dikirim.</p>
          }
        </div>

        <div>
          <label class="field-label" for="catatan">Catatan</label>
          <textarea id="catatan" rows="3" class="field-input" [(ngModel)]="catatan" name="catatan"></textarea>
        </div>

        <button type="submit" class="btn-primary w-full" [disabled]="!bisaKirim()">
          Simpan Laporan Pemeriksaan
        </button>
        @if (!fotoName) {
          <p class="text-center text-xs text-rose-600">Lengkapi foto bukti dulu.</p>
        }
      </form>

      @if (done()) {
        <p class="rounded-xl bg-emerald-50 px-4 py-3 font-semibold text-emerald-800">
          Laporan terkirim. Angka langsung masuk Dashboard Kelurahan &amp; rekap RW.
        </p>
      }
    </div>

    @if (bukaKamera()) {
      <app-camera-capture (captured)="onKameraCaptured($event)" (closed)="bukaKamera.set(false)" />
    }
  `,
})
export class PsnInputComponent {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);

  tanggal = new Date().toISOString().slice(0, 10);
  modeBangunan: ModeBangunan = 'KETIK';
  rumahId = '';
  labelBangunan = '';
  kategoriBangunan: KategoriBangunan = 'RUMAH_WARGA';
  statusJentik: StatusJentik = 'TIDAK_ADA';
  jumlahKontainer: number | null = null;
  catatan = '';
  fotoName = '';
  fotoTimestamp = '';
  fotoLatitude: number | null = null;
  fotoLongitude: number | null = null;
  readonly done = signal(false);
  readonly bukaKamera = signal(false);

  readonly rumahGroups = computed(() => {
    const rtId = this.auth.currentUser()?.rtId;
    return rtId ? this.data.rumahGroupedByKategori(rtId) : [];
  });

  /** Saran autocomplete dari master + laporan ketik sebelumnya di RT ini. */
  readonly saranBangunan = computed(() => {
    const rtId = this.auth.currentUser()?.rtId;
    if (!rtId) return [] as string[];
    const dariMaster = this.data
      .rumahWargas()
      .filter((r) => r.rtId === rtId && r.isActive)
      .map((r) => `No. ${r.noRumah} · ${r.namaKk}`);
    const dariLaporan = this.data
      .laporanPsns()
      .filter((l) => l.rtId === rtId && !!l.labelBangunan)
      .map((l) => l.labelBangunan!);
    return [...new Set([...dariLaporan, ...dariMaster])].slice(0, 40);
  });

  countBy(kategori: 'RUMAH_WARGA' | 'KOS_KONTRAKAN' | 'FASUM'): number {
    return this.rumahGroups().find((g) => g.kategori === kategori)?.items.length ?? 0;
  }

  totalBangunan(): number {
    return this.rumahGroups().reduce((sum, g) => sum + g.items.length, 0);
  }

  onFoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.applyFoto(file);
  }

  onKameraCaptured(file: File): void {
    this.bukaKamera.set(false);
    this.applyFoto(file);
  }

  private applyFoto(file: File): void {
    const slot = this.data.buatFotoSlot('BEFORE_0', file.name.replace(/\.[^.]+$/, '') + '.jpg');
    this.fotoName = slot.fileName;
    this.fotoTimestamp = slot.timestamp;
    this.fotoLatitude = slot.latitude;
    this.fotoLongitude = slot.longitude;
  }

  formatTs(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  bisaKirim(): boolean {
    if (!this.fotoName) return false;
    if (this.modeBangunan === 'KETIK') return !!this.labelBangunan.trim();
    return !!this.rumahId;
  }

  submit(): void {
    const user = this.auth.currentUser();
    if (!user?.rtId || !this.bisaKirim()) return;

    const ketik = this.modeBangunan === 'KETIK';
    const label = this.labelBangunan.trim();

    // Langsung Terkirim → terhitung ABJ di Dashboard Lurah & rekap RW (tanpa draft / antrian approve).
    this.data.addLaporanPsn({
      rtId: user.rtId,
      rumahWargaId: ketik ? undefined : this.rumahId,
      labelBangunan: ketik ? label : undefined,
      kategoriBangunan: ketik ? this.kategoriBangunan : undefined,
      pelaporUserId: user.id,
      tanggalPemeriksaan: this.tanggal,
      sumber: 'KADER_RT',
      statusJentik: this.statusJentik,
      jumlahKontainer: this.jumlahKontainer ?? undefined,
      catatan: this.catatan || undefined,
      fotoName: this.fotoName,
      fotoTimestamp: this.fotoTimestamp || undefined,
      fotoLatitude: this.fotoLatitude ?? undefined,
      fotoLongitude: this.fotoLongitude ?? undefined,
      statusLaporan: 'SUBMITTED',
    });

    this.rumahId = '';
    this.labelBangunan = '';
    this.kategoriBangunan = 'RUMAH_WARGA';
    this.catatan = '';
    this.jumlahKontainer = null;
    this.statusJentik = 'TIDAK_ADA';
    this.fotoName = '';
    this.fotoTimestamp = '';
    this.fotoLatitude = null;
    this.fotoLongitude = null;
    this.done.set(true);
  }
}
