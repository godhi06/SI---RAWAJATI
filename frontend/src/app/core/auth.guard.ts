import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login']);
};

export const roleGuard = (roles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
    if (auth.hasRole(...roles)) return true;
    return router.createUrlTree(['/app/dashboard']);
  };
};

/** Laporan/input PSN: staf/RW, atau hanya kader Jumantik (bukan Ketua RT). */
export const psnAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.hasRole('ADMIN_KEL', 'KOORD_RW')) return true;
  if (auth.isKaderJumantik()) return true;
  const user = auth.currentUser();
  return router.createUrlTree([user ? auth.homePathForUser(user) : '/app/dashboard']);
};

/** Input Jumat PSN: khusus kader Jumantik. */
export const jumantikOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.isKaderJumantik()) return true;
  const user = auth.currentUser();
  return router.createUrlTree([user ? auth.homePathForUser(user) : '/app/dashboard']);
};

/** Master Data: staf kelurahan (penuh) atau Ketua Bidang PPSU (alat + petugas). */
export const masterDataGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.canAccessMasterData()) return true;
  const user = auth.currentUser();
  return router.createUrlTree([user ? auth.homePathForUser(user) : '/app/dashboard']);
};

/** Export hub: staf kelurahan, Ketua RW (terbatas), Ketua Bidang PPSU. */
export const exportHubGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.canAccessExportHub()) return true;
  return router.createUrlTree([auth.homePathForUser(auth.currentUser()!)]);
};

export const exportPsnGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.canExportPsn()) return true;
  return router.createUrlTree(['/app/laporan']);
};

export const exportDaopGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.canExportDaop()) return true;
  return router.createUrlTree(['/app/laporan']);
};

export const exportPpsuGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.canExportPpsu()) return true;
  return router.createUrlTree(['/app/laporan']);
};
