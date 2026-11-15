import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserAccount, UserRole } from './models';
import { DataService } from './data.service';

const STORAGE_KEY = 'sim_kelurahan_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<UserAccount | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.currentUserSignal());
  readonly role = computed(() => this.currentUserSignal()?.role ?? null);

  constructor(
    private readonly data: DataService,
    private readonly router: Router,
  ) {
    this.currentUserSignal.set(this.readSession());
  }

  login(email: string, password: string): { ok: boolean; message: string } {
    const user = this.data.findUser(email.trim(), password);
    if (!user) {
      return { ok: false, message: 'Email atau kata sandi tidak sesuai.' };
    }
    this.currentUserSignal.set(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id }));
    return { ok: true, message: 'Berhasil masuk.' };
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(STORAGE_KEY);
    void this.router.navigateByUrl('/login');
  }

  homePathForRole(role: UserRole): string {
    if (role === 'PETUGAS_PPSU') return '/app/ppsu';
    if (role === 'KOORD_RW') return '/app/daop';
    if (role === 'OP_RT') return '/app/dashboard';
    return '/app/dashboard';
  }

  /** Landing demo sesuai peran nyata (kader keliling ≠ ketua RT). */
  homePathForUser(user: { role: UserRole; email: string; jabatan?: string }): string {
    if (user.email === 'jumantik@kelurahan.id' || /jumantik/i.test(user.jabatan || '')) {
      return '/app/psn/input';
    }
    if (user.email === 'dasawisma@kelurahan.id' || /dasawisma|pkk/i.test(user.jabatan || '')) {
      return '/app/data-warga';
    }
    if (user.email === 'rt01@kelurahan.id' || /^Ketua RT/i.test(user.jabatan || '')) {
      return '/app/data-warga';
    }
    return this.homePathForRole(user.role);
  }

  quickLogin(email: string): void {
    const user = this.data.users().find((u) => u.email === email);
    if (!user) return;
    this.login(user.email, user.password);
    void this.router.navigateByUrl(this.homePathForUser(user));
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.currentUserSignal()?.role;
    return !!role && roles.includes(role);
  }

  /** Staf kelurahan: Lurah, Sekkel, Kasi (semua ADMIN_KEL) — bukan hanya Sekkel. */
  isStafKelurahan(): boolean {
    return this.hasRole('ADMIN_KEL');
  }

  /** Kader Jumantik keliling rumah (bukan Ketua RT). */
  readonly isKaderJumantikUser = computed(() => {
    const u = this.currentUserSignal();
    if (!u || u.role !== 'OP_RT') return false;
    return /jumantik/i.test(u.jabatan || '') || /jumantik/i.test(u.email || '');
  });

  /** Kader Dasawisma / PKK — bantu pendataan warga, verifikasi tetap Ketua RT. */
  readonly isDasawismaUser = computed(() => {
    const u = this.currentUserSignal();
    if (!u || u.role !== 'OP_RT') return false;
    return /dasawisma|pkk/i.test(u.jabatan || '') || /dasawisma/i.test(u.email || '');
  });

  /** Ketua RT: DAOP + buku warga (bukan Jumantik / Dasawisma). */
  readonly isKetuaRtUser = computed(() => {
    const u = this.currentUserSignal();
    if (!u || u.role !== 'OP_RT') return false;
    return !this.isKaderJumantikUser() && !this.isDasawismaUser();
  });

  isKaderJumantik(): boolean {
    return this.isKaderJumantikUser();
  }

  isDasawisma(): boolean {
    return this.isDasawismaUser();
  }

  isKetuaRt(): boolean {
    return this.isKetuaRtUser();
  }

  /** Buku data warga digital: Lurah, RW (rekap), Ketua RT, Dasawisma. */
  canAccessDataWarga(): boolean {
    return (
      this.isStafKelurahan() ||
      this.hasRole('KOORD_RW') ||
      this.isKetuaRtUser() ||
      this.isDasawismaUser()
    );
  }

  /** Surat Keterangan SK/SKD/kematian: urusan RT (+ Dasawisma / staf). Bukan Ketua RW. */
  canAccessSuratKeterangan(): boolean {
    return this.isStafKelurahan() || this.isKetuaRtUser() || this.isDasawismaUser();
  }

  /**
   * Inbox surat dari kelurahan (undangan/kerja bakti):
   * Ketua RW & Ketua RT menerima di portal; LMK via WA langsung dari kelurahan.
   */
  canAccessSuratDariKelurahan(): boolean {
    return this.isStafKelurahan() || this.hasRole('KOORD_RW') || this.isKetuaRtUser();
  }

  /** @deprecated pakai canAccessSuratDariKelurahan */
  canAccessSuratKelurahanRw(): boolean {
    return this.canAccessSuratDariKelurahan();
  }

  /** Kas RT (iuran + buku kas): Ketua RT & staf. RW pakai Kas RW + rekap. */
  canAccessKasRt(): boolean {
    return this.isStafKelurahan() || this.isKetuaRtUser();
  }

  /** Rekap warga & Kas RW: Ketua RW + staf kelurahan. */
  canAccessKasRw(): boolean {
    return this.isStafKelurahan() || this.hasRole('KOORD_RW');
  }

  /** Verifikasi laporan kos / sahkan data: Ketua RT atau staf kelurahan. */
  canVerifikasiWarga(): boolean {
    return this.isStafKelurahan() || this.isKetuaRtUser();
  }

  /**
   * Koordinator / Ketua Bidang PPSU (boleh cetak rekap PPSU).
   * Anggota lapangan biasa tidak ikut.
   */
  isKetuaBidangPpsu(): boolean {
    const u = this.currentUserSignal();
    if (!u || u.role !== 'PETUGAS_PPSU') return false;
    return (
      u.email === 'ppsu.koord@kelurahan.id' ||
      /ketua bidang|koordinator ppsu/i.test(u.jabatan || '')
    );
  }

  /** Buka halaman Export Laporan. */
  canAccessExportHub(): boolean {
    return this.isStafKelurahan() || this.hasRole('KOORD_RW') || this.isKetuaBidangPpsu();
  }

  /** Cetak PDF ABJ / undangan PSN. */
  canExportPsn(): boolean {
    return this.isStafKelurahan() || this.hasRole('KOORD_RW');
  }

  /** Cetak rekap DAOP keseluruhan. */
  canExportDaop(): boolean {
    return this.isStafKelurahan() || this.hasRole('KOORD_RW');
  }

  /** Cetak rekap PPSU: staf kelurahan + Ketua Bidang PPSU. */
  canExportPpsu(): boolean {
    return this.isStafKelurahan() || this.isKetuaBidangPpsu();
  }

  /**
   * Master Data penuh (RW/RT/Jumantik/Template DAOP/dll): hanya staf kelurahan.
   * Ketua Bidang PPSU tidak ikut — supaya tidak mengedit wilayah/akun di luar PPSU.
   */
  canAccessMasterFull(): boolean {
    return this.isStafKelurahan();
  }

  /**
   * Master terbatas PPSU: stok alat + akun petugas PPSU.
   * Untuk Ketua Bidang (koordinator) dan staf kelurahan.
   */
  canAccessMasterPpsu(): boolean {
    return this.isStafKelurahan() || this.isKetuaBidangPpsu();
  }

  /** Buka halaman Master Data (penuh atau terbatas PPSU). */
  canAccessMasterData(): boolean {
    return this.canAccessMasterFull() || this.canAccessMasterPpsu();
  }

  private readSession(): UserAccount | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id: string };
      return this.data.users().find((u) => u.id === parsed.id) ?? null;
    } catch {
      return null;
    }
  }
}
