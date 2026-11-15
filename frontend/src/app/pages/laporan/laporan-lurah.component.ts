import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

/** Halaman cetak resmi 1-klik untuk Lurah — siap PDF via print browser. */
@Component({
  selector: 'app-laporan-lurah',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 class="page-title">Laporan Mingguan Lurah</h1>
          <p class="page-sub">Ringkas siap cetak / simpan PDF — untuk rapat internal atau arsip.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a routerLink="/app/radar" class="btn-secondary text-sm">Kembali ke Radar</a>
          <button type="button" class="btn-primary text-sm" (click)="cetak()">Cetak / Simpan PDF</button>
        </div>
      </div>

      <article
        class="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none"
      >
        <header class="border-b border-slate-200 pb-4 text-center">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-800">JATI</p>
          <h2 class="mt-1 text-xl font-extrabold text-slate-900">Laporan Mingguan Kelurahan</h2>
          <p class="mt-1 text-sm font-semibold text-slate-700">{{ data.kelurahan.nama }}</p>
          <p class="text-xs text-slate-500">
            Kecamatan {{ data.kelurahan.kecamatan }} · {{ data.kelurahan.kota }}
          </p>
          <p class="mt-2 text-sm text-slate-600">{{ radar().periodeLabel }}</p>
          <p class="text-xs text-slate-500">
            Disusun untuk: {{ auth.currentUser()?.name }} · {{ auth.currentUser()?.jabatan }}
          </p>
        </header>

        <section class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl bg-slate-50 px-3 py-3 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-500">ABJ</p>
            <p class="text-2xl font-extrabold" [class]="radar().abj.status === 'AMAN' ? 'text-emerald-700' : 'text-rose-700'">
              {{ radar().abj.abj }}%
            </p>
          </div>
          <div class="rounded-xl bg-slate-50 px-3 py-3 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-500">Zona merah</p>
            <p class="text-2xl font-extrabold text-slate-900">{{ radar().zonaMerah }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-3 py-3 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-500">DAOP nunggak</p>
            <p class="text-2xl font-extrabold text-amber-700">{{ radar().daopBelum }}</p>
          </div>
          <div class="rounded-xl bg-slate-50 px-3 py-3 text-center">
            <p class="text-[10px] font-bold uppercase text-slate-500">SLA on-time</p>
            <p class="text-2xl font-extrabold text-slate-900">
              {{ radar().sla.pctTepatWaktu != null ? radar().sla.pctTepatWaktu + '%' : '—' }}
            </p>
          </div>
        </section>

        <section class="mt-6">
          <h3 class="text-sm font-extrabold uppercase tracking-wide text-slate-800">1. Ringkasan operasional</h3>
          <ul class="mt-2 space-y-1 text-sm text-slate-700">
            <li>· PPSU laporan 7 hari: <strong>{{ radar().ppsuMinggu }}</strong> · alat dipinjam {{ radar().alatDipinjam }}</li>
            <li>· Saluran dijadwalkan: <strong>{{ radar().saluranJadwal }}</strong></li>
            <li>
              · Perintah aktif {{ radar().sla.aktif }} · terlambat
              <strong>{{ radar().sla.terlambatAktif }}</strong> · urgent {{ radar().sla.urgentAktif }}
            </li>
            <li>
              · Pengaduan terbuka <strong>{{ radar().pengaduan.terbuka }}</strong> (baru
              {{ radar().pengaduan.baru }}) · selesai {{ radar().pengaduan.selesai }}
            </li>
            <li>
              · PMI bulan ini: catatan {{ data.formatRp(radar().pmi.totalCatatan) }} · map
              {{ data.formatRp(radar().pmi.map) }} ·
              {{ radar().pmi.klop ? 'klop' : 'belum klop' }}
            </li>
            <li>· Kegiatan / tenggat 7 hari ke depan: <strong>{{ radar().kalenderMinggu }}</strong></li>
          </ul>
        </section>

        <section class="mt-6">
          <h3 class="text-sm font-extrabold uppercase tracking-wide text-slate-800">2. Perhatian / alert</h3>
          <ul class="mt-2 space-y-1.5 text-sm text-slate-700">
            @for (a of radar().alerts; track a.id) {
              <li>
                <span class="font-bold">[{{ a.level }}]</span> {{ a.title }}
                <span class="text-slate-500"> — {{ a.meta }}</span>
              </li>
            } @empty {
              <li>Tidak ada alert kritis saat ini.</li>
            }
          </ul>
        </section>

        @if (radar().sla.terlambatList.length) {
          <section class="mt-6">
            <h3 class="text-sm font-extrabold uppercase tracking-wide text-slate-800">
              3. Perintah lewat tenggat
            </h3>
            <ul class="mt-2 space-y-1 text-sm text-slate-700">
              @for (p of radar().sla.terlambatList; track p.id) {
                <li>
                  · {{ p.judul }} — {{ p.penerimaLabel }} (tenggat {{ p.tenggatAt }})
                </li>
              }
            </ul>
          </section>
        }

        <section class="mt-6">
          <h3 class="text-sm font-extrabold uppercase tracking-wide text-slate-800">
            {{ radar().sla.terlambatList.length ? '4' : '3' }}. Agenda 7 hari (cuplikan)
          </h3>
          <ul class="mt-2 space-y-1 text-sm text-slate-700">
            @for (item of radar().agendaPreview; track item.id) {
              <li>
                · {{ item.tanggal }}{{ item.jam ? ' ' + item.jam : '' }} — {{ item.judul }}
                ({{ data.labelJenisKalender(item.jenis) }})
              </li>
            } @empty {
              <li>Tidak ada jadwal tercatat.</li>
            }
          </ul>
        </section>

        <footer class="mt-8 grid grid-cols-2 gap-6 border-t border-slate-200 pt-6 text-center text-xs text-slate-600">
          <div>
            <p class="mb-12">Mengetahui,</p>
            <p class="font-bold text-slate-900">{{ auth.currentUser()?.name }}</p>
            <p>{{ auth.currentUser()?.jabatan }}</p>
          </div>
          <div>
            <p class="mb-12">Dicetak dari JATI</p>
            <p>{{ data.formatTanggalId() }}</p>
          </div>
        </footer>
      </article>
    </div>
  `,
})
export class LaporanLurahComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  readonly radar = this.data.radarMingguan;

  cetak(): void {
    window.print();
  }
}
