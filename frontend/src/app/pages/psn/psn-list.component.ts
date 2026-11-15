import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { Rw } from '../../core/models';

type FilterJentik = '' | 'ADA' | 'TIDAK_ADA';
type FilterFoto = '' | 'ADA' | 'TANPA';

@Component({
  selector: 'app-psn-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Laporan PSN Jumantik</h1>
          <p class="page-sub">
            Rekap pemeriksaan bangunan (Rumah Warga, Kos/Kontrakan, Fasum). Urutan: RW 01 → RT, lalu RW
            berikutnya. Undangan pertemuan PSN bisa di-blast ke Ketua RW.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          @if (auth.hasRole('ADMIN_KEL')) {
            <button type="button" class="btn-primary" (click)="bukaPanelUndangan()">
              Undangan PSN · WA + PDF
              @if (data.undanganPsnPdf()) {
                · PDF ✓
              }
            </button>
          }
          @if (auth.hasRole('ADMIN_KEL', 'KOORD_RW')) {
            <a routerLink="/app/laporan-resmi" class="btn-secondary">Cetak PDF ABJ</a>
          }
          @if (auth.hasRole('OP_RT')) {
            <a routerLink="/app/psn/input" class="btn-primary">+ Input baru</a>
          }
        </div>
      </header>

      <section class="card space-y-4 !p-4">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="field-label" for="psn-rw">Filter RW</label>
            <select id="psn-rw" class="field-input" [ngModel]="rwId()" (ngModelChange)="onRwChange($event)" [disabled]="lockRw()">
              <option value="">Semua RW</option>
              @for (rw of rwOptions(); track rw.id) {
                <option [value]="rw.id">{{ data.labelRw(rw.nomor) }} · {{ rw.namaKetua }}</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label" for="psn-rt">Filter RT</label>
            <select
              id="psn-rt"
              class="field-input"
              [ngModel]="rtId()"
              (ngModelChange)="rtId.set($event)"
              [disabled]="lockRt() || !rtOptions().length"
            >
              <option value="">Semua RT{{ rwId() ? ' di RW ini' : '' }}</option>
              @for (rt of rtOptions(); track rt.id) {
                <option [value]="rt.id">{{ data.labelRt(rt.nomor) }} · {{ rt.namaKetua }}</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label" for="psn-jentik">Status jentik</label>
            <select id="psn-jentik" class="field-input" [ngModel]="jentik()" (ngModelChange)="jentik.set($event)">
              <option value="">Semua</option>
              <option value="ADA">Ada jentik</option>
              <option value="TIDAK_ADA">Tidak ada jentik</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="psn-foto">Foto bukti</label>
            <select id="psn-foto" class="field-input" [ngModel]="foto()" (ngModelChange)="foto.set($event)">
              <option value="">Semua</option>
              <option value="ADA">Ada foto</option>
              <option value="TANPA">Tanpa foto</option>
            </select>
          </div>
        </div>
        <p class="text-sm text-slate-500">
          Menampilkan <strong class="text-slate-800">{{ rows().length }}</strong> laporan
          @if (positifCount() > 0) {
            · <span class="font-semibold text-rose-600">{{ positifCount() }} positif jentik</span>
          }
        </p>
      </section>

      <div class="card overflow-hidden p-0">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-base">
            <thead class="bg-ink-50 text-sm uppercase tracking-wide text-ink-500">
              <tr>
                <th class="px-4 py-3">Tanggal &amp; Jam</th>
                <th class="px-4 py-3">Wilayah</th>
                <th class="px-4 py-3">Bangunan</th>
                <th class="px-4 py-3">Kategori</th>
                <th class="px-4 py-3">Jentik</th>
                <th class="px-4 py-3">Foto</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id) {
                <tr
                  class="border-t border-slate-100"
                  [class]="row.statusJentik === 'ADA' ? 'border-t border-slate-100 bg-rose-50' : 'border-t border-slate-100'"
                >
                  <td class="px-4 py-3 whitespace-nowrap">
                    <p class="font-medium text-slate-900">{{ formatWaktu(row.createdAt) }}</p>
                    <p class="text-xs text-slate-500">Periksa: {{ row.tanggalPemeriksaan }}</p>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">{{ data.labelWilayah(row.rtId) }}</td>
                  <td class="px-4 py-3">
                    <p class="font-medium text-slate-800">{{ labelBangunan(row) }}</p>
                    @if (row.catatan) {
                      <p class="mt-0.5 text-xs text-slate-500">{{ row.catatan }}</p>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge-muted">{{ labelKategoriLaporan(row) }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span [class]="row.statusJentik === 'ADA' ? 'badge-danger' : 'badge-ok'">
                      {{ row.statusJentik === 'ADA' ? 'Ada' : 'Tidak ada' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    @if (row.fotoName) {
                      <span class="badge-ok" [title]="row.fotoName">📷 Ada foto</span>
                    } @else {
                      <span class="badge-muted">Tanpa foto</span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge-muted">{{ data.labelStatusLaporanPsn(row.statusLaporan) }}</span>
                    @if (row.statusLaporan === 'MENUNGGU_VERIFIKASI' && auth.hasRole('OP_RT', 'ADMIN_KEL')) {
                      <button
                        type="button"
                        class="btn-secondary mt-2 !min-h-9 !px-3 !py-1.5 text-xs"
                        (click)="verifikasiMandiri(row.id)"
                      >
                        Verifikasi
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                    Tidak ada laporan untuk filter ini.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (bukaUndangan()) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center"
        (click)="tutupUndangan()"
      >
        <div
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-base font-bold text-slate-900">Undangan Pertemuan PSN · teks + PDF</h3>
              <p class="mt-1 text-sm text-slate-500">
                Demo: tiap kiriman = <strong>teks undangan + PDF</strong>. Sistem buka chat WA dan unduh PDF;
                tempel 📎 di WhatsApp. Nanti dengan WA Bisnis API, teks + PDF bisa otomatis sekali kirim — RW
                tetap terima di WA biasa.
              </p>
            </div>
            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-lg leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              (click)="tutupUndangan()"
              aria-label="Tutup"
              title="Tutup"
            >
              ×
            </button>
          </div>

          <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Surat undangan PDF</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <a
                class="btn-secondary !py-2 !px-3 text-sm"
                routerLink="/app/psn/undangan-cetak"
                (click)="bukaUndangan.set(false)"
              >
                Cetak template PDF
              </a>
            </div>
            <p class="mt-2 text-xs text-slate-500">
              Atau unggah PDF yang sudah jadi (hasil cetak / file kelurahan).
            </p>
            @if (data.undanganPsnPdf(); as pdf) {
              <p class="mt-2 text-sm font-semibold text-slate-900">📄 {{ pdf.fileName }}</p>
              <p class="text-xs text-slate-500">
                Diunggah {{ formatWaktu(pdf.uploadedAt) }} · {{ pdf.uploadedBy }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                @if (pdf.objectUrl) {
                  <a class="btn-secondary !py-2 !px-3 text-sm" [href]="pdf.objectUrl" target="_blank" rel="noopener">
                    Buka / unduh PDF
                  </a>
                }
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="data.hapusUndanganPsnPdf()">
                  Ganti / hapus
                </button>
              </div>
            } @else {
              <input
                #pdfInput
                class="sr-only"
                type="file"
                accept="application/pdf,.pdf"
                (change)="onUploadPdf($event)"
              />
              <button type="button" class="btn-primary mt-3 !py-2 !px-3 text-sm" (click)="pdfInput.click()">
                Upload PDF undangan
              </button>
            }
          </div>

          <div class="mt-4 grid gap-3">
            <div>
              <label class="field-label" for="und-nomor">Nomor surat</label>
              <input
                id="und-nomor"
                class="field-input"
                [ngModel]="draft().nomorSurat"
                (ngModelChange)="data.patchUndanganPsnDraft({ nomorSurat: $event })"
              />
            </div>
            <div>
              <label class="field-label" for="und-tgl">Hari / tanggal</label>
              <input
                id="und-tgl"
                class="field-input"
                [ngModel]="draft().hariTanggal"
                (ngModelChange)="data.patchUndanganPsnDraft({ hariTanggal: $event })"
              />
            </div>
            <div>
              <label class="field-label" for="und-jam">Waktu</label>
              <input
                id="und-jam"
                class="field-input"
                [ngModel]="draft().jam"
                (ngModelChange)="data.patchUndanganPsnDraft({ jam: $event })"
              />
            </div>
            <div>
              <label class="field-label" for="und-tempat">Tempat</label>
              <input
                id="und-tempat"
                class="field-input"
                [ngModel]="draft().tempat"
                (ngModelChange)="data.patchUndanganPsnDraft({ tempat: $event })"
              />
            </div>
            <div>
              <label class="field-label" for="und-agenda">Agenda</label>
              <textarea
                id="und-agenda"
                class="field-input min-h-[4.5rem]"
                [ngModel]="draft().agenda"
                (ngModelChange)="data.patchUndanganPsnDraft({ agenda: $event })"
              ></textarea>
            </div>
          </div>

          @if (antrianIdx() === null) {
            @if (rwUji(); as uji) {
              <button
                type="button"
                class="btn-primary mt-4 w-full"
                (click)="kirimWaDenganPdf(uji)"
              >
                Uji kirim ke RW 07 · teks + PDF
              </button>
              <p class="mt-1 text-center text-xs text-slate-500">
                @if (data.sudahKirimUndanganKeRw('rw-7')) {
                  ✓ Sudah tercatat kirim ke RW 07 (teks + PDF). Boleh kirim ulang.
                } @else {
                  Chat terbuka + PDF terunduh → Kirim teks → 📎 lampirkan PDF.
                }
              </p>
            }
            <button type="button" class="btn-secondary mt-3 w-full" (click)="mulaiBlastBerurutan()">
              Mulai blast berurutan ({{ rwTargets().length }} Ketua RW)
            </button>

            <h4 class="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">Atau kirim manual</h4>
            <ul class="mt-2 space-y-2">
              @for (rw of rwTargets(); track rw.id) {
                <li
                  class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-3"
                >
                  <div>
                    <p class="font-semibold text-slate-900">
                      {{ data.labelRw(rw.nomor) }} · {{ rw.namaKetua }}
                    </p>
                    <p class="text-sm text-slate-500">{{ rw.telepon || '—' }}</p>
                  </div>
                  <button
                    type="button"
                    class="btn-primary !py-2 !px-3 text-sm"
                    (click)="kirimWaDenganPdf(rw)"
                  >
                    @if (data.sudahKirimUndanganKeRw(rw.id)) {
                      Kirim ulang
                    } @else {
                      Kirim teks + PDF
                    }
                  </button>
                </li>
              }
            </ul>

            @if (data.undanganPsnKiriman().length) {
              <h4 class="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Riwayat kirim (demo)
              </h4>
              <ul class="mt-2 max-h-40 space-y-1.5 overflow-y-auto text-sm">
                @for (k of data.undanganPsnKiriman(); track k.id) {
                  <li class="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2">
                    <span class="font-semibold text-slate-900">{{ k.labelRw }}</span>
                    · {{ k.namaKetua }}
                    <span class="text-emerald-800">
                      · teks{{ k.denganPdf ? ' + PDF' : '' }}
                    </span>
                    <span class="block text-xs text-slate-500">{{ formatWaktu(k.dikirimAt) }}</span>
                  </li>
                }
              </ul>
            }
          } @else {
            @if (rwSekarang(); as now) {
              <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p class="text-xs font-bold uppercase tracking-wide text-emerald-800">
                  Langkah {{ antrianIdx()! + 1 }} / {{ rwTargets().length }}
                </p>
                <p class="mt-1 text-lg font-bold text-slate-900">
                  {{ data.labelRw(now.nomor) }} · {{ now.namaKetua }}
                </p>
                <p class="text-sm text-slate-600">{{ now.telepon || '—' }}</p>
                <p class="mt-2 text-xs text-slate-500">
                  1) Buka chat + unduh PDF → 2) Kirim teks di WA → 3) 📎 lampirkan PDF → 4) Lanjut.
                </p>
                <div class="mt-3 grid gap-2">
                  <button
                    type="button"
                    class="btn-primary"
                    (click)="kirimWaDenganPdf(now); sudahBuka.set(true)"
                  >
                    Buka WA + unduh PDF
                  </button>
                  <button
                    type="button"
                    class="btn-primary"
                    [disabled]="!sudahBuka()"
                    (click)="lanjutBlast()"
                  >
                    @if (antrianIdx()! + 1 < rwTargets().length) {
                      Sudah kirim · Lanjut berikutnya
                    } @else {
                      Selesai
                    }
                  </button>
                  <button type="button" class="btn-secondary" (click)="lewatiBlast()">Lewati</button>
                </div>
              </div>
            }
          }

          <button type="button" class="btn-secondary mt-4 w-full" (click)="tutupUndangan()">Tutup</button>
        </div>
      </div>
    }
  `,
})
export class PsnListComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly rwId = signal('');
  readonly rtId = signal('');
  readonly jentik = signal<FilterJentik>('');
  readonly foto = signal<FilterFoto>('');

  readonly bukaUndangan = signal(false);
  readonly antrianIdx = signal<number | null>(null);
  readonly sudahBuka = signal(false);
  readonly draft = this.data.undanganPsnDraft;

  readonly lockRw = computed(() => this.auth.hasRole('KOORD_RW') || this.auth.hasRole('OP_RT'));
  readonly lockRt = computed(() => this.auth.hasRole('OP_RT'));

  readonly rwOptions = computed(() => {
    const user = this.auth.currentUser();
    let list = this.data.rws();
    if (user?.role === 'KOORD_RW' && user.rwId) list = list.filter((r) => r.id === user.rwId);
    if (user?.role === 'OP_RT' && user.rwId) list = list.filter((r) => r.id === user.rwId);
    return [...list].sort((a, b) => this.cmpNomor(a.nomor, b.nomor));
  });

  readonly rtOptions = computed(() => {
    const user = this.auth.currentUser();
    let list = this.data.rts();
    if (user?.role === 'OP_RT' && user.rtId) list = list.filter((r) => r.id === user.rtId);
    else if (user?.role === 'KOORD_RW' && user.rwId) list = list.filter((r) => r.rwId === user.rwId);
    const rw = this.rwId() || (user?.role === 'KOORD_RW' ? user.rwId : '') || '';
    if (rw) list = list.filter((r) => r.rwId === rw);
    return [...list].sort((a, b) => this.cmpNomor(a.nomor, b.nomor));
  });

  readonly rows = computed(() => {
    const user = this.auth.currentUser();
    let list = [...this.data.laporanPsns()];

    if (user?.role === 'OP_RT' && user.rtId) list = list.filter((l) => l.rtId === user.rtId);
    else if (user?.role === 'KOORD_RW' && user.rwId) {
      const ids = this.data
        .rts()
        .filter((r) => r.rwId === user.rwId)
        .map((r) => r.id);
      list = list.filter((l) => ids.includes(l.rtId));
    }

    const rw = this.rwId();
    const rt = this.rtId();
    if (rw) {
      const ids = this.data
        .rts()
        .filter((r) => r.rwId === rw)
        .map((r) => r.id);
      list = list.filter((l) => ids.includes(l.rtId));
    }
    if (rt) list = list.filter((l) => l.rtId === rt);

    const j = this.jentik();
    if (j) list = list.filter((l) => l.statusJentik === j);

    const f = this.foto();
    if (f === 'ADA') list = list.filter((l) => !!l.fotoName);
    if (f === 'TANPA') list = list.filter((l) => !l.fotoName);

    // Urut: RW 01 → RT di dalamnya → RW berikutnya; dalam RT: terbaru dulu
    const rwNomor = new Map(this.data.rws().map((r) => [r.id, r.nomor]));
    const rtMeta = new Map(this.data.rts().map((r) => [r.id, r]));
    return list.sort((a, b) => {
      const rtA = rtMeta.get(a.rtId);
      const rtB = rtMeta.get(b.rtId);
      const rwCmp = this.cmpNomor(
        rwNomor.get(rtA?.rwId ?? '') ?? '',
        rwNomor.get(rtB?.rwId ?? '') ?? '',
      );
      if (rwCmp) return rwCmp;
      const rtCmp = this.cmpNomor(rtA?.nomor ?? '', rtB?.nomor ?? '');
      if (rtCmp) return rtCmp;
      return b.createdAt.localeCompare(a.createdAt);
    });
  });

  readonly positifCount = computed(() => this.rows().filter((r) => r.statusJentik === 'ADA').length);

  readonly rwTargets = computed(() =>
    [...this.data.rws()].sort(
      (a, b) => Number.parseInt(a.nomor, 10) - Number.parseInt(b.nomor, 10) || a.nomor.localeCompare(b.nomor, 'id'),
    ),
  );

  /** RW 07 — nomor uji WA staf (081295843474). */
  readonly rwUji = computed(() => this.data.rws().find((r) => r.id === 'rw-7') ?? null);

  readonly rwSekarang = computed(() => {
    const idx = this.antrianIdx();
    if (idx === null) return null;
    return this.rwTargets()[idx] ?? null;
  });

  /** Urut numerik: 01 < 02 < 11. */
  cmpNomor(a: string, b: string): number {
    return Number.parseInt(a, 10) - Number.parseInt(b, 10) || a.localeCompare(b, 'id');
  }

  onRwChange(value: string): void {
    this.rwId.set(value);
    this.rtId.set('');
  }

  bukaPanelUndangan(): void {
    this.antrianIdx.set(null);
    this.sudahBuka.set(false);
    this.bukaUndangan.set(true);
  }

  tutupUndangan(): void {
    this.bukaUndangan.set(false);
    this.antrianIdx.set(null);
    this.sudahBuka.set(false);
  }

  mulaiBlastBerurutan(): void {
    if (!this.rwTargets().length) return;
    this.antrianIdx.set(0);
    this.sudahBuka.set(false);
  }

  lanjutBlast(): void {
    const idx = this.antrianIdx();
    if (idx === null) return;
    const next = idx + 1;
    if (next >= this.rwTargets().length) {
      this.tutupUndangan();
      return;
    }
    this.antrianIdx.set(next);
    this.sudahBuka.set(false);
  }

  lewatiBlast(): void {
    this.sudahBuka.set(true);
    this.lanjutBlast();
  }

  private toWaPhone(raw?: string): string {
    return (raw || '').replace(/\D/g, '').replace(/^0/, '62');
  }

  onUploadPdf(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.data.showToast('Mohon unggah file PDF.');
      return;
    }
    const user = this.auth.currentUser();
    this.data.uploadUndanganPsnPdf(file, user?.name || 'Staf kelurahan');
    (event.target as HTMLInputElement).value = '';
  }

  /**
   * Kirim undangan = teks + PDF (satu paket).
   * Demo (DEMO_WA_ME): buka chat + unduh PDF → staf 📎 di WA.
   * Nanti (WA_BUSINESS_API): ganti badan method ini ke panggilan API dokumen.
   */
  kirimWaDenganPdf(rw: Rw): void {
    const pdf = this.data.undanganPsnPdf();
    if (!pdf?.objectUrl) {
      this.data.showToast('Upload PDF undangan dulu supaya teks + PDF ikut satu paket.');
      return;
    }

    const user = this.auth.currentUser();
    this.data.catatKirimUndanganPsn({
      rw,
      dikirimOleh: user?.name || 'Staf kelurahan',
    });

    // --- DEMO: siapkan PDF ke Unduhan + buka chat teks ---
    // Produksi API: kirim document message + text template ke nomor RW.
    const a = document.createElement('a');
    a.href = pdf.objectUrl;
    a.download = pdf.fileName || 'undangan-psn.pdf';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.open(this.waUndanganLink(rw), '_blank', 'noopener');
  }

  waUndanganLink(rw: Rw): string {
    const u = this.draft();
    const pdf = this.data.undanganPsnPdf();
    const labelRw = this.data.labelRw(rw.nomor);
    const lampiran = pdf
      ? `Bersama ini kami lampirkan surat undangan resmi dalam bentuk PDF (${pdf.fileName}).`
      : `Surat undangan resmi PDF menyusul.`;

    const text =
      `Assalamu'alaikum warahmatullahi wabarakatuh.\n\n` +
      `Yth. Bapak/Ibu ${rw.namaKetua}\n` +
      `Ketua ${labelRw}\n\n` +
      `Dengan hormat,\n` +
      `Perkenankan kami dari Kelurahan Rawajati menyampaikan undangan pertemuan ` +
      `PSN Jumantik se-Kelurahan Rawajati (No. ${u.nomorSurat}), sebagai berikut:\n\n` +
      `Hari/tanggal : ${u.hariTanggal}\n` +
      `Waktu        : ${u.jam}\n` +
      `Tempat       : ${u.tempat}\n` +
      `Agenda       : ${u.agenda}\n\n` +
      `${lampiran}\n\n` +
      `Mohon kehadiran Bapak/Ibu tepat waktu. Apabila berhalangan hadir, ` +
      `dimohon menugaskan perwakilan dari pengurus RW.\n\n` +
      `Atas perhatian dan kerja samanya, kami ucapkan terima kasih.\n\n` +
      `Hormat kami,\nKelurahan Rawajati`;

    const phone = this.toWaPhone(rw.telepon);
    const msg = encodeURIComponent(text);
    return phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
  }

  formatWaktu(iso: string): string {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  labelKategoriLaporan(row: { rumahWargaId?: string; kategoriBangunan?: string }): string {
    if (row.kategoriBangunan) {
      return this.data.labelKategori(row.kategoriBangunan as 'RUMAH_WARGA' | 'KOS_KONTRAKAN' | 'FASUM');
    }
    if (!row.rumahWargaId) return 'Mandiri';
    const rumah = this.data.rumahWargas().find((r) => r.id === row.rumahWargaId);
    return rumah ? this.data.labelKategori(rumah.kategori) : '—';
  }

  labelBangunan(row: { rumahWargaId?: string; labelBangunan?: string }): string {
    if (row.labelBangunan?.trim()) return row.labelBangunan.trim();
    if (!row.rumahWargaId) return 'Laporan mandiri';
    const rumah = this.data.rumahWargas().find((r) => r.id === row.rumahWargaId);
    if (!rumah) return '—';
    return `No. ${rumah.noRumah} · ${rumah.namaKk}`;
  }

  verifikasiMandiri(id: string): void {
    this.data.updateStatusLaporan(id, 'SUBMITTED', 'Diverifikasi Operator RT');
  }
}
