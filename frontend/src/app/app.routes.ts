import { Routes } from '@angular/router';
import {
  authGuard,
  exportDaopGuard,
  exportHubGuard,
  exportPpsuGuard,
  exportPsnGuard,
  jumantikOnlyGuard,
  dataWargaGuard,
  suratKeteranganGuard,
  suratKelurahanRwGuard,
  kasRtGuard,
  kasRwGuard,
  masterDataGuard,
  psnAccessGuard,
  roleGuard,
} from './core/auth.guard';
import { DataWargaComponent } from './pages/warga/data-warga.component';
import { SuratKeteranganComponent } from './pages/warga/surat-keterangan.component';
import { SuratKeteranganCetakComponent } from './pages/warga/surat-keterangan-cetak.component';
import { KasRtComponent } from './pages/kas/kas-rt.component';
import { KasRtCetakComponent } from './pages/kas/kas-rt-cetak.component';
import { KasRwComponent } from './pages/kas/kas-rw.component';
import { KasRwCetakComponent } from './pages/kas/kas-rw-cetak.component';
import { RekapWargaRwComponent } from './pages/warga/rekap-warga-rw.component';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PsnInputComponent } from './pages/psn/psn-input.component';
import { PsnListComponent } from './pages/psn/psn-list.component';
import { PsnUndanganCetakComponent } from './pages/psn/psn-undangan-cetak.component';
import { PsnValidasiComponent } from './pages/psn/psn-validasi.component';
import { PpsuLapanganComponent } from './pages/ppsu/ppsu-lapangan.component';
import { LaporanComponent } from './pages/laporan/laporan.component';
import { LaporanResmiComponent } from './pages/laporan/laporan-resmi.component';
import { LaporanPpsuRekapComponent } from './pages/laporan/laporan-ppsu-rekap.component';
import { LaporanDaopRekapComponent } from './pages/laporan/laporan-daop-rekap.component';
import { LaporanGabunganComponent } from './pages/laporan/laporan-gabungan.component';
import { SetoranPmiBaznasComponent } from './pages/setoran/setoran-pmi-baznas.component';
import { SetoranPmiBaznasCetakComponent } from './pages/setoran/setoran-pmi-baznas-cetak.component';
import { DaopComponent } from './pages/daop/daop.component';
import { DaopCetakComponent } from './pages/daop/daop-cetak.component';
import { EkbangComponent } from './pages/ekbang/ekbang.component';
import { MasterDataComponent } from './pages/master/master-data.component';
import { SkCetakComponent } from './pages/master/sk-cetak.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { SuratKeluarComponent } from './pages/surat/surat-keluar.component';
import { PerintahComponent } from './pages/perintah/perintah.component';
import { KalenderOpsComponent } from './pages/kalender/kalender-ops.component';
import { RadarMingguanComponent } from './pages/radar/radar-mingguan.component';
import { PengaduanComponent } from './pages/pengaduan/pengaduan.component';
import { LaporanLurahComponent } from './pages/laporan/laporan-lurah.component';
import { SuratMasukComponent } from './pages/surat/surat-masuk.component';
import { SuratMasukRegisterComponent } from './pages/surat/surat-masuk-register.component';
import { SuratKelurahanRwComponent } from './pages/surat/surat-kelurahan-rw.component';
import { TamuDinasComponent } from './pages/tamu/tamu-dinas.component';
import { EventBesarComponent } from './pages/event/event-besar.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [roleGuard(['ADMIN_KEL', 'KOORD_RW', 'OP_RT'])],
      },
      {
        path: 'data-warga',
        component: DataWargaComponent,
        canActivate: [dataWargaGuard],
      },
      {
        path: 'surat-keterangan',
        component: SuratKeteranganComponent,
        canActivate: [suratKeteranganGuard],
      },
      {
        path: 'data-warga/surat-keterangan',
        component: SuratKeteranganCetakComponent,
        canActivate: [suratKeteranganGuard],
      },
      {
        path: 'surat-kelurahan-rw',
        component: SuratKelurahanRwComponent,
        canActivate: [suratKelurahanRwGuard],
      },
      {
        path: 'kas-rt',
        component: KasRtComponent,
        canActivate: [kasRtGuard],
      },
      {
        path: 'kas-rt/cetak',
        component: KasRtCetakComponent,
        canActivate: [kasRtGuard],
      },
      {
        path: 'rekap-warga-rw',
        component: RekapWargaRwComponent,
        canActivate: [kasRwGuard],
      },
      {
        path: 'kas-rw',
        component: KasRwComponent,
        canActivate: [kasRwGuard],
      },
      {
        path: 'kas-rw/cetak',
        component: KasRwCetakComponent,
        canActivate: [kasRwGuard],
      },
      {
        path: 'ekbang',
        component: EkbangComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'master',
        component: MasterDataComponent,
        canActivate: [masterDataGuard],
      },
      {
        path: 'master/sk-cetak',
        component: SkCetakComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'agenda',
        component: AgendaComponent,
        canActivate: [roleGuard(['ADMIN_KEL', 'KOORD_RW'])],
      },
      {
        path: 'perintah',
        component: PerintahComponent,
        canActivate: [roleGuard(['ADMIN_KEL', 'KOORD_RW', 'PETUGAS_PPSU'])],
      },
      {
        path: 'kalender',
        component: KalenderOpsComponent,
        canActivate: [roleGuard(['ADMIN_KEL', 'KOORD_RW'])],
      },
      {
        path: 'radar',
        component: RadarMingguanComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'laporan-lurah',
        component: LaporanLurahComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'pengaduan',
        component: PengaduanComponent,
        canActivate: [roleGuard(['ADMIN_KEL', 'KOORD_RW', 'PETUGAS_PPSU'])],
      },
      {
        path: 'surat-keluar',
        component: SuratKeluarComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'surat-masuk',
        component: SuratMasukComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'surat-masuk/register',
        component: SuratMasukRegisterComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'tamu-dinas',
        component: TamuDinasComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'event-besar',
        component: EventBesarComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'psn',
        component: PsnListComponent,
        canActivate: [psnAccessGuard],
      },
      {
        path: 'psn/input',
        component: PsnInputComponent,
        canActivate: [jumantikOnlyGuard],
      },
      {
        path: 'psn/validasi',
        component: PsnValidasiComponent,
        // Hanya Koordinator RW — Lurah cukup pantau dashboard (ABJ sudah otomatis).
        canActivate: [roleGuard(['KOORD_RW'])],
      },
      {
        path: 'psn/undangan-cetak',
        component: PsnUndanganCetakComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'ppsu',
        component: PpsuLapanganComponent,
        canActivate: [roleGuard(['PETUGAS_PPSU'])],
      },
      {
        path: 'laporan',
        component: LaporanComponent,
        canActivate: [exportHubGuard],
      },
      {
        path: 'laporan-resmi',
        component: LaporanResmiComponent,
        canActivate: [exportPsnGuard],
      },
      {
        path: 'laporan-ppsu',
        component: LaporanPpsuRekapComponent,
        canActivate: [exportPpsuGuard],
      },
      {
        path: 'laporan-daop',
        component: LaporanDaopRekapComponent,
        canActivate: [exportDaopGuard],
      },
      {
        path: 'laporan-gabungan',
        component: LaporanGabunganComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'daop',
        component: DaopComponent,
        canActivate: [roleGuard(['ADMIN_KEL', 'KOORD_RW', 'OP_RT'])],
      },
      {
        path: 'daop/cetak/:id',
        component: DaopCetakComponent,
        canActivate: [roleGuard(['ADMIN_KEL', 'KOORD_RW', 'OP_RT'])],
      },
      {
        path: 'setoran-pmi-baznas',
        component: SetoranPmiBaznasComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
      {
        path: 'setoran-pmi-baznas/cetak',
        component: SetoranPmiBaznasCetakComponent,
        canActivate: [roleGuard(['ADMIN_KEL'])],
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
