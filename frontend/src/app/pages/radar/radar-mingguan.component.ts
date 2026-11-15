import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-radar-mingguan',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 print:space-y-4">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Radar Mingguan Lurah</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">{{ radar().periodeLabel }}</p>
          <p class="page-sub">
            Satu layar untuk rapat: ABJ, DAOP, PPSU, perintah (SLA), agenda 7 hari.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 print:hidden">
          <a routerLink="/app/laporan-lurah" class="btn-primary text-sm">Laporan Lurah (PDF)</a>
          <a routerLink="/app/pengaduan" class="btn-secondary text-sm"
            >Aduan RW ({{ radar().pengaduan.terbuka }})</a
          >
          <a routerLink="/app/perintah" class="btn-secondary text-sm">Inbox perintah</a>
        </div>
      </header>

      <!-- KPI strip -->
      <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <a routerLink="/app/psn" class="card !p-4 transition hover:border-blue-300">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">ABJ kelurahan</p>
          <p
            class="mt-1 text-3xl font-extrabold"
            [class]="radar().abj.status === 'AMAN' ? 'text-emerald-600' : 'text-rose-600'"
          >
            {{ radar().abj.abj }}%
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Zona merah: <strong>{{ radar().zonaMerah }}</strong> RT · positif 7h:
            {{ radar().kesra.positif }}
          </p>
        </a>
        <a routerLink="/app/daop" class="card !p-4 transition hover:border-blue-300">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">DAOP belum setor</p>
          <p
            class="mt-1 text-3xl font-extrabold"
            [class]="radar().daopBelum ? 'text-amber-600' : 'text-emerald-600'"
          >
            {{ radar().daopBelum }}
          </p>
          <p class="mt-1 text-xs text-slate-500">Sudah upload TTD: {{ radar().daopSudah }}</p>
        </a>
        <a routerLink="/app/ekbang" class="card !p-4 transition hover:border-blue-300">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">PPSU 7 hari</p>
          <p class="mt-1 text-3xl font-extrabold text-slate-900">{{ radar().ppsuMinggu }}</p>
          <p class="mt-1 text-xs text-slate-500">
            Alat dipinjam {{ radar().alatDipinjam }} · saluran dijadwal {{ radar().saluranJadwal }}
          </p>
        </a>
        <a routerLink="/app/perintah" class="card !p-4 transition hover:border-blue-300">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">SLA perintah</p>
          <p
            class="mt-1 text-3xl font-extrabold"
            [class]="radar().sla.terlambatAktif ? 'text-rose-600' : 'text-emerald-600'"
          >
            @if (radar().sla.pctTepatWaktu != null) {
              {{ radar().sla.pctTepatWaktu }}%
            } @else {
              —
            }
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Tepat waktu (selesai) · terlambat aktif:
            <strong>{{ radar().sla.terlambatAktif }}</strong>
          </p>
        </a>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <!-- Alerts -->
        <article class="card !p-4">
          <h2 class="text-base font-bold text-slate-900">Yang perlu perhatian</h2>
          <p class="mt-0.5 text-sm text-slate-500">Urut kritis → waspada → info</p>
          <ul class="mt-3 space-y-2">
            @for (a of radar().alerts; track a.id) {
              <li>
                <a
                  [routerLink]="a.link"
                  class="flex gap-3 rounded-xl border px-3 py-2.5 transition hover:border-blue-300"
                  [class]="borderAlert(a.level)"
                >
                  <span
                    class="mt-0.5 inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-2 text-[10px] font-extrabold"
                    [class]="badgeAlert(a.level)"
                  >
                    {{ a.level }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900">{{ a.title }}</p>
                    <p class="text-xs text-slate-500">{{ a.meta }}</p>
                  </div>
                </a>
              </li>
            } @empty {
              <li class="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                Tidak ada alert — kondisi terkendali.
              </li>
            }
          </ul>
        </article>

        <!-- SLA detail -->
        <article class="card !p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 class="text-base font-bold text-slate-900">SLA tindak lanjut perintah</h2>
              <p class="mt-0.5 text-sm text-slate-500">Kontrol kinerja Kasi / RW / PPSU</p>
            </div>
            <a routerLink="/app/perintah" class="text-xs font-bold text-blue-700 print:hidden">Kelola →</a>
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-xl bg-slate-50 px-2 py-3">
              <p class="text-2xl font-extrabold text-slate-900">{{ radar().sla.aktif }}</p>
              <p class="text-[11px] font-semibold text-slate-500">Aktif</p>
            </div>
            <div class="rounded-xl bg-rose-50 px-2 py-3">
              <p class="text-2xl font-extrabold text-rose-700">{{ radar().sla.terlambatAktif }}</p>
              <p class="text-[11px] font-semibold text-rose-700/80">Terlambat</p>
            </div>
            <div class="rounded-xl bg-emerald-50 px-2 py-3">
              <p class="text-2xl font-extrabold text-emerald-700">{{ radar().sla.selesaiTepatWaktu }}</p>
              <p class="text-[11px] font-semibold text-emerald-700/80">Selesai on-time</p>
            </div>
          </div>

          @if (radar().sla.terlambatList.length) {
            <h3 class="mt-4 text-sm font-bold text-slate-800">Lewat tenggat</h3>
            <ul class="mt-2 space-y-2">
              @for (p of radar().sla.terlambatList; track p.id) {
                <li class="rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-2">
                  <p class="text-sm font-semibold text-slate-900">{{ p.judul }}</p>
                  <p class="text-xs text-slate-500">
                    {{ p.penerimaLabel }} · tenggat {{ p.tenggatAt }} ·
                    {{ data.labelStatusPerintah(p.status) }}
                  </p>
                </li>
              }
            </ul>
          }

          <h3 class="mt-4 text-sm font-bold text-slate-800">Per penerima</h3>
          <div class="mt-2 overflow-x-auto">
            <table class="w-full min-w-[20rem] text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th class="py-2 pr-2 font-bold">Penerima</th>
                  <th class="py-2 px-1 font-bold">Aktif</th>
                  <th class="py-2 px-1 font-bold">Telat</th>
                  <th class="py-2 pl-1 font-bold">Selesai</th>
                </tr>
              </thead>
              <tbody>
                @for (row of radar().sla.byPenerima; track row.label) {
                  <tr class="border-b border-slate-100">
                    <td class="py-2 pr-2 font-medium text-slate-800">{{ row.label }}</td>
                    <td class="py-2 px-1">{{ row.aktif }}</td>
                    <td
                      class="py-2 px-1 font-bold"
                      [class.text-rose-600]="row.terlambat > 0"
                    >
                      {{ row.terlambat }}
                    </td>
                    <td class="py-2 pl-1">{{ row.selesai }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="card !p-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-base font-bold text-slate-900">7 hari ke depan</h2>
            <a routerLink="/app/kalender" class="text-xs font-bold text-blue-700 print:hidden">Kalender →</a>
          </div>
          <ul class="mt-3 space-y-2">
            @for (item of radar().agendaPreview; track item.id) {
              <li class="rounded-xl border border-slate-200 px-3 py-2">
                <p class="text-sm font-semibold text-slate-900">{{ item.judul }}</p>
                <p class="text-xs text-slate-500">
                  {{ item.tanggal }}
                  @if (item.jam) {
                    · {{ item.jam }}
                  }
                  · {{ data.labelJenisKalender(item.jenis) }}
                </p>
              </li>
            } @empty {
              <li class="text-sm text-slate-500">Tidak ada jadwal 7 hari ke depan.</li>
            }
          </ul>
        </article>

        <article class="card !p-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-base font-bold text-slate-900">PMI bulan ini</h2>
            <a routerLink="/app/setoran-pmi-baznas" class="text-xs font-bold text-blue-700 print:hidden"
              >Setoran →</a
            >
          </div>
          <div class="mt-3 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-slate-50 px-3 py-3">
              <p class="text-xs font-bold uppercase text-slate-500">Catatan</p>
              <p class="mt-1 text-lg font-extrabold text-slate-900">
                {{ data.formatRp(radar().pmi.totalCatatan) }}
              </p>
            </div>
            <div class="rounded-xl bg-slate-50 px-3 py-3">
              <p class="text-xs font-bold uppercase text-slate-500">Uang map</p>
              <p class="mt-1 text-lg font-extrabold text-slate-900">
                {{ data.formatRp(radar().pmi.map) }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-sm">
            Status:
            @if (radar().pmi.klop) {
              <span class="font-bold text-emerald-700">Klop</span>
            } @else {
              <span class="font-bold text-amber-700"
                >Belum klop (selisih {{ data.formatRp(radar().pmi.selisih) }})</span
              >
            }
          </p>
        </article>
      </section>
    </div>
  `,
})
export class RadarMingguanComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly radar = this.data.radarMingguan;

  borderAlert(level: 'KRITIS' | 'WASPADA' | 'INFO'): string {
    if (level === 'KRITIS') return 'border-rose-200 bg-rose-50/40';
    if (level === 'WASPADA') return 'border-amber-200 bg-amber-50/40';
    return 'border-slate-200 bg-slate-50/40';
  }

  badgeAlert(level: 'KRITIS' | 'WASPADA' | 'INFO'): string {
    if (level === 'KRITIS') return 'bg-rose-600 text-white';
    if (level === 'WASPADA') return 'bg-amber-500 text-white';
    return 'bg-slate-500 text-white';
  }

}
