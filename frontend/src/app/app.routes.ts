import { Routes } from '@angular/router';
import {
  authGuard,
  exportDaopGuard,
  exportHubGuard,
  exportPpsuGuard,
  exportPsnGuard,
  jumantikOnlyGuard,
  masterDataGuard,
  psnAccessGuard,
  roleGuard,
} from './core/auth.guard';
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
import { AgendaComponent } from './pages/agenda/agenda.component';
import { SuratKeluarComponent } from './pages/surat/surat-keluar.component';
import { PerintahComponent } from './pages/perintah/perintah.component';
import { KalenderOpsComponent } from './pages/kalender/kalender-ops.component';

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
        path: 'surat-keluar',
        component: SuratKeluarComponent,
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
