import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

/**
 * Sesuai buku laporan RT:
 * - SKD = domisili (tersendiri)
 * - SKematian = kematian (tersendiri)
 * - SK = payung untuk: umum, SKTM, pengantar nikah, cerai, aktifin NIK
 */
export type BukuSkRt = 'SK' | 'SKD' | 'SKEMATIAN';
export type PerihalSk =
  | 'UMUM'
  | 'SKTM'
  | 'NIKAH'
  | 'CERAI'
  | 'AKTIF_NIK'
  | 'DOMISILI'
  | 'KEMATIAN';

const BUKU: Array<{ id: BukuSkRt; label: string; deskripsi: string }> = [
  {
    id: 'SK',
    label: 'SK',
    deskripsi: 'Surat Keterangan — SKTM, nikah, cerai, aktif NIK, keterangan umum',
  },
  {
    id: 'SKD',
    label: 'SKD',
    deskripsi: 'Surat Keterangan Domisili — bertempat tinggal di wilayah RT',
  },
  {
    id: 'SKEMATIAN',
    label: 'SKematian',
    deskripsi: 'Surat Keterangan Kematian warga di wilayah RT',
  },
];

const PERIHAL_SK: Array<{ id: PerihalSk; label: string }> = [
  { id: 'SKTM', label: 'SKTM (tidak mampu)' },
  { id: 'NIKAH', label: 'Pengantar nikah' },
  { id: 'CERAI', label: 'Surat cerai / pengantar cerai' },
  { id: 'AKTIF_NIK', label: 'Aktifin NIK' },
  { id: 'UMUM', label: 'Keterangan umum' },
];

/** Portal surat RT mengikuti buku: SK · SKD · SKematian. */
@Component({
  selector: 'app-surat-keterangan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header>
        <h1 class="page-title">Surat Keterangan RT</h1>
        <p class="mt-1 text-sm font-semibold text-blue-700">
          Buku laporan: <strong>SK</strong> · <strong>SKD</strong> · <strong>SKematian</strong>
        </p>
        <p class="page-sub">
          Pilih buku → (jika SK) pilih perihal → pilih warga → cetak PDF.
          <a routerLink="/app/data-warga" class="font-semibold text-blue-700">Kelola data warga →</a>
        </p>
      </header>

      <section class="grid gap-3 sm:grid-cols-3">
        @for (b of bukuList; track b.id) {
          <button
            type="button"
            class="rounded-xl border-2 p-4 text-left transition"
            [class]="
              buku() === b.id
                ? 'border-blue-600 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-blue-300'
            "
            (click)="pilihBuku(b.id)"
          >
            <p class="text-base font-extrabold text-slate-900">{{ b.label }}</p>
            <p class="mt-1 text-xs text-slate-600">{{ b.deskripsi }}</p>
          </button>
        }
      </section>

      @if (buku() === 'SK') {
        <section class="card !p-4">
          <p class="mb-2 text-sm font-bold text-slate-800">Perihal SK (semua nomor buku SK)</p>
          <div class="flex flex-wrap gap-2">
            @for (p of perihalSkList; track p.id) {
              <button
                type="button"
                class="rounded-xl border-2 px-3 py-2 text-sm font-bold"
                [class]="
                  perihal() === p.id
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-700'
                "
                (click)="perihal.set(p.id)"
              >
                {{ p.label }}
              </button>
            }
          </div>
        </section>
      }

      <section class="card space-y-3 !p-4">
        <label class="field-label" for="sk-cari">Cari / pilih warga</label>
        <input
          id="sk-cari"
          class="field-input"
          [ngModel]="q()"
          (ngModelChange)="q.set($event)"
          placeholder="Nama atau NIK…"
        />
        <div class="max-h-72 space-y-2 overflow-y-auto">
          @for (w of daftar(); track w.id) {
            <button
              type="button"
              class="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left"
              [class]="
                wargaId() === w.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              "
              (click)="wargaId.set(w.id)"
            >
              <div>
                <p class="font-bold text-slate-900">{{ w.nama }}</p>
                <p class="text-xs text-slate-500">
                  NIK {{ w.nik }} · {{ data.labelStatusTinggal(w.statusTinggal) }} · {{ w.alamat }}
                </p>
              </div>
              @if (wargaId() === w.id) {
                <span class="text-xs font-bold text-blue-700">Dipilih</span>
              }
            </button>
          } @empty {
            <p class="py-6 text-center text-sm text-slate-500">
              Belum ada warga. Isi dulu di
              <a routerLink="/app/data-warga" class="font-semibold text-blue-700">Data Warga</a>.
            </p>
          }
        </div>
      </section>

      <div class="flex flex-wrap gap-2">
        <a
          class="btn-primary"
          [class.pointer-events-none]="!wargaId()"
          [class.opacity-50]="!wargaId()"
          [routerLink]="['/app/data-warga/surat-keterangan']"
          [queryParams]="{ id: wargaId(), jenis: perihalAktif() }"
        >
          Preview &amp; Cetak {{ labelCetak() }}
        </a>
        <a routerLink="/app/data-warga" class="btn-secondary">Buka daftar warga</a>
      </div>
    </div>
  `,
})
export class SuratKeteranganComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  private readonly route = inject(ActivatedRoute);

  readonly bukuList = BUKU;
  readonly perihalSkList = PERIHAL_SK;

  readonly buku = signal<BukuSkRt>('SK');
  readonly perihal = signal<PerihalSk>('SKTM');
  readonly q = signal('');
  readonly wargaId = signal(this.route.snapshot.queryParamMap.get('highlight') || '');

  readonly daftar = computed(() => this.data.cariWargaTerdata(this.auth.currentUser(), this.q()));

  pilihBuku(id: BukuSkRt): void {
    this.buku.set(id);
    if (id === 'SKD') this.perihal.set('DOMISILI');
    else if (id === 'SKEMATIAN') this.perihal.set('KEMATIAN');
    else if (this.perihal() === 'DOMISILI' || this.perihal() === 'KEMATIAN') {
      this.perihal.set('SKTM');
    }
  }

  perihalAktif(): PerihalSk {
    if (this.buku() === 'SKD') return 'DOMISILI';
    if (this.buku() === 'SKEMATIAN') return 'KEMATIAN';
    return this.perihal();
  }

  labelCetak(): string {
    const p = this.perihalAktif();
    if (p === 'DOMISILI') return 'SKD';
    if (p === 'KEMATIAN') return 'SKematian';
    const sub = this.perihalSkList.find((x) => x.id === p)?.label ?? p;
    return `SK · ${sub}`;
  }
}
