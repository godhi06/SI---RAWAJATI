import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { CameraCaptureComponent } from '../../shared/camera-capture.component';
import { LaporanKeuanganRt, TingkatLaporanDaop } from '../../core/models';

interface DaopBulanCol {
  bulan: number;
  tahun: number;
  label: string;
  short: string;
}

/** Satu baris matriks = kewajiban Ketua RT atau Ketua RW. */
interface DaopEntityRow {
  key: string;
  tingkat: TingkatLaporanDaop;
  rtId?: string;
  rwId: string;
  wilayah: string;
  ketua: string;
  telepon: string;
  byBulan: Record<string, LaporanKeuanganRt | undefined>;
  belumCount: number;
  layakBlast: boolean;
}

@Component({
  selector: 'app-daop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CameraCaptureComponent],
  template: `
    <div class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">
            @if (auth.hasRole('OP_RT')) {
              Laporan DAOP RT
            } @else if (auth.hasRole('KOORD_RW') && !auth.hasRole('ADMIN_KEL')) {
              Laporan DAOP RT &amp; RW
            } @else {
              Pantauan DAOP RT / RW
            }
          </h1>
          <p class="page-sub">
            @if (auth.hasRole('OP_RT')) {
              Setor DAOP bulanan RT: unduh Word → isi &amp; TTD → cetak stempel basah → upload scan.
            } @else if (auth.hasRole('KOORD_RW') && !auth.hasRole('ADMIN_KEL')) {
              Ketua RW juga wajib setor DAOP sendiri, plus pantau RT di wilayah. Blast WA jika nunggak ≥3 bulan.
            } @else {
              Kewajiban DAOP bulanan untuk <strong>Ketua RT</strong> dan
              <strong>Ketua RW</strong>. Blast WA jika belum setor ≥3 bulan.
            }
          </p>
        </div>
        @if (!auth.hasRole('OP_RT') && blastTargets().length) {
          <button type="button" class="btn-primary" (click)="bukaPanelBlast()">
            Blast WA · {{ blastTargets().length }} nunggak
          </button>
        }
      </header>

      @if (!auth.hasRole('OP_RT')) {
        <section class="grid gap-4 sm:grid-cols-3">
          <article class="card">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Layak Blast (≥3 bln)</p>
            <p class="mt-2 text-4xl font-extrabold text-rose-600">{{ blastTargets().length }}</p>
            <p class="mt-2 text-sm text-slate-500">
              {{ blastRtCount() }} RT · {{ blastRwCount() }} RW
            </p>
          </article>
          <article class="card">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Masih nunggak (1–2 bln)</p>
            <p class="mt-2 text-4xl font-extrabold text-amber-600">{{ nunggakRingan().length }}</p>
            <p class="mt-2 text-sm text-slate-500">Belum perlu blast massal</p>
          </article>
          <article class="card">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Lunas 3 bulan</p>
            <p class="mt-2 text-4xl font-extrabold text-emerald-600">{{ lunasCount() }}</p>
            <p class="mt-2 text-sm text-slate-500">RT + RW sudah arsip</p>
          </article>
        </section>

        <p class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <strong>Aturan:</strong> tiap baris = 1 Ketua RT <em>atau</em> 1 Ketua RW. Baris RW ditandai biru.
          Blast WA jika belum setor {{ bulanCols().length }} bulan. Klik sel bulan untuk detail &amp; lihat scan.
          Klik sel bulan = detail/form. Panah di atas tabel = geser rentang 3 bulan.
          Tombol <strong>Arsip</strong> = arsip lengkap per RT/RW (tahun &amp; halaman).
        </p>
      }

      <section class="card space-y-3 !p-4">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="field-label" for="daop-cari">Cari RT / RW / Ketua</label>
            <input
              id="daop-cari"
              type="search"
              class="field-input"
              placeholder="Contoh: RT001, RW 07, Agus…"
              [ngModel]="cari()"
              (ngModelChange)="cari.set($event)"
            />
          </div>
          <div>
            <label class="field-label" for="daop-rw">Filter RW</label>
            <select
              id="daop-rw"
              class="field-input"
              [ngModel]="rwId()"
              (ngModelChange)="onRwChange($event)"
              [disabled]="lockRw()"
            >
              <option value="">Semua RW</option>
              @for (rw of rwOptions(); track rw.id) {
                <option [value]="rw.id">{{ data.labelRw(rw.nomor) }} · {{ rw.namaKetua }}</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label" for="daop-rt">Filter RT</label>
            <select
              id="daop-rt"
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
            <label class="field-label" for="daop-tingkat">Tingkat</label>
            <select
              id="daop-tingkat"
              class="field-input"
              [ngModel]="tingkatFilter()"
              (ngModelChange)="tingkatFilter.set($event)"
            >
              <option value="">RT + RW</option>
              <option value="RT">Hanya Ketua RT</option>
              <option value="RW">Hanya Ketua RW</option>
            </select>
          </div>
        </div>
        <p class="text-sm text-slate-500">
          Urutan: RW 01 (baris Ketua RW dulu, lalu RT-nya) → RW berikutnya.
          @if (cari().trim()) {
            · Hasil: <strong class="text-slate-800">{{ matrixRows().length }}</strong>
          }
        </p>
      </section>

      @if (!auth.hasRole('OP_RT')) {
        <div class="card !overflow-x-auto !p-0">
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3"
          >
            <p class="text-sm font-semibold text-slate-700">
              Rentang matriks: <span class="text-blue-800">{{ labelMatriksRange() }}</span>
            </p>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 disabled:opacity-40"
                [disabled]="!bisaMatriksLebihLama()"
                (click)="geserMatriksBulan(-1)"
                title="Bulan lebih lama"
              >
                ◀
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40"
                [disabled]="!bisaMatriksLebihBaru()"
                (click)="matriksKeTerbaru()"
                title="Ke 3 bulan terbaru"
              >
                Terbaru
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 disabled:opacity-40"
                [disabled]="!bisaMatriksLebihBaru()"
                (click)="geserMatriksBulan(1)"
                title="Bulan lebih baru"
              >
                ▶
              </button>
            </div>
          </div>
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-200 bg-white text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="sticky left-0 z-10 bg-white px-4 py-3 font-bold">Wilayah / Ketua</th>
                @for (col of bulanCols(); track colKey(col)) {
                  <th class="px-3 py-3 text-center font-bold">{{ col.short }}</th>
                }
                <th class="px-3 py-3 text-center font-bold">Nunggak</th>
                <th class="px-4 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              @for (row of matrixRows(); track row.key) {
                <tr
                  class="border-b border-slate-100"
                  [class.bg-rose-50]="row.layakBlast"
                  [class.bg-sky-50]="!row.layakBlast && row.tingkat === 'RW'"
                >
                  <td
                    class="sticky left-0 z-10 px-4 py-3"
                    [class.bg-rose-50]="row.layakBlast"
                    [class.bg-sky-50]="!row.layakBlast && row.tingkat === 'RW'"
                    [class.bg-white]="!row.layakBlast && row.tingkat === 'RT'"
                  >
                    <p class="font-bold text-slate-900">{{ row.wilayah }}</p>
                    <p class="text-xs text-slate-500">
                      {{ row.ketua }}
                      <span
                        class="ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        [class.bg-sky-100]="row.tingkat === 'RW'"
                        [class.text-sky-800]="row.tingkat === 'RW'"
                        [class.bg-slate-100]="row.tingkat === 'RT'"
                        [class.text-slate-600]="row.tingkat === 'RT'"
                      >
                        {{ row.tingkat }}
                      </span>
                    </p>
                  </td>
                  @for (col of bulanCols(); track colKey(col)) {
                    <td class="px-2 py-2 text-center">
                      @if (row.byBulan[colKey(col)]; as cell) {
                        <button
                          type="button"
                          class="inline-flex min-w-[4.75rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition hover:ring-2 hover:ring-blue-200"
                          [class]="cellTone(cell.status)"
                          (click)="pilihCell(cell)"
                          [title]="
                            cell.scanFileName
                              ? 'Klik untuk lihat dokumen upload'
                              : data.labelStatusKeuanganRt(cell.status)
                          "
                        >
                          <span>{{ cellShort(cell.status) }}</span>
                          @if (cell.status === 'SUDAH_UPLOAD_TTD') {
                            <span class="text-[10px] font-bold opacity-80">📄 Form+TTD</span>
                          }
                        </button>
                      } @else {
                        <span class="text-xs text-slate-300">—</span>
                      }
                    </td>
                  }
                  <td class="px-3 py-3 text-center">
                    @if (row.layakBlast) {
                      <span class="badge-danger">{{ row.belumCount }} bln</span>
                    } @else if (row.belumCount > 0) {
                      <span class="badge-warn">{{ row.belumCount }} bln</span>
                    } @else {
                      <span class="badge-ok">Lunas</span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-col gap-1.5">
                      <button
                        type="button"
                        class="btn-secondary !inline-flex !px-3 !py-2 text-xs"
                        (click)="bukaArsipEntity(row)"
                        title="Arsip lengkap semua tahun/bulan"
                      >
                        Arsip
                      </button>
                      @if (row.layakBlast) {
                        <a
                          class="btn-primary !inline-flex !px-3 !py-2 text-xs"
                          [href]="waBlastLink(row)"
                          target="_blank"
                          rel="noopener"
                        >
                          WA Ketua {{ row.tingkat }}
                        </a>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td class="px-4 py-8 text-center text-slate-500" [attr.colspan]="bulanCols().length + 3">
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Kartu setor: OP_RT (RT) atau KOORD_RW untuk DAOP RW sendiri -->
      @if (auth.hasRole('OP_RT') || showKartuSetorRw()) {
        <div class="space-y-3">
          @if (auth.hasRole('OP_RT')) {
            <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <strong>Akses Ketua RT:</strong> unduh form Word → isi &amp; TTD Ketua + Bendahara di Word →
              cetak kertas untuk <em>stempel basah</em> → upload scan dari HP, atau datang ke kelurahan
              dibantu staf.
            </div>
          }
          @if (showKartuSetorRw()) {
            <div class="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              <strong>Akses Ketua RW:</strong> setor DAOP RW sendiri (kartu di bawah), pantau RT di matriks atas.
            </div>
          }

          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2
              class="text-sm font-bold uppercase tracking-wide"
              [class]="auth.hasRole('OP_RT') ? 'text-emerald-800' : 'text-sky-800'"
            >
              @if (auth.hasRole('OP_RT')) {
                Kewajiban DAOP · {{ data.labelWilayah(auth.currentUser()?.rtId || '') }}
              } @else {
                Kewajiban DAOP Ketua RW
              }
            </h2>
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 disabled:opacity-40"
                [disabled]="!bisaKartuLebihLama()"
                (click)="geserKartuBulan(1)"
                title="Bulan lebih lama"
              >
                ◀
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40"
                [disabled]="!bisaKartuLebihBaru()"
                (click)="kartuKeTerbaru()"
                title="Ke bulan terbaru"
              >
                Terbaru
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 disabled:opacity-40"
                [disabled]="!bisaKartuLebihBaru()"
                (click)="geserKartuBulan(-1)"
                title="Bulan lebih baru"
              >
                ▶
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-500">
            Urutan terbaru dulu · menampilkan {{ labelKartuRange() }}
            @if (kartuSemua().length > kartuWindowSize) {
              · geser ◀ untuk history sebelumnya
            }
          </p>

          @for (row of kartuRows(); track row.id) {
            <article class="card !p-4" [class.ring-1]="row.tingkat === 'RW'" [class.ring-sky-200]="row.tingkat === 'RW'">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold text-slate-500">
                    {{ row.periodeLabel }}
                    ·
                    {{ row.tingkat === 'RW' ? 'DAOP RW' : 'DAOP RT' }}
                  </p>
                  <h2 class="text-lg font-bold text-slate-900">
                    {{ data.labelJenisKeuanganRt(row.jenis) }} · {{ data.labelDaopWilayah(row) }}
                  </h2>
                  <p class="mt-1 text-sm text-slate-600">
                    Pemasukan {{ data.formatRp(row.pemasukan) }} · Pengeluaran
                    {{ data.formatRp(row.pengeluaran) }} · Saldo {{ data.formatRp(row.saldo) }}
                  </p>
                  <p class="mt-2">
                    <span [class]="statusBadge(row.status)">{{ data.labelStatusKeuanganRt(row.status) }}</span>
                  </p>
                </div>
                <div class="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[12rem]">
                  <a class="btn-secondary !py-2.5 text-center text-sm" [routerLink]="['/app/daop/cetak', row.id]">
                    Unduh Word
                  </a>
                  @if (row.status !== 'SUDAH_UPLOAD_TTD') {
                    <button
                      type="button"
                      class="btn-primary !py-2.5 text-sm"
                      (click)="mulaiUpload(row, 'UPLOAD_MANDIRI')"
                    >
                      Upload Scan Sendiri
                    </button>
                  } @else {
                    <button type="button" class="btn-secondary !py-2.5 text-sm" (click)="pilihCell(row)">
                      Lihat dokumen upload
                    </button>
                  }
                </div>
              </div>
            </article>
          } @empty {
            <div class="card text-center text-slate-500">Belum ada kewajiban DAOP.</div>
          }
        </div>
      }
    </div>

    @if (selected(); as sel) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center"
        (click)="selected.set(null)"
      >
        <div
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-base font-bold text-slate-900">
            {{ data.labelDaopWilayah(sel) }} · {{ sel.periodeLabel }}
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ data.labelDaopKetua(sel) }} · {{ data.labelStatusKeuanganRt(sel.status) }} · Saldo
            {{ data.formatRp(sel.saldo) }}
          </p>

          @if (sel.status === 'SUDAH_UPLOAD_TTD') {
            <div class="mt-3 overflow-hidden rounded-xl border border-slate-300 bg-white">
              <p class="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                Dokumen setor · form cetak + TTD basah
              </p>
              <!-- Preview lembar laporan (bukan foto lapangan) -->
              <div class="space-y-3 px-4 py-4 text-sm text-slate-800">
                <div class="text-center">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Kelurahan Rawajati
                  </p>
                  <p class="mt-1 text-sm font-extrabold uppercase">
                    {{ data.labelJenisKeuanganRt(sel.jenis) }}
                    {{ sel.tingkat === 'RW' ? 'TINGKAT RW' : 'TINGKAT RT' }}
                  </p>
                  <p class="mt-0.5 text-xs text-slate-600">{{ sel.periodeLabel }} · {{ data.labelDaopWilayah(sel) }}</p>
                </div>
                <table class="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td class="border border-slate-300 px-2 py-1.5 font-semibold">Pemasukan</td>
                      <td class="border border-slate-300 px-2 py-1.5 text-right">
                        {{ data.formatRp(sel.pemasukan) }}
                      </td>
                    </tr>
                    <tr>
                      <td class="border border-slate-300 px-2 py-1.5 font-semibold">Pengeluaran</td>
                      <td class="border border-slate-300 px-2 py-1.5 text-right">
                        {{ data.formatRp(sel.pengeluaran) }}
                      </td>
                    </tr>
                    <tr class="bg-slate-50">
                      <td class="border border-slate-300 px-2 py-1.5 font-bold">Saldo</td>
                      <td class="border border-slate-300 px-2 py-1.5 text-right font-bold">
                        {{ data.formatRp(sel.saldo) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="grid grid-cols-2 gap-4 pt-4 text-center text-[11px]">
                  <div>
                    <p class="text-slate-500">
                      {{ sel.tingkat === 'RW' ? 'Bendahara RW' : 'Bendahara RT' }}
                    </p>
                    <p class="mt-6 border-t border-slate-400 pt-1 font-semibold text-slate-800">
                      (TTD basah)
                    </p>
                  </div>
                  <div>
                    <p class="text-slate-500">
                      {{ sel.tingkat === 'RW' ? 'Ketua RW' : 'Ketua RT' }}
                    </p>
                    <p class="mt-6 border-t border-slate-400 pt-1 font-semibold text-slate-800">
                      {{ data.labelDaopKetua(sel) }}
                    </p>
                    <p class="text-[10px] text-emerald-700">✓ TTD basah terunggah</p>
                  </div>
                </div>
              </div>
              <div class="space-y-0.5 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p class="font-medium text-slate-800">📎 {{ sel.scanFileName || 'Lembar DAOP bertanda tangan' }}</p>
                @if (sel.diuploadOleh) {
                  <p>Diunggah: {{ sel.diuploadOleh }}</p>
                }
                @if (sel.scanUploadedAt) {
                  <p>{{ formatTs(sel.scanUploadedAt) }}</p>
                }
              </div>
            </div>
          } @else if (sel.status === 'SUDAH_CETAK') {
            <p class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Sudah dicetak, belum ada scan TTD Ketua &amp; Bendahara. Minta ketua upload lembar bertanda tangan.
            </p>
          } @else {
            <p class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              Belum setor — belum ada dokumen form + TTD untuk bulan ini.
            </p>
          }

          <div class="mt-4 grid grid-cols-1 gap-2">
            <a class="btn-primary text-center" [routerLink]="['/app/daop/cetak', sel.id]" (click)="selected.set(null)">
              Unduh Form Word
            </a>
            @if (sel.status !== 'SUDAH_UPLOAD_TTD' && auth.hasRole('ADMIN_KEL', 'KOORD_RW')) {
              <button type="button" class="btn-primary" (click)="mulaiUpload(sel, 'DATANG_KELURAHAN')">
                Datang · Foto Dokumen
              </button>
            }
            @if (
              sel.status !== 'SUDAH_UPLOAD_TTD' &&
              sel.tingkat === 'RW' &&
              auth.hasRole('KOORD_RW') &&
              auth.currentUser()?.rwId === sel.rwId
            ) {
              <button type="button" class="btn-primary" (click)="mulaiUpload(sel, 'UPLOAD_MANDIRI')">
                Upload Scan Ketua RW
              </button>
            }
            <button type="button" class="btn-secondary" (click)="selected.set(null)">Tutup</button>
          </div>
        </div>
      </div>
    }

    @if (arsipEntity(); as ent) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center"
        (click)="arsipEntity.set(null)"
      >
        <div
          class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-base font-bold text-slate-900">Arsip dokumen · {{ ent.wilayah }}</h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ ent.ketua }} · {{ ent.tingkat }} · pilih tahun &amp; halaman rentang bulan
          </p>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 disabled:opacity-40"
              [disabled]="!bisaTahunSebelum()"
              (click)="geserTahun(-1)"
            >
              ◀
            </button>
            <div class="flex flex-wrap justify-center gap-1.5">
              @for (th of arsipTahunOptions(); track th) {
                <button
                  type="button"
                  class="rounded-lg border-2 px-3 py-1.5 text-sm font-bold"
                  [class]="arsipTahun() === th ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'"
                  (click)="pilihTahun(th)"
                >
                  {{ th }}
                </button>
              }
            </div>
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 disabled:opacity-40"
              [disabled]="!bisaTahunSesudah()"
              (click)="geserTahun(1)"
            >
              ▶
            </button>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm font-semibold text-slate-700">{{ labelArsipRange() }}</p>
            <div class="flex flex-wrap items-center gap-1">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold disabled:opacity-40"
                [disabled]="arsipPage() <= 0"
                (click)="geserHalaman(-1)"
              >
                ◀
              </button>
              @for (p of arsipPageNumbers(); track p) {
                <button
                  type="button"
                  class="min-w-[2rem] rounded-lg border-2 px-2 py-1 text-xs font-bold"
                  [class]="arsipPage() === p ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'"
                  (click)="arsipPage.set(p)"
                >
                  {{ p + 1 }}
                </button>
              }
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold disabled:opacity-40"
                [disabled]="arsipPage() >= arsipPageCount() - 1"
                (click)="geserHalaman(1)"
              >
                ▶
              </button>
            </div>
          </div>

          <div class="mt-4 space-y-3">
            @for (cell of arsipLapsPage(); track cell.id) {
              <article class="rounded-xl border border-slate-200 p-3">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p class="font-bold text-slate-900">{{ cell.periodeLabel }}</p>
                    <p class="mt-1">
                      <span [class]="statusBadge(cell.status)">{{ data.labelStatusKeuanganRt(cell.status) }}</span>
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      Saldo {{ data.formatRp(cell.saldo) }}
                      @if (cell.scanFileName) {
                        · 📎 {{ cell.scanFileName }}
                      }
                    </p>
                  </div>
                  <button type="button" class="btn-primary !px-3 !py-2 text-xs" (click)="pilihDariArsip(cell)">
                    {{ cell.status === 'SUDAH_UPLOAD_TTD' ? 'Lihat form + TTD' : 'Detail' }}
                  </button>
                </div>
                @if (cell.status === 'SUDAH_UPLOAD_TTD') {
                  <button
                    type="button"
                    class="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-600 hover:border-blue-200"
                    (click)="pilihDariArsip(cell)"
                  >
                    <p class="font-semibold text-slate-800">Lembar DAOP {{ cell.periodeLabel }}</p>
                    <p class="mt-0.5">
                      TTD {{ cell.tingkat === 'RW' ? 'Ketua RW' : 'Ketua RT' }} &amp; Bendahara ·
                      {{ data.formatRp(cell.saldo) }}
                    </p>
                  </button>
                }
              </article>
            } @empty {
              <p class="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                Tidak ada dokumen di rentang ini.
              </p>
            }
          </div>
          <button type="button" class="btn-secondary mt-4 w-full" (click)="arsipEntity.set(null)">Tutup</button>
        </div>
      </div>
    }

    @if (bukaBlast()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center">
        <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
          <h3 class="text-base font-bold text-slate-900">Blast WA · Belum setor ≥3 bulan</h3>
          <p class="mt-1 text-sm text-slate-500">
            WhatsApp tidak izinkan kirim massal otomatis dari web. Mode singkat:
            <strong>satu chat per langkah</strong> — tidak buka banyak tab sekaligus.
          </p>

          @if (blastAntrianIdx() === null) {
            <button type="button" class="btn-primary mt-3 w-full" (click)="mulaiBlastBerurutan()">
              Mulai blast berurutan ({{ blastTargets().length }} orang)
            </button>

            <h4 class="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">Atau kirim manual</h4>
            <ul class="mt-2 space-y-2">
              @for (item of blastTargets(); track item.key) {
                <li [class]="blastItemClass(item.tingkat)">
                  <div>
                    <p class="font-semibold text-slate-900">{{ item.wilayah }}</p>
                    <p class="text-sm text-slate-500">
                      {{ item.ketua }} · {{ item.telepon }} · {{ item.belumCount }} bln · {{ item.tingkat }}
                    </p>
                  </div>
                  <a
                    class="btn-primary !py-2 !px-3 text-sm"
                    [href]="waBlastLink(item)"
                    target="_blank"
                    rel="noopener"
                  >
                    Kirim WA
                  </a>
                </li>
              }
            </ul>
          } @else {
            @if (blastSekarang(); as now) {
              <div class="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p class="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Langkah {{ blastAntrianIdx()! + 1 }} / {{ blastTargets().length }}
                </p>
                <p class="mt-1 text-lg font-bold text-slate-900">{{ now.wilayah }}</p>
                <p class="text-sm text-slate-600">{{ now.ketua }} · {{ now.telepon }} · {{ now.tingkat }}</p>
                <p class="mt-2 text-xs text-slate-500">
                  1) Buka chat → 2) tekan Kirim di WhatsApp → 3) kembali ke sini → Lanjut.
                </p>
                <div class="mt-3 grid gap-2">
                  <a
                    class="btn-primary text-center"
                    [href]="waBlastLink(now)"
                    target="_blank"
                    rel="noopener"
                    (click)="tandaiSudahBuka()"
                  >
                    Buka chat WhatsApp
                  </a>
                  <button
                    type="button"
                    class="btn-primary"
                    [disabled]="!blastSudahBuka()"
                    (click)="lanjutBlast()"
                  >
                    @if (blastAntrianIdx()! + 1 < blastTargets().length) {
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

          <button type="button" class="btn-secondary mt-4 w-full" (click)="tutupBlast()">Tutup</button>
        </div>
      </div>
    }

    @if (uploadTarget(); as target) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center">
        <div class="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
          <h3 class="text-base font-bold text-slate-900">
            @if (caraSetor() === 'DATANG_KELURAHAN') {
              Foto dokumen DAOP (datang ke kantor)
            } @else {
              Upload scan bertanda tangan
            }
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ data.labelDaopWilayah(target) }} · {{ target.periodeLabel }}
          </p>
          <input #galeri class="sr-only" type="file" accept="image/*,.pdf" (change)="onFile($event)" />
          <div class="mt-4 grid grid-cols-1 gap-2">
            <button type="button" class="btn-primary" (click)="bukaKamera.set(true)">Ambil dari Kamera</button>
            <button type="button" class="btn-secondary" (click)="galeri.click()">Pilih dari Galeri / File</button>
            <button type="button" class="btn-secondary" (click)="batalUpload()">Batal</button>
          </div>
        </div>
      </div>
    }

    @if (bukaKamera()) {
      <app-camera-capture (captured)="onKamera($event)" (closed)="bukaKamera.set(false)" />
    }
  `,
})
export class DaopComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly uploadTarget = signal<LaporanKeuanganRt | null>(null);
  readonly selected = signal<LaporanKeuanganRt | null>(null);
  readonly arsipEntity = signal<DaopEntityRow | null>(null);
  readonly arsipTahun = signal(2026);
  readonly arsipPage = signal(0);
  readonly arsipPerPage = 3;
  /** Ujung kanan jendela matriks (index exclusive). -1 = selalu 3 bulan terakhir. */
  readonly matriksWindowEnd = signal(-1);
  readonly matriksWindowSize = 3;
  /** Offset kartu setor (0 = 3 bulan terbaru). Geser + untuk history lebih lama. */
  readonly kartuOffset = signal(0);
  readonly kartuWindowSize = 3;
  readonly caraSetor = signal<'DATANG_KELURAHAN' | 'UPLOAD_MANDIRI'>('UPLOAD_MANDIRI');
  readonly bukaKamera = signal(false);
  readonly bukaBlast = signal(false);
  /** Index antrian blast berurutan; null = belum mulai / daftar manual. */
  readonly blastAntrianIdx = signal<number | null>(null);
  readonly blastSudahBuka = signal(false);

  readonly rwId = signal('');
  readonly rtId = signal('');
  readonly cari = signal('');
  readonly tingkatFilter = signal('');

  readonly lockRw = computed(() => this.auth.hasRole('KOORD_RW') || this.auth.hasRole('OP_RT'));
  readonly lockRt = computed(() => this.auth.hasRole('OP_RT'));

  readonly showKartuSetorRw = computed(
    () => this.auth.hasRole('KOORD_RW') && !this.auth.hasRole('ADMIN_KEL'),
  );

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
    const rw = this.rwId();
    if (rw) list = list.filter((r) => r.rwId === rw);
    return [...list].sort((a, b) => this.cmpNomor(a.nomor, b.nomor));
  });

  readonly scopeLaporans = computed(() => {
    const user = this.auth.currentUser();
    let list = [...this.data.laporanKeuanganRts()];
    if (user?.role === 'OP_RT' && user.rtId) {
      list = list.filter((l) => l.tingkat === 'RT' && l.rtId === user.rtId);
    } else if (user?.role === 'KOORD_RW' && user.rwId) {
      list = list.filter((l) => l.rwId === user.rwId);
    }
    return list;
  });

  /** Semua bulan di data (untuk arsip). */
  readonly semuaBulanCols = computed((): DaopBulanCol[] => {
    const map = new Map<string, DaopBulanCol>();
    for (const l of this.scopeLaporans()) {
      const key = `${l.tahun}-${l.bulan}`;
      if (!map.has(key)) {
        map.set(key, {
          bulan: l.bulan,
          tahun: l.tahun,
          label: l.periodeLabel,
          short: this.shortBulan(l.bulan, l.tahun),
        });
      }
    }
    return [...map.values()].sort((a, b) => a.tahun - b.tahun || a.bulan - b.bulan);
  });

  /** Matriks pantauan: jendela 3 bulan (bisa digeser). */
  readonly bulanCols = computed((): DaopBulanCol[] => {
    const all = this.semuaBulanCols();
    if (!all.length) return [];
    const size = this.matriksWindowSize;
    const end = this.matriksWindowEnd() < 0 ? all.length : Math.min(this.matriksWindowEnd(), all.length);
    const start = Math.max(0, end - size);
    return all.slice(start, end);
  });

  /** Nunggak/blast selalu dihitung dari 3 bulan terbaru, meski matriks digeser. */
  readonly bulanBlastCols = computed((): DaopBulanCol[] => this.semuaBulanCols().slice(-3));

  readonly arsipTahunOptions = computed(() => {
    const ent = this.arsipEntity();
    if (!ent) return [] as number[];
    const years = new Set(
      this.data
        .laporanKeuanganRts()
        .filter((l) => this.lapMilikEntity(l, ent))
        .map((l) => l.tahun),
    );
    return [...years].sort((a, b) => a - b);
  });

  readonly arsipLapsTahun = computed(() => {
    const ent = this.arsipEntity();
    if (!ent) return [] as LaporanKeuanganRt[];
    const th = this.arsipTahun();
    return this.data
      .laporanKeuanganRts()
      .filter((l) => this.lapMilikEntity(l, ent) && l.tahun === th)
      .sort((a, b) => a.bulan - b.bulan);
  });

  readonly arsipPageCount = computed(() =>
    Math.max(1, Math.ceil(this.arsipLapsTahun().length / this.arsipPerPage)),
  );

  readonly arsipPageNumbers = computed(() =>
    Array.from({ length: this.arsipPageCount() }, (_, i) => i),
  );

  readonly arsipLapsPage = computed(() => {
    const page = Math.min(this.arsipPage(), this.arsipPageCount() - 1);
    const start = page * this.arsipPerPage;
    return this.arsipLapsTahun().slice(start, start + this.arsipPerPage);
  });

  readonly matrixRows = computed((): DaopEntityRow[] => {
    const cols = this.bulanCols();
    const blastCols = this.bulanBlastCols();
    const rwFilter = this.rwId();
    const rtFilter = this.rtId();
    const tingkat = this.tingkatFilter();
    const q = this.cari().trim().toLowerCase();
    const user = this.auth.currentUser();
    const threshold = blastCols.length;

    const byKey = new Map<string, LaporanKeuanganRt[]>();
    for (const l of this.scopeLaporans()) {
      const key = l.tingkat === 'RW' || !l.rtId ? `rw:${l.rwId}` : `rt:${l.rtId}`;
      const arr = byKey.get(key) ?? [];
      arr.push(l);
      byKey.set(key, arr);
    }

    const entities: { key: string; tingkat: TingkatLaporanDaop; rtId?: string; rwId: string }[] = [];

    let rws = this.data.rws();
    if (user?.role === 'KOORD_RW' && user.rwId) rws = rws.filter((r) => r.id === user.rwId);
    if (rwFilter) rws = rws.filter((r) => r.id === rwFilter);

    for (const rw of [...rws].sort((a, b) => this.cmpNomor(a.nomor, b.nomor))) {
      if (!tingkat || tingkat === 'RW') {
        if (!rtFilter) entities.push({ key: `rw:${rw.id}`, tingkat: 'RW', rwId: rw.id });
      }
      if (!tingkat || tingkat === 'RT') {
        let rts = this.data.rts().filter((r) => r.rwId === rw.id);
        if (user?.role === 'OP_RT' && user.rtId) rts = rts.filter((r) => r.id === user.rtId);
        if (rtFilter) rts = rts.filter((r) => r.id === rtFilter);
        for (const rt of [...rts].sort((a, b) => this.cmpNomor(a.nomor, b.nomor))) {
          entities.push({ key: `rt:${rt.id}`, tingkat: 'RT', rtId: rt.id, rwId: rw.id });
        }
      }
    }

    let rows = entities.map((ent) => {
      const laps = byKey.get(ent.key) ?? [];
      const byBulan: Record<string, LaporanKeuanganRt | undefined> = {};
      for (const col of cols) {
        byBulan[this.colKey(col)] = laps.find((l) => l.bulan === col.bulan && l.tahun === col.tahun);
      }
      const belumCount = blastCols.filter((col) => {
        const cell = laps.find((l) => l.bulan === col.bulan && l.tahun === col.tahun);
        return !cell || cell.status !== 'SUDAH_UPLOAD_TTD';
      }).length;

      let wilayah = '';
      let ketua = '';
      let telepon = '—';
      if (ent.tingkat === 'RW') {
        const rw = this.data.getRw(ent.rwId);
        wilayah = rw ? `${this.data.labelRw(rw.nomor)} (Ketua RW)` : 'RW';
        ketua = rw?.namaKetua ?? 'Ketua RW';
        telepon = rw?.telepon ?? '—';
      } else {
        wilayah = this.data.labelWilayah(ent.rtId!);
        const rt = this.data.getRt(ent.rtId!);
        ketua = rt?.namaKetua ?? 'Ketua RT';
        telepon = rt?.telepon ?? '—';
      }

      return {
        ...ent,
        wilayah,
        ketua,
        telepon,
        byBulan,
        belumCount,
        layakBlast: threshold >= 3 && belumCount >= 3,
      };
    });

    if (q) {
      rows = rows.filter((row) => {
        const hay = `${row.wilayah} ${row.ketua} ${row.telepon} ${row.tingkat}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return rows;
  });

  readonly blastTargets = computed(() => this.matrixRows().filter((r) => r.layakBlast));
  readonly blastRtCount = computed(() => this.blastTargets().filter((r) => r.tingkat === 'RT').length);
  readonly blastRwCount = computed(() => this.blastTargets().filter((r) => r.tingkat === 'RW').length);

  readonly blastSekarang = computed(() => {
    const idx = this.blastAntrianIdx();
    if (idx === null) return null;
    return this.blastTargets()[idx] ?? null;
  });

  readonly nunggakRingan = computed(() =>
    this.matrixRows().filter((r) => r.belumCount > 0 && !r.layakBlast),
  );

  readonly lunasCount = computed(() => this.matrixRows().filter((r) => r.belumCount === 0).length);

  /** Semua kewajiban kartu, terbaru → lama. */
  readonly kartuSemua = computed(() => {
    const user = this.auth.currentUser();
    let list = [...this.scopeLaporans()];
    if (user?.role === 'KOORD_RW') {
      // Kartu di bawah: hanya kewajiban RW sendiri (matriks di atas untuk pantau RT)
      list = list.filter((l) => l.tingkat === 'RW' && l.rwId === user.rwId);
    }
    return list.sort((a, b) => b.tahun - a.tahun || b.bulan - a.bulan);
  });

  /** Jendela 3 bulan (terbaru dulu), digeser dengan ◀ ▶. */
  readonly kartuRows = computed(() => {
    const all = this.kartuSemua();
    const size = this.kartuWindowSize;
    const maxStart = Math.max(0, all.length - size);
    const start = Math.min(Math.max(0, this.kartuOffset()), maxStart);
    return all.slice(start, start + size);
  });

  constructor() {
    const user = this.auth.currentUser();
    if (user?.role === 'KOORD_RW' && user.rwId) this.rwId.set(user.rwId);
    if (user?.role === 'OP_RT') {
      if (user.rwId) this.rwId.set(user.rwId);
      if (user.rtId) this.rtId.set(user.rtId);
    }
  }

  cmpNomor(a: string, b: string): number {
    return Number.parseInt(a, 10) - Number.parseInt(b, 10) || a.localeCompare(b, 'id');
  }

  colKey(col: DaopBulanCol): string {
    return `${col.tahun}-${col.bulan}`;
  }

  shortBulan(bulan: number, tahun: number): string {
    const nama = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${nama[bulan] || bulan} '${String(tahun).slice(2)}`;
  }

  onRwChange(value: string): void {
    this.rwId.set(value);
    this.rtId.set('');
  }

  pilihCell(cell: LaporanKeuanganRt): void {
    this.arsipEntity.set(null);
    this.selected.set(cell);
  }

  bukaArsipEntity(row: DaopEntityRow): void {
    this.selected.set(null);
    this.arsipEntity.set(row);
    const years = this.data
      .laporanKeuanganRts()
      .filter((l) => this.lapMilikEntity(l, row))
      .map((l) => l.tahun);
    const latest = years.length ? Math.max(...years) : new Date().getFullYear();
    this.arsipTahun.set(latest);
    this.arsipPage.set(0);
  }

  pilihDariArsip(cell: LaporanKeuanganRt): void {
    this.arsipEntity.set(null);
    this.selected.set(cell);
  }

  pilihTahun(th: number): void {
    this.arsipTahun.set(th);
    this.arsipPage.set(0);
  }

  geserTahun(delta: number): void {
    const opts = this.arsipTahunOptions();
    const idx = opts.indexOf(this.arsipTahun());
    const next = opts[idx + delta];
    if (next != null) this.pilihTahun(next);
  }

  bisaTahunSebelum(): boolean {
    const opts = this.arsipTahunOptions();
    return opts.indexOf(this.arsipTahun()) > 0;
  }

  bisaTahunSesudah(): boolean {
    const opts = this.arsipTahunOptions();
    const idx = opts.indexOf(this.arsipTahun());
    return idx >= 0 && idx < opts.length - 1;
  }

  geserHalaman(delta: number): void {
    const next = this.arsipPage() + delta;
    if (next < 0 || next >= this.arsipPageCount()) return;
    this.arsipPage.set(next);
  }

  labelArsipRange(): string {
    const laps = this.arsipLapsPage();
    if (!laps.length) return `Tahun ${this.arsipTahun()} · kosong`;
    const a = laps[0].periodeLabel;
    const b = laps[laps.length - 1].periodeLabel;
    const halaman = this.arsipPage() + 1;
    const total = this.arsipPageCount();
    return a === b
      ? `${a} · hlm ${halaman}/${total}`
      : `${a} – ${b} · hlm ${halaman}/${total}`;
  }

  private lapMilikEntity(l: LaporanKeuanganRt, ent: DaopEntityRow): boolean {
    if (ent.tingkat === 'RW') return l.tingkat === 'RW' && l.rwId === ent.rwId;
    return l.tingkat === 'RT' && l.rtId === ent.rtId;
  }

  labelMatriksRange(): string {
    const cols = this.bulanCols();
    if (!cols.length) return '—';
    const a = cols[0].label;
    const b = cols[cols.length - 1].label;
    return a === b ? a : `${a} – ${b}`;
  }

  matriksEndIndex(): number {
    const all = this.semuaBulanCols();
    return this.matriksWindowEnd() < 0 ? all.length : Math.min(this.matriksWindowEnd(), all.length);
  }

  bisaMatriksLebihLama(): boolean {
    return this.matriksEndIndex() > this.matriksWindowSize;
  }

  bisaMatriksLebihBaru(): boolean {
    const all = this.semuaBulanCols();
    return this.matriksEndIndex() < all.length;
  }

  geserMatriksBulan(delta: number): void {
    const all = this.semuaBulanCols();
    if (!all.length) return;
    const size = this.matriksWindowSize;
    let end = this.matriksEndIndex() + delta;
    end = Math.max(size, Math.min(all.length, end));
    this.matriksWindowEnd.set(end === all.length ? -1 : end);
  }

  matriksKeTerbaru(): void {
    this.matriksWindowEnd.set(-1);
  }

  labelKartuRange(): string {
    const rows = this.kartuRows();
    if (!rows.length) return '—';
    const a = rows[0].periodeLabel;
    const b = rows[rows.length - 1].periodeLabel;
    return a === b ? a : `${a} → ${b}`;
  }

  bisaKartuLebihLama(): boolean {
    const all = this.kartuSemua();
    const maxStart = Math.max(0, all.length - this.kartuWindowSize);
    return this.kartuOffset() < maxStart;
  }

  bisaKartuLebihBaru(): boolean {
    return this.kartuOffset() > 0;
  }

  geserKartuBulan(delta: number): void {
    const all = this.kartuSemua();
    const maxStart = Math.max(0, all.length - this.kartuWindowSize);
    const next = Math.min(maxStart, Math.max(0, this.kartuOffset() + delta));
    this.kartuOffset.set(next);
  }

  kartuKeTerbaru(): void {
    this.kartuOffset.set(0);
  }

  formatTs(iso: string): string {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  cellShort(status: string): string {
    if (status === 'SUDAH_UPLOAD_TTD') return '✓ Setor';
    if (status === 'SUDAH_CETAK') return 'Cetak';
    return 'Belum';
  }

  cellTone(status: string): string {
    if (status === 'SUDAH_UPLOAD_TTD') return 'bg-emerald-100 text-emerald-800';
    if (status === 'SUDAH_CETAK') return 'bg-amber-100 text-amber-900';
    return 'bg-rose-100 text-rose-800';
  }

  statusBadge(status: string): string {
    if (status === 'SUDAH_UPLOAD_TTD') return 'badge-ok';
    if (status === 'SUDAH_CETAK') return 'badge-warn';
    return 'badge-danger';
  }

  blastItemClass(tingkat: string): string {
    const base = 'flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-3';
    return tingkat === 'RW'
      ? `${base} border-sky-200 bg-sky-50`
      : `${base} border-rose-200 bg-rose-50`;
  }

  private toWaPhone(raw: string): string {
    return (raw || '').replace(/\D/g, '').replace(/^0/, '62');
  }

  waBlastLink(row: DaopEntityRow): string {
    const bulanList = this.bulanCols()
      .filter((c) => {
        const cell = row.byBulan[this.colKey(c)];
        return !cell || cell.status !== 'SUDAH_UPLOAD_TTD';
      })
      .map((c) => `• ${c.label}`)
      .join('\n');

    const jabatan = row.tingkat === 'RW' ? 'Ketua RW' : 'Ketua RT';
    const text =
      `Assalamu'alaikum warahmatullahi wabarakatuh.\n\n` +
      `Yth. Bapak/Ibu ${row.ketua}\n` +
      `${jabatan} ${row.wilayah.replace(' (Ketua RW)', '')}\n\n` +
      `Dengan hormat,\n` +
      `Perkenankan kami dari Kelurahan Rawajati menyampaikan pengingat terkait kewajiban ` +
      `Laporan DAOP (Dana Operasional) ${row.tingkat} yang hingga saat ini belum kami terima arsipnya ` +
      `untuk periode:\n${bulanList}\n\n` +
      `Mohon kesediaan Bapak/Ibu untuk segera menyetorkan laporan tersebut ke kantor kelurahan ` +
      `(dengan tanda tangan basah), atau mengunggah hasil pindaian dokumen yang telah ditandatangani ` +
      `melalui sistem JATI.\n\n` +
      `Atas perhatian dan kerja samanya, kami ucapkan terima kasih.\n\n` +
      `Hormat kami,\nKelurahan Rawajati`;

    const phone = this.toWaPhone(row.telepon);
    const msg = encodeURIComponent(text);
    return phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
  }

  bukaPanelBlast(): void {
    this.blastAntrianIdx.set(null);
    this.blastSudahBuka.set(false);
    this.bukaBlast.set(true);
  }

  mulaiBlastBerurutan(): void {
    if (!this.blastTargets().length) return;
    this.blastAntrianIdx.set(0);
    this.blastSudahBuka.set(false);
  }

  tandaiSudahBuka(): void {
    this.blastSudahBuka.set(true);
  }

  lanjutBlast(): void {
    const idx = this.blastAntrianIdx();
    if (idx === null) return;
    const next = idx + 1;
    if (next >= this.blastTargets().length) {
      this.blastAntrianIdx.set(null);
      this.blastSudahBuka.set(false);
      this.bukaBlast.set(false);
      return;
    }
    this.blastAntrianIdx.set(next);
    this.blastSudahBuka.set(false);
  }

  lewatiBlast(): void {
    this.blastSudahBuka.set(true);
    this.lanjutBlast();
  }

  tutupBlast(): void {
    this.bukaBlast.set(false);
    this.blastAntrianIdx.set(null);
    this.blastSudahBuka.set(false);
  }

  mulaiUpload(row: LaporanKeuanganRt, cara: 'DATANG_KELURAHAN' | 'UPLOAD_MANDIRI'): void {
    this.selected.set(null);
    this.caraSetor.set(cara);
    this.uploadTarget.set(row);
  }

  batalUpload(): void {
    this.uploadTarget.set(null);
    this.bukaKamera.set(false);
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.simpanScan(file);
    (event.target as HTMLInputElement).value = '';
  }

  onKamera(file: File): void {
    this.bukaKamera.set(false);
    this.simpanScan(file);
  }

  private simpanScan(file: File): void {
    const target = this.uploadTarget();
    const user = this.auth.currentUser();
    if (!target || !user) return;
    const fileName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    const previewUrl = URL.createObjectURL(file);
    this.data.uploadScanKeuanganRt(target.id, fileName, user.name, this.caraSetor(), previewUrl);
    this.uploadTarget.set(null);
  }
}
