import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { KodeSuratKeluar } from '../../core/models';

@Component({
  selector: 'app-surat-keluar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="page-title">Register Nomor Surat Keluar</h1>
        <p class="mt-1 text-sm font-semibold text-blue-700">Kelurahan Rawajati · anti-dobel nomor (demo)</p>
        <p class="page-sub">
          Ambil nomor urut otomatis sebelum surat dikirim. Mockup lokal — production nanti di backend.
        </p>
      </header>

      <section class="grid gap-4 sm:grid-cols-3">
        <article class="card">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Surat tahun ini</p>
          <p class="mt-2 text-3xl font-extrabold text-slate-900">{{ jumlahTahunIni() }}</p>
        </article>
        <article class="card">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Nomor berikutnya</p>
          <p class="mt-2 break-all text-lg font-extrabold text-blue-800">{{ previewNomor }}</p>
        </article>
        <article class="card">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Format</p>
          <p class="mt-2 text-sm font-semibold text-slate-700">000/KODE/RWJ/Bulan/Tahun</p>
          <p class="mt-1 text-xs text-slate-500">Contoh: 009/UND/RWJ/XI/2026</p>
        </article>
      </section>

      <section class="card !p-5">
        <h2 class="text-lg font-bold text-slate-900">Ambil / catat nomor baru</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label class="field-label" for="sk-kode">Jenis surat</label>
            <select id="sk-kode" class="field-input" [(ngModel)]="form.kode">
              @for (opt of kodeOptions; track opt.id) {
                <option [value]="opt.id">{{ opt.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label" for="sk-tgl">Tanggal surat</label>
            <input id="sk-tgl" class="field-input" type="date" [(ngModel)]="form.tanggalSurat" />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label" for="sk-perihal">Perihal</label>
            <input
              id="sk-perihal"
              class="field-input"
              [(ngModel)]="form.perihal"
              placeholder="Contoh: Undangan rapat koordinasi RT/RW"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label" for="sk-tujuan">Tujuan</label>
            <input
              id="sk-tujuan"
              class="field-input"
              [(ngModel)]="form.tujuan"
              placeholder="Contoh: Camat Pancoran / Ketua RW 07"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label" for="sk-catatan">Catatan (opsional)</label>
            <input id="sk-catatan" class="field-input" [(ngModel)]="form.catatan" placeholder="Via WA, diantar, dll." />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label" for="sk-file">Arsip PDF (opsional)</label>
            <input
              id="sk-file"
              class="field-input"
              type="file"
              accept="application/pdf,.pdf"
              (change)="onFile($event)"
            />
            @if (fileName()) {
              <p class="mt-1 text-sm font-semibold text-slate-800">{{ fileName() }}</p>
            }
          </div>
        </div>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm text-slate-600">
            Preview nomor: <strong class="text-blue-800">{{ previewNomor }}</strong>
          </p>
          <button type="button" class="btn-primary" (click)="simpan()">Catat nomor surat</button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-bold text-slate-900">Buku register ({{ data.suratKeluarsSorted().length }})</h2>
        @for (row of data.suratKeluarsSorted(); track row.id) {
          <article class="card !p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="font-mono text-sm font-bold text-blue-800">{{ row.nomorSurat }}</p>
                <h3 class="mt-1 text-base font-bold text-slate-900">{{ row.perihal }}</h3>
                <p class="mt-1 text-sm text-slate-600">
                  {{ data.labelKodeSurat(row.kode) }} · {{ row.tanggalSurat }} · kepada {{ row.tujuan }}
                </p>
                <p class="mt-1 text-xs text-slate-500">Dicatat oleh {{ row.dibuatOleh }}</p>
                @if (row.catatan) {
                  <p class="mt-1 text-sm text-slate-500">{{ row.catatan }}</p>
                }
              </div>
              <div class="flex flex-wrap gap-2">
                @if (row.fileUrl) {
                  <a class="btn-secondary text-sm" [href]="row.fileUrl" target="_blank" rel="noopener">Buka PDF</a>
                }
                <button type="button" class="text-sm font-bold text-rose-600" (click)="hapus(row.id)">Hapus</button>
              </div>
            </div>
          </article>
        } @empty {
          <p class="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Belum ada surat tercatat.
          </p>
        }
      </section>
    </div>
  `,
})
export class SuratKeluarComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly kodeOptions: Array<{ id: KodeSuratKeluar; label: string }> = [
    { id: 'UND', label: 'UND — Undangan' },
    { id: 'KET', label: 'KET — Keterangan' },
    { id: 'LAP', label: 'LAP — Laporan' },
    { id: 'DIS', label: 'DIS — Edaran / disposisi keluar' },
    { id: 'LAIN', label: 'LAIN — Lainnya' },
  ];

  form = {
    kode: 'UND' as KodeSuratKeluar,
    perihal: '',
    tujuan: '',
    tanggalSurat: new Date().toISOString().slice(0, 10),
    catatan: '',
  };

  file: File | null = null;
  readonly fileName = signal<string | null>(null);

  readonly jumlahTahunIni = computed(() => {
    const y = new Date().getFullYear();
    return this.data.suratKeluars().filter((s) => s.tahun === y).length;
  });

  get previewNomor(): string {
    return this.data.previewNomorSurat(
      this.form.kode,
      this.form.tanggalSurat || new Date().toISOString().slice(0, 10),
    );
  }

  onFile(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.file = f;
    this.fileName.set(f?.name ?? null);
  }

  simpan(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const row = this.data.addSuratKeluar({
      ...this.form,
      dibuatOleh: user.name,
      file: this.file,
    });
    if (!row) return;
    this.form = {
      kode: 'UND',
      perihal: '',
      tujuan: '',
      tanggalSurat: new Date().toISOString().slice(0, 10),
      catatan: '',
    };
    this.file = null;
    this.fileName.set(null);
  }

  hapus(id: string): void {
    this.data.hapusSuratKeluar(id);
  }
}
