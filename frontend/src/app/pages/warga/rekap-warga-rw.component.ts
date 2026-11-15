import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

/** Portal Ketua RW: kesimpulan jumlah warga per RT. */
@Component({
  selector: 'app-rekap-warga-rw',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Rekap Warga RW</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            {{ labelRw() }} — kesimpulan jumlah warga per RT
          </p>
          <p class="page-sub">
            Pantau RT 001–006 tanpa masuk detail RT. Detail/edit tetap di tingkat RT &amp; Dasawisma.
          </p>
        </div>
        <a routerLink="/app/kas-rw" class="btn-primary !py-2 !px-3 text-sm">Kas RW →</a>
      </header>

      <section class="grid gap-3 sm:grid-cols-3">
        <article class="card !p-4">
          <p class="text-xs font-bold uppercase text-slate-500">Total warga RW</p>
          <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ totalWarga() }}</p>
        </article>
        <article class="card !p-4">
          <p class="text-xs font-bold uppercase text-slate-500">Jumlah RT</p>
          <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ rows().length }}</p>
        </article>
        <article class="card !p-4">
          <p class="text-xs font-bold uppercase text-slate-500">Saldo kas semua RT</p>
          <p class="mt-1 text-2xl font-extrabold text-emerald-700">{{ data.formatRp(totalSaldoRt()) }}</p>
        </article>
      </section>

      <section class="card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 text-left">
                <th class="border-b border-slate-200 px-4 py-3">RT</th>
                <th class="border-b border-slate-200 px-4 py-3">Ketua</th>
                <th class="border-b border-slate-200 px-4 py-3 text-right">Tetap</th>
                <th class="border-b border-slate-200 px-4 py-3 text-right">Kos/kontrak</th>
                <th class="border-b border-slate-200 px-4 py-3 text-right">Total</th>
                <th class="border-b border-slate-200 px-4 py-3 text-right">Lansia</th>
                <th class="border-b border-slate-200 px-4 py-3 text-right">Janda</th>
                <th class="border-b border-slate-200 px-4 py-3 text-right">Bansos</th>
                <th class="border-b border-slate-200 px-4 py-3 text-right">Saldo kas RT</th>
              </tr>
            </thead>
            <tbody>
              @for (r of rows(); track r.rtId) {
                <tr class="hover:bg-slate-50/80">
                  <td class="border-b border-slate-100 px-4 py-3 font-bold text-slate-900">
                    RT {{ r.nomor }}
                  </td>
                  <td class="border-b border-slate-100 px-4 py-3 text-slate-700">{{ r.namaKetua }}</td>
                  <td class="border-b border-slate-100 px-4 py-3 text-right font-semibold">{{ r.tetap }}</td>
                  <td class="border-b border-slate-100 px-4 py-3 text-right">{{ r.kos }}</td>
                  <td class="border-b border-slate-100 px-4 py-3 text-right font-extrabold text-blue-800">
                    {{ r.total }}
                  </td>
                  <td class="border-b border-slate-100 px-4 py-3 text-right text-amber-800">{{ r.lansia }}</td>
                  <td class="border-b border-slate-100 px-4 py-3 text-right text-rose-800">{{ r.janda }}</td>
                  <td class="border-b border-slate-100 px-4 py-3 text-right text-blue-800">{{ r.bansos }}</td>
                  <td class="border-b border-slate-100 px-4 py-3 text-right font-semibold text-emerald-700">
                    {{ data.formatRp(r.saldoKasRt) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class RekapWargaRwComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly rwId = computed(() => this.auth.currentUser()?.rwId || 'rw-7');
  readonly labelRw = computed(() => {
    const rw = this.data.getRw(this.rwId());
    return rw ? this.data.labelRw(rw.nomor) : 'RW';
  });
  readonly rows = computed(() => this.data.rekapWargaPerRt(this.rwId()));
  readonly totalWarga = computed(() => this.rows().reduce((s, r) => s + r.total, 0));
  readonly totalSaldoRt = computed(() => this.rows().reduce((s, r) => s + r.saldoKasRt, 0));
}
