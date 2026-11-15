import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

/** Rekap setoran DAOP keseluruhan (kelurahan / RW) — cetak PDF dari Export Laporan. */
@Component({
  selector: 'app-laporan-daop-rekap',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/laporan" class="text-sm font-semibold text-blue-700">← Kembali ke Export Laporan</a>
          <h1 class="page-title mt-1">Rekap DAOP Keseluruhan</h1>
          <p class="page-sub">
            Pratinjau cetak rekap setoran RT/RW — siap disimpan sebagai PDF dari browser.
          </p>
        </div>
        <button type="button" class="btn-primary" (click)="cetak()">Unduh / Cetak PDF</button>
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
                Kelurahan Rawajati, Kecamatan Pancoran,<br class="hidden sm:block" />
                Kota Administrasi Jakarta Selatan
              </h2>
              <p class="mt-2 text-xs text-slate-500">{{ data.kelurahan.alamatKantor }}</p>
            </div>
          </div>
        </header>

        <div class="mt-6 text-center">
          <h3
            class="text-lg font-bold uppercase tracking-wide text-slate-950 underline decoration-slate-900/40 underline-offset-4"
          >
            Rekap Laporan DAOP RT / RW
          </h3>
          <p class="mt-2 text-base text-slate-700">Dicetak: {{ tanggalCetak }}</p>
          <p class="mt-1 text-sm text-slate-500">
            @if (auth.hasRole('KOORD_RW')) {
              Scope: RW sendiri ·
            } @else {
              Scope: seluruh kelurahan ·
            }
            {{ rows().length }} baris kewajiban
          </p>
        </div>

        <section class="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
          <div class="rounded-xl border border-rose-200 bg-rose-50/50 px-2 py-3">
            <p class="text-xs font-bold uppercase text-slate-500">Belum setor</p>
            <p class="mt-1 text-2xl font-extrabold text-rose-600">{{ ringkas().belum }}</p>
          </div>
          <div class="rounded-xl border border-amber-200 bg-amber-50/50 px-2 py-3">
            <p class="text-xs font-bold uppercase text-slate-500">Sudah cetak</p>
            <p class="mt-1 text-2xl font-extrabold text-amber-700">{{ ringkas().cetak }}</p>
          </div>
          <div class="rounded-xl border border-emerald-200 bg-emerald-50/50 px-2 py-3">
            <p class="text-xs font-bold uppercase text-slate-500">Sudah upload TTD</p>
            <p class="mt-1 text-2xl font-extrabold text-emerald-700">{{ ringkas().upload }}</p>
          </div>
        </section>

        <section class="mt-8">
          <h4 class="mb-3 text-base font-bold text-slate-900">A. Rekap per periode &amp; wilayah</h4>
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50">
                <th class="border border-slate-300 px-2 py-2 text-left">Periode</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Wilayah</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Tingkat</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Ketua</th>
                <th class="border border-slate-300 px-2 py-2 text-left">Status</th>
                <th class="border border-slate-300 px-2 py-2 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id) {
                <tr [class]="row.status === 'BELUM_SETOR' ? 'bg-rose-50/40' : ''">
                  <td class="border border-slate-300 px-2 py-2 whitespace-nowrap">{{ row.periodeLabel }}</td>
                  <td class="border border-slate-300 px-2 py-2">{{ data.labelDaopWilayah(row) }}</td>
                  <td class="border border-slate-300 px-2 py-2">{{ row.tingkat }}</td>
                  <td class="border border-slate-300 px-2 py-2">{{ data.labelDaopKetua(row) }}</td>
                  <td class="border border-slate-300 px-2 py-2">{{ data.labelStatusKeuanganRt(row.status) }}</td>
                  <td class="border border-slate-300 px-2 py-2 text-right">
                    @if (row.status === 'BELUM_SETOR') {
                      —
                    } @else {
                      {{ data.formatRp(row.saldo) }}
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="border border-slate-300 px-2 py-4 text-center text-slate-500">
                    Belum ada data DAOP.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <section class="mt-8">
          <h4 class="mb-3 text-base font-bold text-slate-900">B. Ringkasan keuangan (yang sudah setor / upload)</h4>
          <table class="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td class="border border-slate-300 px-3 py-2 font-semibold">Total pemasukan</td>
                <td class="border border-slate-300 px-3 py-2 text-right">{{ data.formatRp(totals().pemasukan) }}</td>
              </tr>
              <tr>
                <td class="border border-slate-300 px-3 py-2 font-semibold">Total pengeluaran</td>
                <td class="border border-slate-300 px-3 py-2 text-right">{{ data.formatRp(totals().pengeluaran) }}</td>
              </tr>
              <tr class="bg-slate-50">
                <td class="border border-slate-300 px-3 py-2 font-bold">Total saldo</td>
                <td class="border border-slate-300 px-3 py-2 text-right font-bold">
                  {{ data.formatRp(totals().saldo) }}
                </td>
              </tr>
            </tbody>
          </table>
          <p class="mt-2 text-xs text-slate-500">
            Hanya baris berstatus Sudah Cetak / Sudah Upload TTD yang dijumlahkan. Form per RT/RW tetap bisa dicetak dari
            pantauan DAOP.
          </p>
        </section>

        <footer class="mt-10 grid gap-8 text-sm sm:grid-cols-2">
          <div>
            <p class="text-slate-500">Mengetahui,</p>
            <p class="mt-1 font-semibold text-slate-900">Lurah Rawajati</p>
            <p class="mt-16 border-t border-slate-400 pt-1 font-semibold">Sariman, S.Sos, M.Si</p>
          </div>
          <div>
            <p class="text-slate-500">Dibuat oleh,</p>
            <p class="mt-1 font-semibold text-slate-900">Sekretaris Kelurahan</p>
            <p class="mt-16 border-t border-slate-400 pt-1 font-semibold">Maya Kartika</p>
          </div>
        </footer>
      </article>
    </div>
  `,
})
export class LaporanDaopRekapComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  readonly rows = computed(() => {
    const user = this.auth.currentUser();
    let list = [...this.data.laporanKeuanganRts()];
    if (user?.role === 'KOORD_RW' && user.rwId) {
      const rtIds = new Set(this.data.rts().filter((r) => r.rwId === user.rwId).map((r) => r.id));
      list = list.filter((l) => (l.tingkat === 'RW' ? l.rwId === user.rwId : rtIds.has(l.rtId || '')));
    }
    const rwNomor = (rwId: string) =>
      Number.parseInt(this.data.rws().find((r) => r.id === rwId)?.nomor || '0', 10) || 0;
    const rtNomor = (rtId?: string) =>
      Number.parseInt(this.data.rts().find((r) => r.id === rtId)?.nomor || '0', 10) || 0;

    // Periode terbaru → RW 01 (Ketua RW dulu) → RT001, RT002 … → RW 02 …
    return list.sort((a, b) => {
      const byPeriode = b.tahun - a.tahun || b.bulan - a.bulan;
      if (byPeriode) return byPeriode;
      const byRw = rwNomor(a.rwId) - rwNomor(b.rwId);
      if (byRw) return byRw;
      // Ketua RW dulu, baru daftar Ketua RT di RW itu
      if (a.tingkat !== b.tingkat) return a.tingkat === 'RW' ? -1 : 1;
      return rtNomor(a.rtId) - rtNomor(b.rtId);
    });
  });

  readonly ringkas = computed(() => {
    const list = this.rows();
    return {
      belum: list.filter((l) => l.status === 'BELUM_SETOR').length,
      cetak: list.filter((l) => l.status === 'SUDAH_CETAK').length,
      upload: list.filter((l) => l.status === 'SUDAH_UPLOAD_TTD').length,
    };
  });

  readonly totals = computed(() => {
    const list = this.rows().filter((l) => l.status !== 'BELUM_SETOR');
    return list.reduce(
      (acc, l) => ({
        pemasukan: acc.pemasukan + (l.pemasukan || 0),
        pengeluaran: acc.pengeluaran + (l.pengeluaran || 0),
        saldo: acc.saldo + (l.saldo || 0),
      }),
      { pemasukan: 0, pengeluaran: 0, saldo: 0 },
    );
  });

  cetak(): void {
    window.print();
  }
}
