import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

/** Rekap bulanan gabungan — 1 cetakan untuk reporting internal / ke kecamatan. */
@Component({
  selector: 'app-laporan-gabungan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/laporan" class="text-sm font-semibold text-blue-700">← Kembali ke Export Laporan</a>
          <h1 class="page-title mt-1">Rekap Bulanan Gabungan</h1>
          <p class="page-sub">
            PSN · DAOP · PPSU · Agenda · Kerja bakti · Surat keluar — satu PDF dari browser.
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <div>
            <label class="field-label" for="bln">Bulan</label>
            <select id="bln" class="field-input" [ngModel]="bulan()" (ngModelChange)="bulan.set(+$event)">
              @for (m of bulanOptions; track m.id) {
                <option [value]="m.id">{{ m.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label" for="thn">Tahun</label>
            <select id="thn" class="field-input" [ngModel]="tahun()" (ngModelChange)="tahun.set(+$event)">
              @for (y of tahunOptions; track y) {
                <option [value]="y">{{ y }}</option>
              }
            </select>
          </div>
          <button type="button" class="btn-primary" (click)="cetak()">Unduh / Cetak PDF</button>
        </div>
      </header>

      <article
        class="mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <header class="border-b-2 border-slate-900 pb-4">
          <div class="flex items-start gap-4">
            <div
              class="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-slate-800 bg-slate-50 text-slate-800"
              aria-hidden="true"
            >
              <span class="text-[10px] font-bold leading-none tracking-wide">LOGO</span>
              <span class="mt-0.5 text-[9px] font-semibold leading-none">RWJ</span>
            </div>
            <div class="min-w-0 flex-1 text-center sm:pr-16">
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                Pemerintah Provinsi DKI Jakarta
              </p>
              <p class="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Kota Administrasi Jakarta Selatan
              </p>
              <h2 class="mt-2 text-xl font-extrabold uppercase leading-snug text-slate-900 sm:text-2xl">
                Kelurahan Rawajati, Kecamatan Pancoran
              </h2>
              <p class="mt-2 text-xs text-slate-500">{{ data.kelurahan.alamatKantor }}</p>
            </div>
          </div>
        </header>

        <div class="mt-6 text-center">
          <h3
            class="text-lg font-bold uppercase tracking-wide text-slate-950 underline decoration-slate-900/40 underline-offset-4"
          >
            Rekap Bulanan Gabungan
          </h3>
          <p class="mt-2 text-base font-semibold text-slate-800">Periode: {{ labelPeriode() }}</p>
          <p class="mt-1 text-sm text-slate-500">Dicetak: {{ tanggalCetak }} · {{ auth.currentUser()?.name }}</p>
        </div>

        <!-- A. PSN -->
        <section class="mt-8">
          <h4 class="mb-3 border-b border-slate-300 pb-1 text-base font-bold text-slate-900">
            A. PSN / ABJ (Kesra)
          </h4>
          <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div class="rounded-lg border border-slate-200 px-3 py-2 text-center">
              <p class="text-xs uppercase text-slate-500">ABJ kelurahan</p>
              <p class="mt-1 text-xl font-extrabold" [class]="abjColor(abj().status)">{{ abj().abj }}%</p>
            </div>
            <div class="rounded-lg border border-slate-200 px-3 py-2 text-center">
              <p class="text-xs uppercase text-slate-500">Diperiksa</p>
              <p class="mt-1 text-xl font-extrabold text-slate-900">{{ abj().diperiksa }}</p>
            </div>
            <div class="rounded-lg border border-slate-200 px-3 py-2 text-center">
              <p class="text-xs uppercase text-slate-500">Positif jentik</p>
              <p class="mt-1 text-xl font-extrabold text-rose-600">{{ abj().positif }}</p>
            </div>
            <div class="rounded-lg border border-slate-200 px-3 py-2 text-center">
              <p class="text-xs uppercase text-slate-500">Zona merah</p>
              <p class="mt-1 text-xl font-extrabold text-rose-600">{{ data.zonaMerahCount() }} RT</p>
            </div>
          </div>
          <p class="mt-2 text-sm text-slate-600">
            Laporan PSN bulan ini: <strong>{{ psnBulan().length }}</strong> · Status zona:
            {{ data.labelZona(abj().status) }}
          </p>
        </section>

        <!-- B. DAOP -->
        <section class="mt-8">
          <h4 class="mb-3 border-b border-slate-300 pb-1 text-base font-bold text-slate-900">
            B. DAOP RT/RW
          </h4>
          <div class="grid grid-cols-3 gap-3 text-center text-sm">
            <div class="rounded-lg border border-rose-200 bg-rose-50/40 px-2 py-3">
              <p class="text-xs font-bold uppercase text-slate-500">Belum setor</p>
              <p class="mt-1 text-2xl font-extrabold text-rose-600">{{ daopRingkas().belum }}</p>
            </div>
            <div class="rounded-lg border border-amber-200 bg-amber-50/40 px-2 py-3">
              <p class="text-xs font-bold uppercase text-slate-500">Sudah cetak</p>
              <p class="mt-1 text-2xl font-extrabold text-amber-700">{{ daopRingkas().cetak }}</p>
            </div>
            <div class="rounded-lg border border-emerald-200 bg-emerald-50/40 px-2 py-3">
              <p class="text-xs font-bold uppercase text-slate-500">Sudah upload TTD</p>
              <p class="mt-1 text-2xl font-extrabold text-emerald-700">{{ daopRingkas().upload }}</p>
            </div>
          </div>
          @if (daopBelum().length) {
            <p class="mt-3 text-sm font-semibold text-slate-800">Yang belum setor (periode terkait):</p>
            <ul class="mt-1 list-inside list-disc text-sm text-slate-700">
              @for (d of daopBelum().slice(0, 12); track d.id) {
                <li>{{ data.labelDaopWilayah(d) }} · {{ d.periodeLabel }} · {{ d.tingkat }}</li>
              }
            </ul>
            @if (daopBelum().length > 12) {
              <p class="text-xs text-slate-500">+{{ daopBelum().length - 12 }} lainnya</p>
            }
          } @else {
            <p class="mt-3 text-sm text-emerald-700">Tidak ada nunggak pada filter periode ini.</p>
          }
        </section>

        <!-- C. PPSU -->
        <section class="mt-8">
          <h4 class="mb-3 border-b border-slate-300 pb-1 text-base font-bold text-slate-900">
            C. PPSU / Ekbang
          </h4>
          <p class="text-sm text-slate-700">
            Laporan kerja bulan ini: <strong>{{ ppsuBulan().length }}</strong> · Alat dipinjam:
            <strong>{{ data.alatDipinjamCount() }}</strong> · Alat rusak:
            <strong>{{ data.asetRusakCount() }}</strong>
          </p>
          @if (ppsuBulan().length) {
            <table class="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50">
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Tanggal</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Lokasi</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Petugas</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Jenis</th>
                </tr>
              </thead>
              <tbody>
                @for (l of ppsuBulan().slice(0, 10); track l.id) {
                  <tr>
                    <td class="border border-slate-300 px-2 py-1.5">{{ l.createdAt.slice(0, 10) }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ l.lokasi }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ l.petugasNama }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ l.jenisPekerjaan }}</td>
                  </tr>
                }
              </tbody>
            </table>
            @if (ppsuBulan().length > 10) {
              <p class="mt-1 text-xs text-slate-500">Menampilkan 10 dari {{ ppsuBulan().length }} laporan.</p>
            }
          }
        </section>

        <!-- D. Agenda -->
        <section class="mt-8">
          <h4 class="mb-3 border-b border-slate-300 pb-1 text-base font-bold text-slate-900">
            D. Agenda rapat
          </h4>
          @if (rapatBulan().length) {
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50">
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Tanggal</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Judul</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Status</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Hadir</th>
                </tr>
              </thead>
              <tbody>
                @for (a of rapatBulan(); track a.id) {
                  <tr>
                    <td class="border border-slate-300 px-2 py-1.5">{{ a.tanggal }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ a.judul }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ a.status }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">
                      {{ hitungHadir(a) }}/{{ a.peserta.length }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-sm text-slate-500">Tidak ada rapat pada periode ini.</p>
          }
        </section>

        <!-- E. Kerja bakti -->
        <section class="mt-8">
          <h4 class="mb-3 border-b border-slate-300 pb-1 text-base font-bold text-slate-900">
            E. Kerja bakti RW
          </h4>
          @if (kbBulan().length) {
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50">
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Tanggal</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">RW</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Lokasi</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Status</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">PPSU</th>
                </tr>
              </thead>
              <tbody>
                @for (k of kbBulan(); track k.id) {
                  <tr>
                    <td class="border border-slate-300 px-2 py-1.5">{{ k.tanggal }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">
                      {{ data.labelRw(data.getRw(k.rwId)?.nomor || '') }}
                    </td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ k.lokasi }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ k.status }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">
                      {{ data.punyaDukunganPpsu(k) ? (k.ppsuJumlahPersonil || '✓') + ' org' : '—' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-sm text-slate-500">Tidak ada kerja bakti pada periode ini.</p>
          }
        </section>

        <!-- F. Surat keluar -->
        <section class="mt-8">
          <h4 class="mb-3 border-b border-slate-300 pb-1 text-base font-bold text-slate-900">
            F. Surat keluar
          </h4>
          @if (suratBulan().length) {
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50">
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Nomor</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Tanggal</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Perihal</th>
                  <th class="border border-slate-300 px-2 py-1.5 text-left">Tujuan</th>
                </tr>
              </thead>
              <tbody>
                @for (s of suratBulan(); track s.id) {
                  <tr>
                    <td class="border border-slate-300 px-2 py-1.5 font-mono text-xs">{{ s.nomorSurat }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ s.tanggalSurat }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ s.perihal }}</td>
                    <td class="border border-slate-300 px-2 py-1.5">{{ s.tujuan }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-sm text-slate-500">Tidak ada surat keluar pada periode ini.</p>
          }
        </section>

        <footer class="mt-10 grid grid-cols-2 gap-8 text-center text-sm text-slate-700">
          <div>
            <p>Mengetahui,</p>
            <p class="font-semibold">Lurah Rawajati</p>
            <div class="mt-16 font-semibold underline">Sariman, S.Sos, M.Si</div>
          </div>
          <div>
            <p>Dibuat oleh,</p>
            <p class="font-semibold">{{ auth.currentUser()?.jabatan || 'Staf Kelurahan' }}</p>
            <div class="mt-16 font-semibold underline">{{ auth.currentUser()?.name }}</div>
          </div>
        </footer>
      </article>
    </div>
  `,
})
export class LaporanGabunganComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly bulan = signal(new Date().getMonth() + 1);
  readonly tahun = signal(new Date().getFullYear());

  readonly bulanOptions = [
    { id: 1, label: 'Januari' },
    { id: 2, label: 'Februari' },
    { id: 3, label: 'Maret' },
    { id: 4, label: 'April' },
    { id: 5, label: 'Mei' },
    { id: 6, label: 'Juni' },
    { id: 7, label: 'Juli' },
    { id: 8, label: 'Agustus' },
    { id: 9, label: 'September' },
    { id: 10, label: 'Oktober' },
    { id: 11, label: 'November' },
    { id: 12, label: 'Desember' },
  ];

  readonly tahunOptions = [2025, 2026, 2027];

  readonly tanggalCetak = this.data.formatTanggalId(new Date());

  readonly labelPeriode = computed(() => {
    const m = this.bulanOptions.find((x) => x.id === this.bulan())?.label ?? '';
    return `${m} ${this.tahun()}`;
  });

  readonly abj = computed(() => this.data.hitungAbj());

  readonly psnBulan = computed(() => {
    const y = this.tahun();
    const m = this.bulan();
    return this.data.laporanPsns().filter((l) => this.inMonth(l.tanggalPemeriksaan || l.createdAt, y, m));
  });

  readonly daopPeriode = computed(() => {
    const y = this.tahun();
    const m = this.bulan();
    return this.data.laporanKeuanganRts().filter((l) => l.tahun === y && l.bulan === m);
  });

  readonly daopRingkas = computed(() => {
    const list = this.daopPeriode();
    return {
      belum: list.filter((l) => l.status === 'BELUM_SETOR').length,
      cetak: list.filter((l) => l.status === 'SUDAH_CETAK').length,
      upload: list.filter((l) => l.status === 'SUDAH_UPLOAD_TTD').length,
    };
  });

  readonly daopBelum = computed(() => this.daopPeriode().filter((l) => l.status === 'BELUM_SETOR'));

  readonly ppsuBulan = computed(() => {
    const y = this.tahun();
    const m = this.bulan();
    return this.data
      .laporanKerjaPpsus()
      .filter((l) => this.inMonth(l.createdAt, y, m))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  readonly rapatBulan = computed(() => {
    const y = this.tahun();
    const m = this.bulan();
    return this.data.agendaRapats().filter((a) => this.inMonth(a.tanggal, y, m));
  });

  readonly kbBulan = computed(() => {
    const y = this.tahun();
    const m = this.bulan();
    return this.data.kerjaBaktiRws().filter((k) => this.inMonth(k.tanggal, y, m));
  });

  readonly suratBulan = computed(() => {
    const y = this.tahun();
    const m = this.bulan();
    return this.data.suratKeluars().filter((s) => this.inMonth(s.tanggalSurat, y, m));
  });

  inMonth(isoDate: string, year: number, month1to12: number): boolean {
    const d = new Date(isoDate.includes('T') ? isoDate : isoDate + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === year && d.getMonth() + 1 === month1to12;
  }

  hitungHadir(a: { peserta: Array<{ hadir: boolean }> }): number {
    return a.peserta.filter((p) => p.hadir).length;
  }

  abjColor(status: string): string {
    if (status === 'AMAN') return 'text-emerald-600';
    if (status === 'ZONA_MERAH') return 'text-rose-600';
    return 'text-slate-700';
  }

  cetak(): void {
    window.print();
  }
}
