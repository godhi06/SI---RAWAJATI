import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">
            @if (auth.hasRole('ADMIN_KEL')) {
              Beranda Kelurahan
            } @else {
              Beranda
            }
          </h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">
            Kelurahan Rawajati, Kecamatan Pancoran, Kota Administrasi Jakarta Selatan
          </p>
          <p class="page-sub">
            Halo, {{ auth.currentUser()?.name }} — {{ auth.currentUser()?.jabatan }}.
            @if (auth.hasRole('ADMIN_KEL')) {
              Ringkasan pantauan lintas modul.
            }
          </p>
        </div>

      </header>

      @if (auth.hasRole('ADMIN_KEL')) {
        <section class="grid gap-4 md:grid-cols-3">
          <a
            routerLink="/app/psn"
            class="card block transition hover:border-blue-300 hover:shadow-md"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Kesra</p>
            <p class="mt-2 text-3xl font-extrabold tracking-tight" [class]="abjColor(abj().status)">
              ABJ {{ abj().abj }}%
            </p>
            <p class="mt-2 text-sm text-slate-600">
              Zona merah: <strong>{{ data.zonaMerahCount() }}</strong> RT · Positif 7 hari:
              <strong>{{ ringkas().positif }}</strong>
            </p>
            <p class="mt-3 text-sm font-semibold text-blue-700">Buka Laporan PSN →</p>
          </a>

          <a
            routerLink="/app/ekbang"
            class="card block transition hover:border-blue-300 hover:shadow-md"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Ekbang · PPSU</p>
            <p class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              {{ data.laporanKerjaBulanIni().length }}
            </p>
            <p class="mt-2 text-sm text-slate-600">
              Laporan kerja bulan ini · Alat dipinjam:
              <strong>{{ data.alatDipinjamCount() }}</strong> · Jadwal saluran:
              <strong>{{ data.saluranJadwalCount() }}</strong>
            </p>
            <p class="mt-3 text-sm font-semibold text-blue-700">Buka Pantauan PPSU →</p>
          </a>

          <a
            routerLink="/app/daop"
            class="card block transition hover:border-blue-300 hover:shadow-md"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">DAOP RT/RW</p>
            <p
              class="mt-2 text-3xl font-extrabold tracking-tight"
              [class]="data.daopBelumSetorCount() ? 'text-amber-600' : 'text-emerald-600'"
            >
              {{ data.daopBelumSetorCount() }}
            </p>
            <p class="mt-2 text-sm text-slate-600">
              Belum setor · Sudah upload TTD: <strong>{{ data.daopSudahUploadCount() }}</strong>
            </p>
            <p class="mt-3 text-sm font-semibold text-blue-700">Buka Laporan DAOP →</p>
          </a>
        </section>

        <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a routerLink="/app/kalender" class="btn-secondary text-center text-sm">Kalender Operasional</a>
          <a routerLink="/app/perintah" class="btn-secondary text-center text-sm"
            >Perintah ({{ data.perintahAktifCount() }} aktif)</a
          >
          <a routerLink="/app/psn" class="btn-secondary text-center text-sm">Laporan PSN</a>
          <a routerLink="/app/ekbang" class="btn-secondary text-center text-sm">Pantauan PPSU</a>
          <a routerLink="/app/daop" class="btn-secondary text-center text-sm">Laporan DAOP</a>
          <a routerLink="/app/agenda" class="btn-secondary text-center text-sm">Agenda Kelurahan</a>
          <a routerLink="/app/surat-keluar" class="btn-secondary text-center text-sm">Surat Keluar</a>
          <a routerLink="/app/laporan-gabungan" class="btn-secondary text-center text-sm">Rekap Gabungan</a>
        </section>

        <section class="grid gap-4 lg:grid-cols-2">
          <article class="card !p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 class="text-base font-bold text-slate-900">Perlu tindakan hari ini</h2>
                <p class="mt-0.5 text-sm text-slate-500">
                  Zona merah jentik/DBD · DAOP nunggak · alat belum kembali
                </p>
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-xs font-bold"
                [class]="
                  tindakanHariIni().length
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-800'
                "
              >
                {{ tindakanHariIni().length || '0' }} item
              </span>
            </div>
            <p class="mt-2 text-xs text-slate-500">
              Klik <strong>Blast WA</strong> untuk kirim pengingat langsung — bukan hanya buka halaman modul.
            </p>
            <ul class="mt-3 space-y-2">
              @for (item of tindakanHariIni(); track item.id) {
                <li class="rounded-xl border px-3 py-2.5" [class]="item.borderClass">
                  <div class="flex gap-3">
                    <span
                      class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold"
                      [class]="item.badgeClass"
                    >
                      {{ item.badge }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
                      <p class="text-xs text-slate-500">{{ item.meta }}</p>
                      <div class="mt-2 flex flex-wrap gap-2">
                        @if (item.waUrl) {
                          <a
                            class="btn-primary !py-1.5 !px-3 text-xs"
                            [href]="item.waUrl"
                            target="_blank"
                            rel="noopener"
                          >
                            Blast WA
                          </a>
                        } @else {
                          <span class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                            WA belum ada
                          </span>
                        }
                        <a [routerLink]="item.link" class="btn-secondary !py-1.5 !px-3 text-xs">Buka modul</a>
                      </div>
                    </div>
                  </div>
                </li>
              } @empty {
                <li class="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-sm text-slate-500">
                  Tidak ada item mendesak saat ini.
                </li>
              }
            </ul>
          </article>

          <article class="card !p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 class="text-base font-bold text-slate-900">Aktivitas terbaru</h2>
                <p class="mt-0.5 text-sm text-slate-500">PSN · DAOP upload · laporan PPSU</p>
              </div>
            </div>
            <ul class="mt-4 space-y-2">
              @for (item of aktivitasTerbaru(); track item.id) {
                <li class="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                  <div class="flex gap-3">
                    <span
                      class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold"
                      [class]="item.badgeClass"
                    >
                      {{ item.badge }}
                    </span>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
                      <p class="text-xs text-slate-500">{{ item.meta }}</p>
                    </div>
                  </div>
                </li>
              } @empty {
                <li class="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-sm text-slate-500">
                  Belum ada aktivitas tercatat.
                </li>
              }
            </ul>
          </article>
        </section>
      }

      @if (auth.isKetuaRt()) {
        <section class="grid gap-4 sm:grid-cols-2">
          <article class="card">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Status DAOP RT</p>
            <p
              class="mt-2 text-4xl font-extrabold tracking-tight"
              [class]="data.daopBelumSetorCount() ? 'text-amber-600' : 'text-emerald-600'"
            >
              {{ ringkasDaopRt().belum }} 
              <span class="text-lg font-bold text-slate-400">nunggak</span>
            </p>
            <p class="mt-3 text-sm text-slate-500">
              Sudah upload TTD: <strong>{{ ringkasDaopRt().sudah }}</strong> bulan
            </p>
          </article>
          <article class="card">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Tugas portal ini</p>
            <ul class="mt-3 space-y-2 text-sm text-slate-700">
              <li>· Cetak form DAOP bulanan RT</li>
              <li>· TTD basah, lalu upload scan dari HP</li>
              <li>· Pantau status setor / nunggak</li>
            </ul>
          </article>
        </section>
        <section>
          <a routerLink="/app/daop" class="btn-primary inline-flex text-base">Buka Laporan DAOP RT →</a>
        </section>
      }

      @if (!auth.hasRole('ADMIN_KEL') && !auth.hasRole('PETUGAS_PPSU') && !auth.isKetuaRt()) {
        <section
          class="grid gap-4"
          [class.sm:grid-cols-2]="true"
          [class.lg:grid-cols-4]="!auth.hasRole('OP_RT')"
        >
          <article class="card">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500">ABJ {{ abj().scopeLabel }}</p>
                <p class="mt-2 text-4xl font-extrabold tracking-tight" [class]="abjColor(abj().status)">
                  {{ abj().abj }}%
                </p>
              </div>
              <div
                class="kpi-icon"
                [class]="
                  abj().status === 'AMAN'
                    ? 'bg-emerald-50 text-emerald-700'
                    : abj().status === 'ZONA_MERAH'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-slate-100 text-slate-500'
                "
              >
                %
              </div>
            </div>
            <p class="mt-3">
              <span [class]="abjBadge(abj().status)">{{ data.labelZona(abj().status) }}</span>
            </p>
            <p class="mt-3 text-sm text-slate-500">
              {{ abj().bebasJentik }}/{{ abj().diperiksa }} bebas jentik · positif {{ abj().positif }}
            </p>
          </article>

          <article class="card">
            @if (auth.isKaderJumantik()) {
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Progres Pemeriksaan RT</p>
                  <p class="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                    {{ progresRt().diperiksa }}
                    <span class="text-2xl font-bold text-slate-400">/ {{ progresRt().total }}</span>
                  </p>
                </div>
                <div class="kpi-icon bg-sky-50 text-sky-700">✓</div>
              </div>
              <p class="mt-3 text-sm text-slate-500">
                {{ progresRt().diperiksa }} / {{ progresRt().total }} Bangunan sudah diperiksa
              </p>
            } @else {
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Zona Merah</p>
                  <p
                    class="mt-2 text-4xl font-extrabold tracking-tight"
                    [class]="data.zonaMerahCount() ? 'text-rose-600' : 'text-emerald-600'"
                  >
                    {{ data.zonaMerahCount() }}
                  </p>
                </div>
                <div class="kpi-icon bg-rose-50 text-rose-600">!</div>
              </div>
              <p class="mt-3 text-sm text-slate-500">RT dengan ABJ &lt; 95%</p>
            }
          </article>

          @if (!auth.isKaderJumantik()) {
            <article class="card">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Dicek 7 Hari Terakhir</p>
                  <p class="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                    {{ ringkas().dicek }}
                    <span class="text-xl font-bold text-slate-400">/ {{ ringkas().totalBangunan }}</span>
                  </p>
                </div>
                <div class="kpi-icon bg-sky-50 text-sky-700">✓</div>
              </div>
              <p class="mt-3 text-sm text-slate-500">
                {{ ringkas().belum }} bangunan belum ada laporan minggu ini
              </p>
            </article>

            <article class="card">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Positif Jentik (7 Hari)</p>
                  <p
                    class="mt-2 text-4xl font-extrabold tracking-tight"
                    [class]="ringkas().positif ? 'text-rose-600' : 'text-emerald-600'"
                  >
                    {{ ringkas().positif }}
                  </p>
                </div>
                <div class="kpi-icon bg-rose-50 text-rose-600">JN</div>
              </div>
              <p class="mt-3 text-sm text-slate-500">Bangunan dengan temuan jentik</p>
            </article>
          }
        </section>

        @if (auth.isKaderJumantik()) {
          <section class="grid gap-3 sm:grid-cols-2">
            <a routerLink="/app/psn/input" class="btn-primary text-base">Input Jumat Pagi</a>
            <a routerLink="/app/psn" class="btn-secondary text-base">Laporan PSN</a>
          </section>
        }

        @if (auth.hasRole('KOORD_RW')) {
          <section class="grid gap-3 sm:grid-cols-3">
            <a routerLink="/app/psn" class="btn-secondary text-center text-sm">Lihat Laporan PSN</a>
            <a routerLink="/app/daop" class="btn-secondary text-center text-sm">Laporan DAOP</a>
            <a routerLink="/app/laporan" class="btn-secondary text-center text-sm">Export Laporan</a>
          </section>
        }

        <section class="grid gap-6 lg:grid-cols-5">
          <article class="card lg:col-span-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-bold text-slate-900">Perbandingan ABJ per RT</h2>
              <span class="text-sm text-slate-500">Aman ≥ 95%</span>
            </div>
            <div class="mt-4 space-y-3">
              @for (row of abjRows(); track row.rtId) {
                <div
                  class="rounded-xl border p-3"
                  [class]="
                    row.status === 'ZONA_MERAH' ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-slate-50/50'
                  "
                >
                  <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span class="font-semibold text-slate-800">
                      {{ row.scopeLabel }}
                      <span class="ml-2" [class]="abjBadge(row.status)">{{ data.labelZona(row.status) }}</span>
                    </span>
                    <span class="font-bold" [class]="abjColor(row.status)">
                      @if (row.diperiksa === 0) {
                        0% · 0 bangunan
                      } @else {
                        {{ row.abj }}% · {{ row.diperiksa }} bangunan
                      }
                    </span>
                  </div>
                  <div class="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [class]="barClass(row.status)"
                      [style.width.%]="row.diperiksa ? row.abj : 0"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </article>

          <div class="space-y-6 lg:col-span-2">
            @if (!auth.isKaderJumantik()) {
              <article class="card">
                <h2 class="text-lg font-bold text-slate-900">Kontak RT Zona Merah</h2>
                <p class="mt-1 text-sm text-slate-500">Hubungi Ketua RT untuk follow-up Jumat pagi.</p>
                <ul class="mt-4 space-y-2.5">
                  @for (rt of rtZonaMerah(); track rt.rtId) {
                    <li class="rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-3">
                      <p class="font-semibold text-slate-900">{{ rt.label }} · ABJ {{ rt.abj }}%</p>
                      <p class="mt-1 text-sm text-slate-600">Ketua RT: {{ rt.namaKetua }}</p>
                      <a
                        class="mt-2 inline-flex text-sm font-bold text-blue-700"
                        [href]="'https://wa.me/62' + waDigits(rt.telepon)"
                        target="_blank"
                        rel="noopener"
                      >
                        WA {{ rt.telepon }}
                      </a>
                    </li>
                  } @empty {
                    <li class="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                      Tidak ada RT zona merah saat ini.
                    </li>
                  }
                </ul>
              </article>
            }

            <article class="card">
              <h2 class="text-lg font-bold text-slate-900">Riwayat Laporan Terbaru</h2>
              <p class="mt-1 text-sm text-slate-500">History laporan PSN (5 terakhir).</p>
              <ul class="mt-4 space-y-2.5">
                @for (item of recentKesra(); track item.id) {
                  <li class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p class="font-semibold text-slate-900">{{ item.title }}</p>
                    <p class="text-sm text-slate-500">{{ item.meta }}</p>
                  </li>
                } @empty {
                  <li class="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                    Belum ada laporan.
                  </li>
                }
              </ul>
              <div class="mt-4 grid gap-2">
                <a routerLink="/app/psn" class="btn-secondary w-full text-sm">Lihat Semua Laporan PSN</a>
              </div>
            </article>
          </div>
        </section>
      }
    </div>
  `,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  /** Inbox tindakan untuk staf kelurahan — aksi utama = Blast WA. */
  readonly tindakanHariIni = computed(() => {
    type Item = {
      id: string;
      title: string;
      meta: string;
      link: string;
      waUrl: string | null;
      badge: string;
      badgeClass: string;
      borderClass: string;
    };
    const items: Item[] = [];

    for (const rt of this.data.rtZonaMerahKontak().slice(0, 4)) {
      const text =
        `Assalamu'alaikum wr. wb.\n\n` +
        `Yth. Bapak/Ibu ${rt.namaKetua}\nKetua RT ${rt.label}\n\n` +
        `Dengan hormat, kami dari Kelurahan Rawajati menyampaikan bahwa wilayah Bapak/Ibu ` +
        `saat ini berstatus zona merah jentik (ABJ ${rt.abj}%).\n\n` +
        `Mohon kesediaan untuk mengintensifkan Jumat PSN / pemeriksaan jentik dan melaporkan ` +
        `hasilnya melalui SI-RAWAJATI.\n\n` +
        `Terima kasih.\nKelurahan Rawajati`;
      items.push({
        id: `zm-${rt.rtId}`,
        title: `${rt.label} · ABJ ${rt.abj}% zona merah`,
        meta: `Risiko jentik/DBD · Ketua RT ${rt.namaKetua} · WA ${rt.telepon}`,
        link: '/app/psn',
        waUrl: this.buildWaUrl(rt.telepon, text),
        badge: 'DBD',
        badgeClass: 'bg-rose-100 text-rose-800',
        borderClass: 'border-rose-200 bg-rose-50/40',
      });
    }

    const daopBelum = this.data
      .laporanKeuanganRts()
      .filter((l) => l.status === 'BELUM_SETOR')
      .sort((a, b) => b.tahun - a.tahun || b.bulan - a.bulan)
      .slice(0, 4);
    for (const d of daopBelum) {
      const wilayah = this.data.labelDaopWilayah(d);
      const ketua = this.data.labelDaopKetua(d);
      const telepon =
        d.tingkat === 'RW'
          ? this.data.getRw(d.rwId)?.telepon
          : this.data.getRt(d.rtId || '')?.telepon;
      const jabatan = d.tingkat === 'RW' ? 'Ketua RW' : 'Ketua RT';
      const text =
        `Assalamu'alaikum wr. wb.\n\n` +
        `Yth. Bapak/Ibu ${ketua}\n${jabatan} ${wilayah.replace(' (Ketua RW)', '')}\n\n` +
        `Dengan hormat, kami dari Kelurahan Rawajati mengingatkan kewajiban Laporan DAOP ` +
        `periode ${d.periodeLabel} yang belum kami terima.\n\n` +
        `Mohon setor ke kelurahan (TTD + stempel basah) atau upload scan di SI-RAWAJATI.\n\n` +
        `Terima kasih.\nKelurahan Rawajati`;
      items.push({
        id: `daop-${d.id}`,
        title: `DAOP belum setor · ${wilayah}`,
        meta: `${d.periodeLabel} · ${ketua} · WA ${telepon || '—'}`,
        link: '/app/daop',
        waUrl: this.buildWaUrl(telepon, text),
        badge: 'DAOP',
        badgeClass: 'bg-amber-100 text-amber-900',
        borderClass: 'border-amber-200 bg-amber-50/40',
      });
    }

    const alat = this.data.asetPpsus().filter((a) => a.statusPinjam === 'DIPINJAM').slice(0, 3);
    for (const a of alat) {
      const peminjam = this.data
        .users()
        .find((u) => u.name === a.dipinjamOleh || u.id === a.dipinjamOleh);
      const telepon = peminjam?.telepon;
      const nama = a.dipinjamOleh || 'petugas';
      const text =
        `Assalamu'alaikum wr. wb.\n\n` +
        `Yth. Bapak/Ibu ${nama}\n\n` +
        `Pengingat dari Kelurahan Rawajati: alat ${a.namaAlat} (${a.kodeAset}) ` +
        `masih tercatat dipinjam. Mohon dikembalikan ke gudang PPSU.\n\n` +
        `Terima kasih.\nKelurahan Rawajati`;
      items.push({
        id: `alat-${a.id}`,
        title: `${a.namaAlat} belum kembali`,
        meta: `Dipinjam ${nama} · ${a.kodeAset} · WA ${telepon || '—'}`,
        link: '/app/ekbang',
        waUrl: this.buildWaUrl(telepon, text),
        badge: 'ALAT',
        badgeClass: 'bg-indigo-100 text-indigo-800',
        borderClass: 'border-indigo-200 bg-indigo-50/40',
      });
    }

    return items.slice(0, 8);
  });

  /** Feed aktivitas lintas modul untuk staf kelurahan. */
  readonly aktivitasTerbaru = computed(() => {
    type Row = { id: string; title: string; meta: string; at: string; badge: string; badgeClass: string };
    const rows: Row[] = [];

    for (const l of this.data.laporanPsns()) {
      rows.push({
        id: `psn-${l.id}`,
        title: `PSN ${this.data.labelWilayah(l.rtId)} — ${l.statusJentik === 'ADA' ? 'positif jentik' : 'bebas jentik'}`,
        meta: `${l.pelaporNama || 'Kader'} · ${this.data.labelStatusLaporanPsn(l.statusLaporan)}`,
        at: l.createdAt,
        badge: 'PSN',
        badgeClass: 'bg-emerald-100 text-emerald-800',
      });
    }

    for (const d of this.data.laporanKeuanganRts()) {
      if (d.status === 'SUDAH_UPLOAD_TTD' && d.scanUploadedAt) {
        rows.push({
          id: `up-${d.id}`,
          title: `DAOP upload · ${this.data.labelDaopWilayah(d)}`,
          meta: `${d.periodeLabel} · ${d.diuploadOleh || this.data.labelDaopKetua(d)}`,
          at: d.scanUploadedAt,
          badge: 'DAOP',
          badgeClass: 'bg-amber-100 text-amber-900',
        });
      } else if (d.status === 'SUDAH_CETAK' && d.dicetakAt) {
        rows.push({
          id: `ct-${d.id}`,
          title: `DAOP dicetak · ${this.data.labelDaopWilayah(d)}`,
          meta: `${d.periodeLabel} · menunggu scan TTD`,
          at: d.dicetakAt,
          badge: 'DAOP',
          badgeClass: 'bg-slate-200 text-slate-700',
        });
      }
    }

    for (const p of this.data.laporanKerjaPpsus()) {
      rows.push({
        id: `ppsu-${p.id}`,
        title: `PPSU · ${p.petugasNama} lapor kerja`,
        meta: `${p.lokasi} · ${p.reguLabel}`,
        at: p.createdAt,
        badge: 'PPSU',
        badgeClass: 'bg-indigo-100 text-indigo-800',
      });
    }

    return rows
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        title: r.title,
        meta: `${this.formatTs(r.at)} · ${r.meta}`,
        badge: r.badge,
        badgeClass: r.badgeClass,
      }));
  });

  readonly abj = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return this.data.hitungAbj();
    if (user.role === 'OP_RT' && user.rtId) return this.data.hitungAbj({ rtId: user.rtId });
    if (user.role === 'KOORD_RW' && user.rwId) return this.data.hitungAbj({ rwId: user.rwId });
    return this.data.hitungAbj();
  });

  readonly progresRt = computed(() => {
    const rtId = this.auth.currentUser()?.rtId;
    if (!rtId) return { diperiksa: 0, total: 0 };
    const total = this.data.rumahByRt(rtId).length;
    const diperiksa = this.data.hitungAbj({ rtId }).diperiksa;
    return { diperiksa, total };
  });

  readonly ringkas = computed(() => this.data.ringkasKesraMingguIni());

  readonly ringkasDaopRt = computed(() => {
    const rtId = this.auth.currentUser()?.rtId;
    const list = this.data.laporanKeuanganRts().filter((l) => l.rtId === rtId && l.tingkat !== 'RW');
    return {
      belum: list.filter((l) => l.status === 'BELUM_SETOR').length,
      sudah: list.filter((l) => l.status === 'SUDAH_UPLOAD_TTD').length,
    };
  });

  readonly rtZonaMerah = computed(() => {
    const user = this.auth.currentUser();
    let list = this.data.rtZonaMerahKontak();
    if (user?.role === 'KOORD_RW' && user.rwId) {
      const ids = this.data
        .rts()
        .filter((r) => r.rwId === user.rwId)
        .map((r) => r.id);
      list = list.filter((r) => ids.includes(r.rtId));
    }
    return list;
  });

  readonly abjRows = computed(() => {
    const user = this.auth.currentUser();
    let rows = this.data.abjPerRt();
    if (user?.role === 'OP_RT' && user.rtId) rows = rows.filter((r) => r.rtId === user.rtId);
    if (user?.role === 'KOORD_RW' && user.rwId) {
      rows = rows.filter((r) => r.rwId === user.rwId);
    }
    return rows;
  });

  abjColor(status: string): string {
    if (status === 'AMAN') return 'text-emerald-600';
    if (status === 'ZONA_MERAH') return 'text-rose-600';
    return 'text-slate-500';
  }

  abjBadge(status: string): string {
    if (status === 'AMAN') return 'badge-ok';
    if (status === 'ZONA_MERAH') return 'badge-danger';
    return 'badge-muted';
  }

  barClass(status: string): string {
    if (status === 'AMAN') return 'bg-emerald-500';
    if (status === 'ZONA_MERAH') return 'bg-rose-500';
    return 'bg-slate-300';
  }

  waDigits(telepon: string): string {
    return telepon.replace(/\D/g, '').replace(/^0/, '');
  }

  private toWaPhone(raw?: string): string {
    return (raw || '').replace(/\D/g, '').replace(/^0/, '62');
  }

  /** Link wa.me siap kirim; null jika nomor kosong. */
  buildWaUrl(telepon: string | undefined, text: string): string | null {
    const phone = this.toWaPhone(telepon);
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  recentKesra(): Array<{ id: string; title: string; meta: string }> {
    const user = this.auth.currentUser();
    let list = [...this.data.laporanPsns()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (user?.role === 'OP_RT' && user.rtId) {
      list = list.filter((l) => l.rtId === user.rtId);
    } else if (user?.role === 'KOORD_RW' && user.rwId) {
      const rtIds = this.data
        .rts()
        .filter((r) => r.rwId === user.rwId)
        .map((r) => r.id);
      list = list.filter((l) => rtIds.includes(l.rtId));
    }
    return list.slice(0, 5).map((l) => ({
      id: l.id,
      title: `PSN ${this.data.labelWilayah(l.rtId)} — ${l.statusJentik === 'ADA' ? 'Positif jentik' : 'Bebas jentik'}`,
      meta: `${this.formatTs(l.createdAt)} · ${this.data.labelStatusLaporanPsn(l.statusLaporan)}`,
    }));
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
}
