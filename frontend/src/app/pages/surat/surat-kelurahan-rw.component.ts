import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { SuratKeluar } from '../../core/models';

/**
 * Inbox surat dari kelurahan — Ketua RW & Ketua RT.
 * Dibuat Lurah/Sekkel di Surat Keluar, lalu tampil di portal penerima.
 * LMK tidak lewat portal ini (WA langsung dari kelurahan).
 */
@Component({
  selector: 'app-surat-kelurahan-rw',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5">
      <header>
        <h1 class="page-title">Surat dari Kelurahan</h1>
        <p class="mt-1 text-sm font-semibold text-blue-700">
          @if (auth.isKetuaRt()) {
            Portal Ketua RT — undangan / edaran langsung dari Lurah atau Sekkel
          } @else if (auth.hasRole('KOORD_RW')) {
            {{ labelRw() }} — undangan / edaran dari Lurah atau Sekkel
          } @else {
            Pantauan sebaran surat kelurahan
          }
        </p>
        <p class="page-sub">
          Terintegrasi dari menu Surat Keluar (login Lurah/Sekkel). Preview PDF, lalu teruskan bila perlu.
          LMK diundang langsung dari kelurahan (bukan lewat RW).
        </p>
      </header>

      <section class="space-y-3">
        @for (s of daftar(); track s.id) {
          <article class="card !p-4 space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ s.nomorSurat }}</p>
                <h2 class="mt-1 text-base font-extrabold text-slate-900">{{ s.perihal }}</h2>
                <p class="mt-1 text-sm text-slate-600">Tujuan: {{ s.tujuan }}</p>
                <p class="mt-1 text-xs text-slate-500">
                  Tanggal {{ s.tanggalSurat }} · dari {{ s.dibuatOleh }}
                  @if (s.fileName) {
                    · {{ s.fileName }}
                  }
                </p>
              </div>
              <span class="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                {{ s.kode }}
              </span>
            </div>

            <div class="flex flex-wrap gap-2">
              @if (s.fileUrl) {
                <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="togglePreview(s)">
                  {{ previewId() === s.id ? 'Tutup preview PDF' : 'Lihat preview PDF' }}
                </button>
                <a class="btn-secondary !py-2 !px-3 text-sm" [href]="s.fileUrl" target="_blank" rel="noopener">
                  Buka tab baru
                </a>
              }
              @if (auth.hasRole('KOORD_RW')) {
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="shareKeRt(s)">
                  Teruskan ke Ketua RT
                </button>
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="shareGrupBod(s)">
                  Teks grup BOD
                </button>
              }
            </div>

            @if (previewId() === s.id && safePdfUrl()) {
              <div class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <iframe
                  class="h-[36rem] w-full bg-white"
                  title="Preview PDF surat kelurahan"
                  [src]="safePdfUrl()"
                ></iframe>
              </div>
            }
          </article>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            Belum ada surat dari kelurahan untuk peran Anda.
          </p>
        }
      </section>
    </div>
  `,
})
export class SuratKelurahanRwComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly previewId = signal<string | null>(null);
  readonly safePdfUrl = signal<SafeResourceUrl | null>(null);

  readonly rwId = computed(() => this.auth.currentUser()?.rwId || 'rw-7');
  readonly labelRw = computed(() => {
    const rw = this.data.getRw(this.rwId());
    return rw ? this.data.labelRw(rw.nomor) : 'RW';
  });

  readonly daftar = computed(() => {
    const u = this.auth.currentUser();
    if (this.auth.isKetuaRt()) return this.data.suratDariKelurahanUntuk('RT', u);
    if (this.auth.hasRole('KOORD_RW')) return this.data.suratDariKelurahanUntuk('RW', u);
    // Staf: lihat semua undangan
    return this.data.suratKeluarsSorted().filter((s) => s.kode === 'UND' || (s.penerimaJenis || []).length > 0);
  });

  togglePreview(s: SuratKeluar): void {
    if (this.previewId() === s.id) {
      this.previewId.set(null);
      this.safePdfUrl.set(null);
      return;
    }
    if (!s.fileUrl) {
      this.data.showToast('PDF surat belum tersedia.');
      return;
    }
    this.previewId.set(s.id);
    this.safePdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(s.fileUrl));
  }

  private teksSurat(s: SuratKeluar): string {
    return (
      `Yth. Bapak/Ibu,\n\n` +
      `Surat dari ${this.data.kelurahan.nama}:\n` +
      `No. ${s.nomorSurat}\n` +
      `Perihal: ${s.perihal}\n` +
      `Tanggal: ${s.tanggalSurat}\n` +
      `Tujuan: ${s.tujuan}\n` +
      (s.fileName ? `File: ${s.fileName}\n` : '') +
      `\nMohon diteruskan / dihadiri sesuai undangan.\n` +
      `— ${this.auth.currentUser()?.name || 'Ketua RW'} (${this.labelRw()})`
    );
  }

  shareKeRt(s: SuratKeluar): void {
    const rts = this.data.rts().filter((r) => r.rwId === this.rwId());
    const teks = encodeURIComponent(this.teksSurat(s));
    let dibuka = 0;
    for (const rt of rts) {
      const digits = (rt.telepon || '').replace(/\D/g, '').replace(/^0/, '62');
      if (!digits) continue;
      window.open(`https://wa.me/${digits}?text=${teks}`, '_blank', 'noopener');
      dibuka += 1;
      if (dibuka >= 3) break;
    }
    this.data.showToast(
      dibuka
        ? `Membuka WA ${dibuka} Ketua RT (demo).`
        : 'Nomor WA Ketua RT belum lengkap.',
    );
  }

  shareGrupBod(s: SuratKeluar): void {
    void navigator.clipboard?.writeText(this.teksSurat(s));
    this.data.showToast('Teks disalin — tempel ke grup BOD / WA RT.');
  }
}
