import { Injectable, computed, signal } from '@angular/core';
import { createDemoSeed, KELURAHAN_DEMO } from './demo-seed';
import {
  AbjSummary,
  AgendaRapat,
  AsetPpsu,
  DemoAccount,
  FotoKerjaSlot,
  JenisKerjaPpsu,
  JenisKegiatanAgenda,
  JenisPesertaAgenda,
  KategoriBangunan,
  KategoriTugasPpsu,
  JenisLaporanKeuanganRt,
  KegiatanSaluran,
  KerjaBaktiRw,
  KodeSuratKeluar,
  KondisiAset,
  LaporanKeuanganRt,
  LaporanKerjaPpsu,
  LaporanPsn,
  PesertaAgenda,
  RekapMapPmi,
  RumahWarga,
  Rt,
  Rw,
  SetoranSosial,
  JenisSetoranSosial,
  SumberSetoranSosial,
  StatusAgendaRapat,
  StatusJentik,
  StatusKegiatan,
  StatusKerjaBakti,
  StatusLaporanKeuanganRt,
  StatusLaporanPsn,
  StatusPinjamAlat,
  StatusVerifikasi,
  SuratKeluar,
  TemplateDaopKosong,
  UndanganPsnDraft,
  UndanganPsnKirim,
  UndanganPsnPdf,
  UserAccount,
  WargaPendatang,
  ZonaAbj,
} from './models';

@Injectable({ providedIn: 'root' })
export class DataService {
  readonly kelurahan = KELURAHAN_DEMO;

  readonly rws = signal<Rw[]>([]);
  readonly rts = signal<Rt[]>([]);
  readonly users = signal<UserAccount[]>([]);
  readonly rumahWargas = signal<RumahWarga[]>([]);
  readonly laporanPsns = signal<LaporanPsn[]>([]);
  readonly wargaPendatangs = signal<WargaPendatang[]>([]);
  readonly asetPpsus = signal<AsetPpsu[]>([]);
  readonly kegiatanSalurans = signal<KegiatanSaluran[]>([]);
  readonly laporanKerjaPpsus = signal<LaporanKerjaPpsu[]>([]);
  readonly laporanKeuanganRts = signal<LaporanKeuanganRt[]>([]);
  readonly agendaRapats = signal<AgendaRapat[]>([]);
  readonly kerjaBaktiRws = signal<KerjaBaktiRw[]>([]);
  readonly suratKeluars = signal<SuratKeluar[]>([]);
  readonly setoranSosials = signal<SetoranSosial[]>([]);
  readonly rekapMapPmis = signal<RekapMapPmi[]>([]);
  /** Nominal wajib BAZNAS + 1 kupon (kebiasaan Rawajati). */
  readonly nominalWajibBaznas = 100_000;
  /** Detail undangan PSN (untuk cetak template + blast WA). */
  readonly undanganPsnDraft = signal<UndanganPsnDraft>({
    nomorSurat: '005/PSN/RWJ/XI/2026',
    hariTanggal: 'Jumat, 21 November 2026',
    jam: '09.00 WIB s.d. selesai',
    tempat: 'Aula / Ruang Rapat Kelurahan Rawajati',
    agenda:
      'Evaluasi Jumat PSN Jumantik, ABJ per RW, serta rencana tindak lanjut zona waspada.',
  });
  /** Surat undangan PDF pertemuan PSN (diunggah staf kelurahan). */
  readonly undanganPsnPdf = signal<UndanganPsnPdf | null>(null);
  /**
   * Template kosong DAOP resmi (Word) — diunggah Lurah / staf kelurahan.
   * Ketua RT/RW mengunduh file ini (bukan form generate demo) jika sudah ada.
   */
  readonly templateDaopKosong = signal<TemplateDaopKosong | null>(null);
  /** Riwayat kirim undangan (teks + PDF) ke Ketua RW. */
  readonly undanganPsnKiriman = signal<UndanganPsnKirim[]>([]);
  /**
   * Demo = wa.me (teks) + unduh PDF.
   * Ganti ke WA_BUSINESS_API saat kelurahan punya akun API (teks+PDF otomatis).
   */
  readonly undanganPsnChannel: 'DEMO_WA_ME' | 'WA_BUSINESS_API' = 'DEMO_WA_ME';
  readonly toast = signal<string | null>(null);

  readonly lokasiKerjaOptions = [
    'Jl. Rawajati Timur',
    'Jl. Rawajati Barat',
    'Jl. Binawarga',
    'Area Stasiun Duren Kalibata',
  ];

  readonly demoAccounts: DemoAccount[] = [
    {
      label: 'Lurah / Kasi Ekbang & Kesra',
      email: 'lurah@kelurahan.id',
      password: 'admin123',
      role: 'ADMIN_KEL',
      description: 'Dashboard pimpinan: tab Kesra & Ekbang',
    },
    {
      label: 'Kader Jumantik RT001/RW 07 — Sari',
      email: 'jumantik@kelurahan.id',
      password: 'jumantik123',
      role: 'OP_RT',
      description: 'Keliling rumah: input Jumat PSN + foto jentik',
    },
    {
      label: 'Ketua RT001/RW 07 — Muhamad Ardhi',
      email: 'rt01@kelurahan.id',
      password: 'rt123',
      role: 'OP_RT',
      description: 'Setor DAOP digital (bukan keliling rumah)',
    },
    {
      label: 'Ketua RW 07 — Agus Salim',
      email: 'rw07@kelurahan.id',
      password: 'rw123',
      role: 'KOORD_RW',
      description: 'Setor DAOP RW + pantau RT wilayah',
    },
    {
      label: 'Anggota / Petugas PPSU Lapangan',
      email: 'ppsu@kelurahan.id',
      password: 'ppsu123',
      role: 'PETUGAS_PPSU',
      description: 'Lapor kerja Non-CRM & gudang alat',
    },
  ];

  readonly pendingKosCount = computed(
    () => this.wargaPendatangs().filter((w) => w.statusVerifikasi === 'PENDING').length,
  );

  readonly pendingPsnCount = computed(
    () =>
      this.laporanPsns().filter((l) =>
        ['SUBMITTED', 'MENUNGGU_VERIFIKASI'].includes(l.statusLaporan),
      ).length,
  );

  readonly totalWargaPendatang = computed(() => this.wargaPendatangs().length);

  readonly asetRusakCount = computed(
    () =>
      this.asetPpsus().filter(
        (a) =>
          a.statusPinjam === 'RUSAK' ||
          (a.jumlahRusakRingan || 0) + (a.jumlahRusakBerat || 0) + (a.jumlahHilang || 0) > 0,
      ).length,
  );

  /** Total stok dari rincian kondisi. */
  totalJumlahAset(a: Pick<AsetPpsu, 'jumlahBaik' | 'jumlahRusakRingan' | 'jumlahRusakBerat' | 'jumlahHilang'>): number {
    return (
      (a.jumlahBaik || 0) +
      (a.jumlahRusakRingan || 0) +
      (a.jumlahRusakBerat || 0) +
      (a.jumlahHilang || 0)
    );
  }

  /** Kondisi ringkas: prioritas terburuk yang masih ada stok. */
  ringkasKondisiAset(a: Pick<AsetPpsu, 'jumlahBaik' | 'jumlahRusakRingan' | 'jumlahRusakBerat' | 'jumlahHilang'>): KondisiAset {
    if ((a.jumlahHilang || 0) > 0) return 'HILANG';
    if ((a.jumlahRusakBerat || 0) > 0) return 'RUSAK_BERAT';
    if ((a.jumlahRusakRingan || 0) > 0) return 'RUSAK_RINGAN';
    return 'BAIK';
  }

  readonly saluranSelesaiCount = computed(
    () => this.kegiatanSalurans().filter((k) => k.statusKegiatan === 'SELESAI').length,
  );

  readonly saluranJadwalCount = computed(
    () => this.kegiatanSalurans().filter((k) => k.statusKegiatan === 'DIJADWALKAN').length,
  );

  readonly zonaMerahCount = computed(
    () => this.abjPerRt().filter((r) => r.status === 'ZONA_MERAH').length,
  );

  /** Ringkas Kesra: bangunan dicek & positif jentik 7 hari terakhir. */
  readonly ringkasKesraMingguIni = computed(() => {
    const batas = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const laporan = this.laporanPsns().filter((l) => {
      if (!['SUBMITTED', 'VALIDATED_RW', 'LOCKED'].includes(l.statusLaporan)) return false;
      const t = new Date(l.createdAt).getTime();
      return t >= batas;
    });

    const latestByRumah = new Map<string, (typeof laporan)[0]>();
    for (const item of [...laporan].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const key = item.rumahWargaId ?? item.id;
      latestByRumah.set(key, item);
    }
    const unique = [...latestByRumah.values()];
    const dicek = unique.length;
    const positif = unique.filter((l) => l.statusJentik === 'ADA').length;
    const totalBangunan = this.rumahWargas().filter((r) => r.isActive).length;
    return { dicek, positif, totalBangunan, belum: Math.max(0, totalBangunan - dicek) };
  });

  /** RT zona merah + kontak Ketua RT untuk pantauan Kesra. */
  readonly rtZonaMerahKontak = computed(() =>
    this.abjPerRt()
      .filter((r) => r.status === 'ZONA_MERAH')
      .map((r) => {
        const rt = this.getRt(r.rtId);
        return {
          rtId: r.rtId,
          label: r.scopeLabel,
          abj: r.abj,
          namaKetua: rt?.namaKetua ?? '—',
          telepon: rt?.telepon ?? '—',
        };
      }),
  );

  readonly laporanKerjaBulanIni = computed(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return this.laporanKerjaPpsus().filter((l) => {
      const d = new Date(l.createdAt);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  });

  readonly alatDipinjamCount = computed(
    () => this.asetPpsus().filter((a) => a.statusPinjam === 'DIPINJAM').length,
  );

  readonly daopBelumSetorCount = computed(
    () => this.laporanKeuanganRts().filter((l) => l.status === 'BELUM_SETOR').length,
  );

  readonly daopSudahUploadCount = computed(
    () => this.laporanKeuanganRts().filter((l) => l.status === 'SUDAH_UPLOAD_TTD').length,
  );

  constructor() {
    this.applySeed(createDemoSeed());
  }

  resetDemo(): void {
    this.applySeed(createDemoSeed());
    this.showToast('Data demo dikembalikan ke kondisi awal.');
  }

  private applySeed(seed: ReturnType<typeof createDemoSeed>): void {
    this.rws.set(structuredClone(seed.rws));
    this.rts.set(structuredClone(seed.rts));
    this.users.set(structuredClone(seed.users));
    this.rumahWargas.set(structuredClone(seed.rumahWargas));
    // Demo: setiap laporan PSN punya foto bukti (form kader kini wajib foto).
    this.laporanPsns.set(
      structuredClone(seed.laporanPsns).map((l, i) =>
        l.fotoName
          ? l
          : {
              ...l,
              fotoName: `bukti-jentik-${l.id}.jpg`,
              fotoTimestamp: l.createdAt,
              fotoLatitude: Number((-6.2568 + (i % 7) * 0.00012).toFixed(6)),
              fotoLongitude: Number((106.8542 + (i % 5) * 0.0001).toFixed(6)),
            },
      ),
    );
    this.wargaPendatangs.set(structuredClone(seed.wargaPendatangs));
    this.asetPpsus.set(structuredClone(seed.asetPpsus));
    this.kegiatanSalurans.set(structuredClone(seed.kegiatanSalurans));
    this.laporanKerjaPpsus.set(structuredClone(seed.laporanKerjaPpsus));
    this.laporanKeuanganRts.set(structuredClone(seed.laporanKeuanganRts));
    this.agendaRapats.set(structuredClone(seed.agendaRapats));
    this.kerjaBaktiRws.set(structuredClone(seed.kerjaBaktiRws));
    this.suratKeluars.set(structuredClone(seed.suratKeluars));
    this.setoranSosials.set(structuredClone(seed.setoranSosials));
    this.rekapMapPmis.set(structuredClone(seed.rekapMapPmis));
  }

  findUser(email: string, password: string): UserAccount | undefined {
    return this.users().find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
  }

  getUser(id: string): UserAccount | undefined {
    return this.users().find((u) => u.id === id);
  }

  /** Kader Jumantik (OP_RT + label jumantik), bukan Ketua RT. */
  isStaffJumantik(u: UserAccount): boolean {
    if (u.role !== 'OP_RT') return false;
    return /jumantik/i.test(u.jabatan || '') || /jumantik/i.test(u.email || '');
  }

  isPetugasPpsu(u: UserAccount): boolean {
    return u.role === 'PETUGAS_PPSU';
  }

  /** Power user: tambah akun petugas (Jumantik / PPSU / dll). */
  addUser(
    input: Omit<UserAccount, 'id' | 'kelurahanId'> & { kelurahanId?: string },
  ): UserAccount | null {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const password = input.password.trim();
    if (!email || !name || !password) {
      this.showToast('Nama, email, dan kata sandi wajib diisi.');
      return null;
    }
    if (this.users().some((u) => u.email.toLowerCase() === email)) {
      this.showToast('Email sudah terpakai.');
      return null;
    }
    const row: UserAccount = {
      id: `u-${Date.now()}`,
      kelurahanId: input.kelurahanId || this.kelurahan.id,
      name,
      email,
      password,
      role: input.role,
      jabatan: input.jabatan.trim() || input.role,
      rwId: input.rwId,
      rtId: input.rtId,
      reguPpsu: input.reguPpsu?.trim() || undefined,
      telepon: input.telepon?.trim() || undefined,
      catatan: input.catatan?.trim() || undefined,
    };
    this.users.update((list) => [...list, row]);
    this.showToast(`Akun ${row.name} ditambahkan.`);
    return row;
  }

  /** Power user: ubah akun petugas. */
  updateUser(
    id: string,
    patch: Partial<
      Pick<
        UserAccount,
        'name' | 'email' | 'password' | 'jabatan' | 'rwId' | 'rtId' | 'reguPpsu' | 'role' | 'telepon' | 'catatan'
      >
    >,
  ): UserAccount | null {
    const cur = this.getUser(id);
    if (!cur) {
      this.showToast('Akun tidak ditemukan.');
      return null;
    }
    const nextEmail = patch.email?.trim().toLowerCase();
    if (nextEmail && nextEmail !== cur.email.toLowerCase()) {
      if (this.users().some((u) => u.id !== id && u.email.toLowerCase() === nextEmail)) {
        this.showToast('Email sudah terpakai.');
        return null;
      }
    }
    let updated: UserAccount | null = null;
    this.users.update((list) =>
      list.map((u) => {
        if (u.id !== id) return u;
        updated = {
          ...u,
          ...patch,
          name: patch.name != null ? patch.name.trim() : u.name,
          email: nextEmail || u.email,
          password: patch.password != null && patch.password.trim() ? patch.password.trim() : u.password,
          jabatan: patch.jabatan != null ? patch.jabatan.trim() : u.jabatan,
          reguPpsu:
            patch.reguPpsu !== undefined
              ? patch.reguPpsu.trim() || undefined
              : u.reguPpsu,
          telepon:
            patch.telepon !== undefined ? patch.telepon.trim() || undefined : u.telepon,
          catatan:
            patch.catatan !== undefined ? patch.catatan.trim() || undefined : u.catatan,
        };
        return updated!;
      }),
    );
    this.showToast('Akun petugas diperbarui.');
    return updated;
  }

  getRt(id: string): Rt | undefined {
    return this.rts().find((r) => r.id === id);
  }

  getRw(id: string): Rw | undefined {
    return this.rws().find((r) => r.id === id);
  }

  /** Format resmi alamat: RT001/RW 07 */
  labelRt(nomor: string): string {
    const n = String(nomor).replace(/\D/g, '') || '0';
    return `RT${n.padStart(3, '0')}`;
  }

  /** Format resmi: RW 07 */
  labelRw(nomor: string): string {
    const n = String(nomor).replace(/\D/g, '') || '0';
    return `RW ${n.padStart(2, '0')}`;
  }

  labelWilayah(rtId: string): string {
    const rt = this.getRt(rtId);
    if (!rt) return '-';
    const rw = this.getRw(rt.rwId);
    return `${this.labelRt(rt.nomor)}/${this.labelRw(rw?.nomor ?? '0')}`;
  }

  /** Label wilayah untuk baris DAOP RT atau RW. */
  labelDaopWilayah(lap: LaporanKeuanganRt): string {
    if (lap.tingkat === 'RW' || !lap.rtId) {
      const rw = this.getRw(lap.rwId);
      return rw ? `${this.labelRw(rw.nomor)} (Ketua RW)` : 'RW -';
    }
    return this.labelWilayah(lap.rtId);
  }

  labelDaopKetua(lap: LaporanKeuanganRt): string {
    if (lap.tingkat === 'RW' || !lap.rtId) {
      return this.getRw(lap.rwId)?.namaKetua ?? 'Ketua RW';
    }
    return this.getRt(lap.rtId)?.namaKetua ?? 'Ketua RT';
  }

  labelDaopTelepon(lap: LaporanKeuanganRt): string {
    if (lap.tingkat === 'RW' || !lap.rtId) {
      return this.getRw(lap.rwId)?.telepon ?? '—';
    }
    return this.getRt(lap.rtId)?.telepon ?? '—';
  }

  labelKategori(kategori: KategoriBangunan): string {
    const map: Record<KategoriBangunan, string> = {
      RUMAH_WARGA: 'Rumah Warga',
      KOS_KONTRAKAN: 'Kos/Kontrakan',
      FASUM: 'Fasum',
    };
    return map[kategori];
  }

  labelZona(status: ZonaAbj): string {
    if (status === 'AMAN') return 'Zona Aman';
    if (status === 'ZONA_MERAH') return 'Zona Merah (Waspada DBD)';
    return 'Belum Input';
  }

  labelJenisKeuanganRt(jenis: JenisLaporanKeuanganRt): string {
    if (jenis === 'DAOP') return 'Laporan DAOP';
    if (jenis === 'PMI') return 'Setoran PMI';
    return 'Catatan Bansos';
  }

  labelStatusKeuanganRt(status: StatusLaporanKeuanganRt): string {
    if (status === 'BELUM_SETOR') return 'Belum Setor';
    if (status === 'SUDAH_CETAK') return 'Sudah Cetak (belum upload TTD)';
    return 'Sudah Upload TTD';
  }

  formatRp(n: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);
  }

  getLaporanKeuangan(id: string): LaporanKeuanganRt | undefined {
    return this.laporanKeuanganRts().find((l) => l.id === id);
  }

  markCetakKeuanganRt(id: string): void {
    const now = new Date().toISOString();
    this.laporanKeuanganRts.update((list) =>
      list.map((l) =>
        l.id === id
          ? {
              ...l,
              status: l.status === 'SUDAH_UPLOAD_TTD' ? l.status : 'SUDAH_CETAK',
              dicetakAt: now,
              updatedAt: now,
            }
          : l,
      ),
    );
    this.showToast('Form siap dicetak. TTD basah Ketua & Bendahara, lalu upload scan.');
  }

  uploadScanKeuanganRt(
    id: string,
    fileName: string,
    uploaderName: string,
    caraSetor: 'DATANG_KELURAHAN' | 'UPLOAD_MANDIRI' = 'UPLOAD_MANDIRI',
    scanImageUrl?: string,
  ): void {
    const now = new Date().toISOString();
    const existing = this.getLaporanKeuangan(id);
    this.laporanKeuanganRts.update((list) =>
      list.map((l) =>
        l.id === id
          ? {
              ...l,
              status: 'SUDAH_UPLOAD_TTD' as const,
              scanFileName: fileName,
              scanImageUrl: scanImageUrl || l.scanImageUrl,
              scanUploadedAt: now,
              diuploadOleh: uploaderName,
              caraSetor,
              updatedAt: now,
            }
          : l,
      ),
    );
    const siapa = existing?.tingkat === 'RW' ? 'RW' : 'RT';
    const via =
      caraSetor === 'DATANG_KELURAHAN' ? `${siapa} datang ke kelurahan` : 'upload mandiri';
    this.showToast(`Scan TTD tersimpan (${via}). Status: Sudah Upload TTD.`);
  }

  labelStatusLaporanPsn(status: StatusLaporanPsn): string {
    const map: Record<StatusLaporanPsn, string> = {
      DRAFT: 'Draf',
      SUBMITTED: 'Terkirim',
      MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi RT',
      VALIDATED_RW: 'Tervalidasi RW',
      LOCKED: 'Dikunci',
      REJECTED: 'Ditolak / Revisi',
    };
    return map[status] ?? status;
  }

  labelStatusVerifikasi(status: StatusVerifikasi): string {
    const map: Record<StatusVerifikasi, string> = {
      PENDING: 'Menunggu Verifikasi RT',
      DITERIMA: 'Diterima',
      DITOLAK: 'Ditolak',
    };
    return map[status] ?? status;
  }

  rumahByRt(rtId: string): RumahWarga[] {
    const order: KategoriBangunan[] = ['RUMAH_WARGA', 'KOS_KONTRAKAN', 'FASUM'];
    return this.rumahWargas()
      .filter((r) => r.rtId === rtId && r.isActive)
      .sort(
        (a, b) =>
          order.indexOf(a.kategori) - order.indexOf(b.kategori) ||
          a.noRumah.localeCompare(b.noRumah, 'id'),
      );
  }

  rumahGroupedByKategori(
    rtId: string,
  ): Array<{ kategori: KategoriBangunan; label: string; items: RumahWarga[] }> {
    const groups: KategoriBangunan[] = ['RUMAH_WARGA', 'KOS_KONTRAKAN', 'FASUM'];
    const list = this.rumahByRt(rtId);
    return groups
      .map((kategori) => ({
        kategori,
        label: this.labelKategori(kategori),
        items: list.filter((r) => r.kategori === kategori),
      }))
      .filter((g) => g.items.length > 0);
  }

  showToast(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => {
      if (this.toast() === message) this.toast.set(null);
    }, 3500);
  }

  patchUndanganPsnDraft(partial: Partial<UndanganPsnDraft>): void {
    this.undanganPsnDraft.update((d) => ({ ...d, ...partial }));
  }

  /** Simpan PDF undangan PSN (demo: blob lokal + metadata). */
  uploadUndanganPsnPdf(file: File, uploaderName: string): void {
    const prev = this.undanganPsnPdf();
    if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
    const objectUrl = URL.createObjectURL(file);
    this.undanganPsnPdf.set({
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploaderName,
      objectUrl,
    });
    this.showToast(`PDF undangan tersimpan: ${file.name}`);
  }

  hapusUndanganPsnPdf(): void {
    const prev = this.undanganPsnPdf();
    if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
    this.undanganPsnPdf.set(null);
    this.showToast('PDF undangan dihapus.');
  }

  /** Upload template kosong DAOP (.doc/.docx) oleh Lurah / staf kelurahan. */
  uploadTemplateDaopKosong(file: File, uploaderName: string): boolean {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.doc') && !name.endsWith('.docx')) {
      this.showToast('Unggah file Word (.doc atau .docx).');
      return false;
    }
    const prev = this.templateDaopKosong();
    if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
    this.templateDaopKosong.set({
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploaderName,
      objectUrl: URL.createObjectURL(file),
      mimeType: file.type || (name.endsWith('.docx')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/msword'),
    });
    this.showToast(`Template DAOP tersimpan: ${file.name}`);
    return true;
  }

  hapusTemplateDaopKosong(): void {
    const prev = this.templateDaopKosong();
    if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
    this.templateDaopKosong.set(null);
    this.showToast('Template DAOP dihapus. Unduhan kembali ke form demo sistem.');
  }

  /** Unduh template resmi jika ada; return true jika file resmi terunduh. */
  unduhTemplateDaopKosongJikaAda(): boolean {
    const t = this.templateDaopKosong();
    if (!t?.objectUrl) return false;
    const a = document.createElement('a');
    a.href = t.objectUrl;
    a.download = t.fileName;
    a.click();
    this.showToast(`Template resmi diunduh: ${t.fileName}`);
    return true;
  }

  /** Catat kiriman undangan teks + PDF ke satu Ketua RW. */
  catatKirimUndanganPsn(input: {
    rw: Rw;
    dikirimOleh: string;
  }): UndanganPsnKirim {
    const pdf = this.undanganPsnPdf();
    const draft = this.undanganPsnDraft();
    const row: UndanganPsnKirim = {
      id: `und-kirim-${Date.now()}-${input.rw.id}`,
      rwId: input.rw.id,
      labelRw: this.labelRw(input.rw.nomor),
      namaKetua: input.rw.namaKetua,
      telepon: input.rw.telepon ?? '—',
      nomorSurat: draft.nomorSurat,
      pdfFileName: pdf?.fileName,
      denganPdf: !!pdf,
      channel: this.undanganPsnChannel,
      dikirimOleh: input.dikirimOleh,
      dikirimAt: new Date().toISOString(),
    };
    this.undanganPsnKiriman.update((list) => [row, ...list]);
    const pdfNote = row.denganPdf ? ` + PDF (${row.pdfFileName})` : ' (tanpa PDF)';
    this.showToast(`Undangan tercatat ke ${row.labelRw}${pdfNote}`);
    return row;
  }

  sudahKirimUndanganKeRw(rwId: string): boolean {
    return this.undanganPsnKiriman().some((k) => k.rwId === rwId);
  }

  /**
   * ABJ resmi dari laporan Terkirim (SUBMITTED / VALIDATED_RW / LOCKED).
   * Rumus: (bebas jentik / total diperiksa) × 100, 1 desimal.
   * diperiksa = 0 → ABJ 0% + BELUM_ADA_DATA (bukan Zona Merah).
   * diperiksa > 0 & ABJ ≥ 95 → AMAN; else ZONA_MERAH.
   * Reactive: baca signal laporanPsns() sehingga dashboard ikut update tanpa refresh.
   */
  hitungAbj(opts?: { rtId?: string; rwId?: string; tanggal?: string }): AbjSummary {
    let laporan = this.laporanPsns().filter((l) =>
      ['SUBMITTED', 'VALIDATED_RW', 'LOCKED'].includes(l.statusLaporan),
    );

    if (opts?.rtId) {
      laporan = laporan.filter((l) => l.rtId === opts.rtId);
    } else if (opts?.rwId) {
      const rtIds = this.rts()
        .filter((r) => r.rwId === opts.rwId)
        .map((r) => r.id);
      laporan = laporan.filter((l) => rtIds.includes(l.rtId));
    }

    if (opts?.tanggal) {
      laporan = laporan.filter((l) => l.tanggalPemeriksaan === opts.tanggal);
    }

    // Satu bangunan = satu status terbaru (hindari dobel hitung jika dicek ulang).
    const latestByKey = new Map<string, LaporanPsn>();
    for (const item of [...laporan].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const key = item.rumahWargaId ?? item.id;
      latestByKey.set(key, item);
    }
    const unique = [...latestByKey.values()];
    const diperiksa = unique.length;
    const bebasJentik = unique.filter((l) => l.statusJentik === 'TIDAK_ADA').length;
    const positif = diperiksa - bebasJentik;
    // 5/6 → 83.333… → 83.3
    const abj =
      diperiksa === 0 ? 0 : Math.round((bebasJentik / diperiksa) * 1000) / 10;

    let status: ZonaAbj = 'BELUM_ADA_DATA';
    if (diperiksa > 0) {
      status = abj >= 95 ? 'AMAN' : 'ZONA_MERAH';
    }

    let scopeLabel = this.kelurahan.nama;
    if (opts?.rtId) scopeLabel = this.labelWilayah(opts.rtId);
    else if (opts?.rwId) {
      const rw = this.getRw(opts.rwId);
      scopeLabel = rw ? this.labelRw(rw.nomor) : 'RW -';
    }

    return { scopeLabel, diperiksa, bebasJentik, positif, abj, status };
  }

  abjPerRt(): Array<AbjSummary & { rtId: string; rwId: string }> {
    return this.rts().map((rt) => ({
      ...this.hitungAbj({ rtId: rt.id }),
      rtId: rt.id,
      rwId: rt.rwId,
    }));
  }

  abjPerRw(): Array<AbjSummary & { rwId: string }> {
    return this.rws().map((rw) => ({
      ...this.hitungAbj({ rwId: rw.id }),
      rwId: rw.id,
    }));
  }

  addLaporanPsn(input: {
    rtId: string;
    rumahWargaId?: string;
    labelBangunan?: string;
    kategoriBangunan?: KategoriBangunan;
    pelaporUserId?: string;
    pelaporNama?: string;
    tanggalPemeriksaan: string;
    sumber: 'KADER_RT' | 'MANDIRI_PUBLIK';
    statusJentik: StatusJentik;
    jumlahKontainer?: number;
    catatan?: string;
    fotoName?: string;
    fotoTimestamp?: string;
    fotoLatitude?: number;
    fotoLongitude?: number;
    statusLaporan: StatusLaporanPsn;
  }): void {
    const row: LaporanPsn = {
      id: `psn-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.laporanPsns.update((list) => [row, ...list]);

    if (['SUBMITTED', 'VALIDATED_RW', 'LOCKED'].includes(input.statusLaporan)) {
      const abj = this.hitungAbj({ rtId: input.rtId });
      const zona = this.labelZona(abj.status);
      const fotoNote = input.fotoName ? ' + foto bukti' : '';
      this.showToast(
        `Laporan PSN tersimpan${fotoNote}. ABJ ${abj.scopeLabel}: ${abj.abj}% (${zona}).`,
      );
    } else {
      this.showToast('Laporan PSN berhasil disimpan.');
    }
  }

  updateStatusLaporan(id: string, status: StatusLaporanPsn, catatan?: string): void {
    this.laporanPsns.update((list) =>
      list.map((l) =>
        l.id === id
          ? {
              ...l,
              statusLaporan: status,
              catatan: catatan ?? l.catatan,
              validatedRwAt: status === 'VALIDATED_RW' ? new Date().toISOString() : l.validatedRwAt,
            }
          : l,
      ),
    );
    this.showToast('Status laporan PSN diperbarui.');
  }

  addWargaPendatang(
    input: Omit<WargaPendatang, 'id' | 'kelurahanId' | 'statusVerifikasi' | 'createdAt'>,
  ): void {
    const row: WargaPendatang = {
      id: `wp-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      statusVerifikasi: 'PENDING',
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.wargaPendatangs.update((list) => [row, ...list]);
    this.showToast(
      `Laporan kos masuk antrian verifikasi RT. Total warga pendatang: ${this.wargaPendatangs().length}.`,
    );
  }

  verifikasiWarga(
    id: string,
    status: Exclude<StatusVerifikasi, 'PENDING'>,
    verifierId: string,
    catatan?: string,
  ): void {
    this.wargaPendatangs.update((list) =>
      list.map((w) =>
        w.id === id
          ? {
              ...w,
              statusVerifikasi: status,
              diverifikasiOleh: verifierId,
              diverifikasiAt: new Date().toISOString(),
              catatanVerifikasi: catatan,
            }
          : w,
      ),
    );
    this.showToast(status === 'DITERIMA' ? 'Laporan kos diterima.' : 'Laporan kos ditolak.');
  }

  addAset(input: Omit<AsetPpsu, 'id' | 'kelurahanId' | 'updatedAt' | 'jumlah' | 'kondisi'> & Partial<Pick<AsetPpsu, 'jumlah' | 'kondisi'>>): void {
    const breakdown = {
      jumlahBaik: Math.max(0, input.jumlahBaik ?? 0),
      jumlahRusakRingan: Math.max(0, input.jumlahRusakRingan ?? 0),
      jumlahRusakBerat: Math.max(0, input.jumlahRusakBerat ?? 0),
      jumlahHilang: Math.max(0, input.jumlahHilang ?? 0),
    };
    const row: AsetPpsu = {
      id: `as-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      updatedAt: new Date().toISOString(),
      ...input,
      ...breakdown,
      jumlah: this.totalJumlahAset(breakdown),
      kondisi: this.ringkasKondisiAset(breakdown),
      statusPinjam: input.statusPinjam || 'TERSEDIA',
      lokasiGudang: input.lokasiGudang || 'Gudang PPSU Kelurahan Rawajati',
    };
    this.asetPpsus.update((list) => [row, ...list]);
    this.showToast('Alat PPSU ditambahkan.');
  }

  updateAset(id: string, patch: Partial<AsetPpsu>): void {
    this.asetPpsus.update((list) =>
      list.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)),
    );
    this.showToast('Kondisi aset PPSU diperbarui.');
  }

  /** Simulasi foto lapangan + timestamp + koordinat GPS Rawajati. */
  buatFotoSlot(
    label: FotoKerjaSlot['label'],
    fileName: string,
  ): FotoKerjaSlot {
    const baseLat = -6.2568;
    const baseLng = 106.8542;
    return {
      label,
      fileName,
      timestamp: new Date().toISOString(),
      latitude: Number((baseLat + (Math.random() - 0.5) * 0.002).toFixed(6)),
      longitude: Number((baseLng + (Math.random() - 0.5) * 0.002).toFixed(6)),
    };
  }

  labelJenisKerja(jenis: JenisKerjaPpsu): string {
    const map: Record<JenisKerjaPpsu, string> = {
      KURAS_SALURAN: 'Kuras Saluran / Tali Air',
      SAPU_JALAN: 'Sapu Jalan',
      BABAT_RUMPUT: 'Babat Rumput',
    };
    return map[jenis];
  }

  labelKategoriTugasPpsu(kategori?: KategoriTugasPpsu): string {
    return kategori === 'URGENSI_RW' ? 'Permintaan Urgensi RW' : 'Ploting Rutin Harian';
  }

  labelPetugasRegu(lap: Pick<LaporanKerjaPpsu, 'petugasNama' | 'reguLabel'>): string {
    const regu = lap.reguLabel?.trim() || 'Regu belum diisi';
    return `Petugas: ${lap.petugasNama} · ${regu}`;
  }

  labelDetailTugasPpsu(lap: LaporanKerjaPpsu): string {
    if (lap.kategoriTugas === 'URGENSI_RW') {
      const rw = lap.asalRwLabel || 'RW —';
      const prio = lap.prioritasUrgensi === 'DARURAT' ? 'Prioritas Darurat' : 'Prioritas Normal';
      return `Permintaan ${rw} · ${prio}`;
    }
    return lap.estimasiArea?.trim() || 'Estimasi area belum diisi';
  }

  addLaporanKerja(
    input: Omit<LaporanKerjaPpsu, 'id' | 'kelurahanId' | 'createdAt'>,
  ): void {
    const row: LaporanKerjaPpsu = {
      id: `lk-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.laporanKerjaPpsus.update((list) => [row, ...list]);
    this.showToast('Laporan kerja PPSU terkirim. Pantauan Ekbang ikut terbarui.');
  }

  pinjamAlat(id: string, petugasNama: string): void {
    this.asetPpsus.update((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              statusPinjam: 'DIPINJAM' as StatusPinjamAlat,
              dipinjamOleh: petugasNama,
              dipinjamAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : a,
      ),
    );
    this.showToast(`${petugasNama} meminjam alat dari gudang.`);
  }

  kembalikanAlat(id: string): void {
    this.asetPpsus.update((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              statusPinjam: 'TERSEDIA' as StatusPinjamAlat,
              dipinjamOleh: undefined,
              dipinjamAt: undefined,
              updatedAt: new Date().toISOString(),
            }
          : a,
      ),
    );
    this.showToast('Alat dikembalikan ke gudang.');
  }

  laporAlatRusak(id: string, catatan?: string): void {
    this.asetPpsus.update((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        const pindah = Math.min(1, a.jumlahBaik || 0);
        const next = {
          ...a,
          statusPinjam: 'RUSAK' as StatusPinjamAlat,
          jumlahBaik: Math.max(0, (a.jumlahBaik || 0) - pindah),
          jumlahRusakRingan: (a.jumlahRusakRingan || 0) + pindah,
          catatan: catatan || 'Dilaporkan rusak dari lapangan',
          updatedAt: new Date().toISOString(),
        };
        return {
          ...next,
          jumlah: this.totalJumlahAset(next),
          kondisi: this.ringkasKondisiAset(next),
        };
      }),
    );
    this.showToast('Laporan alat rusak masuk ke pantauan Ekbang.');
  }

  addKegiatan(input: Omit<KegiatanSaluran, 'id' | 'kelurahanId' | 'createdAt'>): void {
    const row: KegiatanSaluran = {
      id: `ks-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.kegiatanSalurans.update((list) => [row, ...list]);
    this.showToast('Jadwal pengurasan saluran ditambahkan.');
  }

  updateKegiatanStatus(id: string, status: StatusKegiatan, tanggalRealisasi?: string): void {
    this.kegiatanSalurans.update((list) =>
      list.map((k) =>
        k.id === id
          ? {
              ...k,
              statusKegiatan: status,
              tanggalRealisasi: tanggalRealisasi ?? k.tanggalRealisasi,
            }
          : k,
      ),
    );
    this.showToast(
      status === 'SELESAI'
        ? 'Pengurasan saluran selesai — status Dashboard Lurah terbarui.'
        : 'Status kegiatan saluran diperbarui.',
    );
  }

  /** Normalisasi nomor RW → "01", "07", "11" (angka 1–99). */
  normalizeNomorRw(raw: string): string {
    const digits = String(raw).replace(/\D/g, '');
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n) || n <= 0) return '00';
    return String(Math.min(n, 99)).padStart(2, '0');
  }

  /** Normalisasi nomor RT → "01", "02" (angka 1–99). */
  normalizeNomorRt(raw: string): string {
    const digits = String(raw).replace(/\D/g, '');
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n) || n <= 0) return '00';
    return String(Math.min(n, 99)).padStart(2, '0');
  }

  /** Power user (ADMIN_KEL): tambah RW baru. */
  addRw(input: { nomor: string; namaKetua: string; telepon?: string }): Rw | null {
    const nomor = this.normalizeNomorRw(input.nomor);
    const namaKetua = input.namaKetua.trim();
    if (!nomor || nomor === '00' || !namaKetua) {
      this.showToast('Isi nomor RW dan nama Ketua RW.');
      return null;
    }
    if (this.rws().some((r) => this.normalizeNomorRw(r.nomor) === nomor)) {
      this.showToast(`RW ${nomor} sudah ada.`);
      return null;
    }
    const row: Rw = {
      id: `rw-${nomor}-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      nomor,
      namaKetua,
      telepon: input.telepon?.trim() || undefined,
    };
    this.rws.update((list) => [...list, row]);
    this.showToast(`${this.labelRw(nomor)} ditambahkan.`);
    return row;
  }

  /** Power user (ADMIN_KEL): tambah RT baru di bawah suatu RW. */
  addRt(input: { nomor: string; namaKetua: string; telepon?: string; rwId: string }): Rt | null {
    const nomor = this.normalizeNomorRt(input.nomor);
    const namaKetua = input.namaKetua.trim();
    const rw = this.getRw(input.rwId);
    if (!rw) {
      this.showToast('Pilih RW dulu.');
      return null;
    }
    if (!nomor || nomor === '00' || !namaKetua) {
      this.showToast('Isi nomor RT dan nama Ketua RT.');
      return null;
    }
    if (
      this.rts().some(
        (r) => r.rwId === rw.id && this.normalizeNomorRt(r.nomor) === nomor,
      )
    ) {
      this.showToast(`${this.labelRt(nomor)}/${this.labelRw(rw.nomor)} sudah ada.`);
      return null;
    }
    const rwPad = this.normalizeNomorRw(rw.nomor);
    const row: Rt = {
      id: `rt-${rwPad}-${nomor}-${Date.now()}`,
      rwId: rw.id,
      kelurahanId: this.kelurahan.id,
      nomor,
      namaKetua,
      telepon: input.telepon?.trim() || undefined,
      publicToken: `rt${nomor}-rw${rwPad}-rawajati`,
      tokenActive: true,
    };
    this.rts.update((list) => [...list, row]);
    this.showToast(`${this.labelWilayah(row.id)} ditambahkan.`);
    return row;
  }

  /** Power user (ADMIN_KEL): ubah Ketua RW + nomor WA. */
  updateRw(id: string, patch: Partial<Pick<Rw, 'namaKetua' | 'telepon' | 'nomor'>>): void {
    const next = { ...patch };
    if (next.nomor != null) next.nomor = this.normalizeNomorRw(next.nomor);
    this.rws.update((list) => list.map((r) => (r.id === id ? { ...r, ...next } : r)));
    this.showToast('Data Ketua RW diperbarui.');
  }

  /** Power user (ADMIN_KEL): ubah Ketua RT + nomor WA. */
  updateRt(id: string, patch: Partial<Pick<Rt, 'namaKetua' | 'telepon' | 'nomor' | 'rwId'>>): void {
    const next = { ...patch };
    if (next.nomor != null) next.nomor = this.normalizeNomorRt(next.nomor);
    this.rts.update((list) => list.map((r) => (r.id === id ? { ...r, ...next } : r)));
    this.showToast('Data Ketua RT diperbarui.');
  }

  /**
   * Power user: ubah stok per kondisi (baik / rusak ringan / rusak berat / hilang).
   * Total jumlah dihitung otomatis dari rincian.
   */
  updateAsetStok(
    id: string,
    patch: Partial<
      Pick<
        AsetPpsu,
        | 'namaAlat'
        | 'satuan'
        | 'catatan'
        | 'jumlahBaik'
        | 'jumlahRusakRingan'
        | 'jumlahRusakBerat'
        | 'jumlahHilang'
      >
    >,
  ): void {
    this.asetPpsus.update((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        const next = {
          ...a,
          ...patch,
          jumlahBaik: Math.max(0, patch.jumlahBaik ?? a.jumlahBaik ?? 0),
          jumlahRusakRingan: Math.max(0, patch.jumlahRusakRingan ?? a.jumlahRusakRingan ?? 0),
          jumlahRusakBerat: Math.max(0, patch.jumlahRusakBerat ?? a.jumlahRusakBerat ?? 0),
          jumlahHilang: Math.max(0, patch.jumlahHilang ?? a.jumlahHilang ?? 0),
          updatedAt: new Date().toISOString(),
        };
        return {
          ...next,
          jumlah: this.totalJumlahAset(next),
          kondisi: this.ringkasKondisiAset(next),
        };
      }),
    );
    this.showToast('Stok per kondisi diperbarui (total dihitung otomatis).');
  }

  maskNik(nik: string): string {
    if (nik.length < 8) return nik;
    return `${nik.slice(0, 4)}****${nik.slice(-4)}`;
  }

  exportCsv(filename: string, rows: string[][]): void {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`Berkas ${filename} diunduh.`);
  }

  formatTanggalId(date = new Date()): string {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /** Agenda terbaru dulu. */
  agendaRapatsSorted = computed(() =>
    [...this.agendaRapats()].sort((a, b) => {
      const ta = `${a.tanggal}T${a.jamMulai}`;
      const tb = `${b.tanggal}T${b.jamMulai}`;
      return tb.localeCompare(ta);
    }),
  );

  kerjaBaktiSorted = computed(() =>
    [...this.kerjaBaktiRws()].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
  );

  agendaRapatCountMendatang = computed(
    () =>
      this.agendaRapats().filter((a) => a.status === 'DIJADWALKAN' || a.status === 'BERLANGSUNG')
        .length,
  );

  kerjaBaktiCountMendatang = computed(
    () => this.kerjaBaktiRws().filter((k) => k.status === 'DIJADWALKAN' || k.status === 'BERLANGSUNG').length,
  );

  getAgendaRapat(id: string): AgendaRapat | undefined {
    return this.agendaRapats().find((a) => a.id === id);
  }

  getKerjaBakti(id: string): KerjaBaktiRw | undefined {
    return this.kerjaBaktiRws().find((k) => k.id === id);
  }

  /** Rapat yang melibatkan RW tertentu (Ketua RW / RT di bawahnya). */
  agendaUntukRw(rwId: string): AgendaRapat[] {
    return this.agendaRapatsSorted().filter((a) =>
      a.peserta.some((p) => p.rwId === rwId || (p.rtId && this.getRt(p.rtId)?.rwId === rwId)),
    );
  }

  kerjaBaktiUntukRw(rwId: string): KerjaBaktiRw[] {
    return this.kerjaBaktiSorted().filter((k) => k.rwId === rwId);
  }

  labelJenisKegiatanAgenda(jenis?: JenisKegiatanAgenda): string {
    const map: Record<JenisKegiatanAgenda, string> = {
      RAPAT: 'Rapat',
      PENYULUHAN: 'Penyuluhan',
      SOSIALISASI: 'Sosialisasi',
      POSYANDU: 'Posyandu',
      LAIN: 'Lainnya',
    };
    return map[jenis || 'RAPAT'];
  }

  addAgendaRapat(input: {
    jenisKegiatan?: JenisKegiatanAgenda;
    judul: string;
    tanggal: string;
    jamMulai: string;
    tempat: string;
    ringkasanAgenda: string;
    dibuatOleh: string;
    peserta: Omit<PesertaAgenda, 'id' | 'hadir' | 'hadirAt'>[];
    undanganPdf?: File | null;
  }): AgendaRapat | null {
    if (!input.judul.trim() || !input.tanggal || !input.jamMulai) {
      this.showToast('Judul, tanggal, dan jam wajib diisi.');
      return null;
    }
    if (input.undanganPdf && !input.undanganPdf.name.toLowerCase().endsWith('.pdf')) {
      this.showToast('Unggah file PDF undangan.');
      return null;
    }
    const now = new Date().toISOString().slice(0, 19);
    const jenis = input.jenisKegiatan || 'RAPAT';
    const row: AgendaRapat = {
      id: `ag-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      jenisKegiatan: jenis,
      judul: input.judul.trim(),
      tanggal: input.tanggal,
      jamMulai: input.jamMulai,
      tempat: input.tempat.trim() || 'Ruang Rapat Lt. 2 Kelurahan Rawajati',
      ringkasanAgenda: input.ringkasanAgenda.trim(),
      status: 'DIJADWALKAN',
      peserta: input.peserta.map((p, i) => ({
        ...p,
        id: `agp-${Date.now()}-${i}`,
        hadir: false,
      })),
      dibuatOleh: input.dibuatOleh,
      createdAt: now,
      updatedAt: now,
    };
    if (input.undanganPdf) {
      row.undanganPdfName = input.undanganPdf.name;
      row.undanganPdfUrl = URL.createObjectURL(input.undanganPdf);
      row.undanganPdfUploadedAt = now;
      row.undanganPdfUploadedBy = input.dibuatOleh;
    }
    this.agendaRapats.update((list) => [row, ...list]);
    this.showToast(
      input.undanganPdf
        ? `Agenda ${this.labelJenisKegiatanAgenda(jenis).toLowerCase()} + PDF disimpan.`
        : `Agenda ${this.labelJenisKegiatanAgenda(jenis).toLowerCase()} disimpan.`,
    );
    return row;
  }

  /**
   * Target blast undangan rapat = Ketua RW saja.
   * RT boleh di daftar hadir, tapi PDF dikirim ke RW (mereka teruskan ke RT).
   */
  targetBlastRwAgenda(row: AgendaRapat): Rw[] {
    const ids = new Set<string>();
    for (const p of row.peserta) {
      if (p.jenis === 'RW' && p.rwId) ids.add(p.rwId);
      if (p.jenis === 'RT') {
        const rwId = p.rwId || (p.rtId ? this.getRt(p.rtId)?.rwId : undefined);
        if (rwId) ids.add(rwId);
      }
    }
    return [...ids]
      .map((id) => this.getRw(id))
      .filter((rw): rw is Rw => !!rw);
  }

  uploadUndanganAgendaPdf(id: string, file: File, uploaderName: string): boolean {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.showToast('Unggah file PDF undangan.');
      return false;
    }
    const prev = this.getAgendaRapat(id);
    if (prev?.undanganPdfUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.undanganPdfUrl);
    const now = new Date().toISOString().slice(0, 19);
    const url = URL.createObjectURL(file);
    this.agendaRapats.update((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              undanganPdfName: file.name,
              undanganPdfUrl: url,
              undanganPdfUploadedAt: now,
              undanganPdfUploadedBy: uploaderName,
              updatedAt: now,
            }
          : a,
      ),
    );
    this.showToast(`PDF undangan tersimpan: ${file.name}`);
    return true;
  }

  hapusUndanganAgendaPdf(id: string): void {
    const prev = this.getAgendaRapat(id);
    if (prev?.undanganPdfUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.undanganPdfUrl);
    const now = new Date().toISOString().slice(0, 19);
    this.agendaRapats.update((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              undanganPdfName: undefined,
              undanganPdfUrl: undefined,
              undanganPdfUploadedAt: undefined,
              undanganPdfUploadedBy: undefined,
              updatedAt: now,
            }
          : a,
      ),
    );
    this.showToast('PDF undangan dihapus.');
  }

  teksBlastUndanganAgenda(row: AgendaRapat, rw: Rw): string {
    const pdfNote = row.undanganPdfName
      ? `\n\nPDF undangan: ${row.undanganPdfName} (lampirkan dari arsip / unduh di sistem).`
      : '\n\n(PDF undangan menyusul dari sekretaris.)';
    const adaRt = row.peserta.some(
      (p) => p.jenis === 'RT' && (p.rwId === rw.id || this.getRt(p.rtId || '')?.rwId === rw.id),
    );
    const lanjutRt = adaRt
      ? '\nMohon diteruskan juga ke Ketua RT undangan di wilayah Bapak/Ibu.'
      : '';
    return (
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Bapak/Ibu Ketua ${this.labelRw(rw.nomor)} (${rw.namaKetua}),\n\n` +
      `Dengan hormat, undangan *Rapat Kelurahan Rawajati*:\n` +
      `• Acara: ${row.judul}\n` +
      `• Tanggal: ${row.tanggal} · ${row.jamMulai}\n` +
      `• Tempat: ${row.tempat}\n` +
      `• Agenda: ${row.ringkasanAgenda || '—'}\n` +
      pdfNote +
      lanjutRt +
      `\n\nTerima kasih.\nKelurahan Rawajati`
    );
  }

  buildWaBlastAgendaRw(row: AgendaRapat, rw: Rw): string | null {
    const phone = (rw.telepon || '').replace(/\D/g, '').replace(/^0/, '62');
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(this.teksBlastUndanganAgenda(row, rw))}`;
  }

  catatBlastUndanganAgendaRw(agendaId: string, rwId: string): void {
    const now = new Date().toISOString().slice(0, 19);
    this.agendaRapats.update((list) =>
      list.map((a) => {
        if (a.id !== agendaId) return a;
        const done = new Set(a.undanganBlastRwIds ?? []);
        done.add(rwId);
        return { ...a, undanganBlastRwIds: [...done], updatedAt: now };
      }),
    );
    this.showToast('Blast WA ke Ketua RW dicatat. Lampirkan PDF di chat jika perlu.');
  }

  /** Peserta LMK (dan sejenis) yang punya nomor WA — ikut blast undangan. */
  targetBlastLmkAgenda(row: AgendaRapat): PesertaAgenda[] {
    return row.peserta.filter((p) => p.jenis === 'LMK' && !!(p.telepon || '').replace(/\D/g, ''));
  }

  /** Ketua RT di undangan yang punya WA (dari undangan atau Master RT). */
  targetBlastRtAgenda(row: AgendaRapat): PesertaAgenda[] {
    return row.peserta
      .filter((p) => p.jenis === 'RT')
      .map((p) => {
        const rt = p.rtId ? this.getRt(p.rtId) : undefined;
        const telepon = p.telepon || rt?.telepon;
        return { ...p, telepon };
      })
      .filter((p) => !!(p.telepon || '').replace(/\D/g, ''));
  }

  teksBlastUndanganAgendaRt(row: AgendaRapat, p: PesertaAgenda): string {
    const wilayah = p.rtId ? this.labelWilayah(p.rtId) : 'RT';
    const pdfNote = row.undanganPdfName
      ? `\n\nPDF undangan: ${row.undanganPdfName} (lampirkan dari arsip / unduh di sistem).`
      : '\n\n(PDF undangan menyusul dari sekretaris.)';
    return (
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Bapak/Ibu Ketua ${wilayah} (${p.nama}),\n\n` +
      `Dengan hormat, undangan *Rapat Kelurahan Rawajati*:\n` +
      `• Acara: ${row.judul}\n` +
      `• Tanggal: ${row.tanggal} · ${row.jamMulai}\n` +
      `• Tempat: ${row.tempat}\n` +
      `• Agenda: ${row.ringkasanAgenda || '—'}\n` +
      pdfNote +
      `\n\nTerima kasih.\nKelurahan Rawajati`
    );
  }

  buildWaBlastAgendaRt(row: AgendaRapat, p: PesertaAgenda): string | null {
    const phone = (p.telepon || '').replace(/\D/g, '').replace(/^0/, '62');
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(this.teksBlastUndanganAgendaRt(row, p))}`;
  }

  teksBlastUndanganAgendaLmk(row: AgendaRapat, p: PesertaAgenda): string {
    const pdfNote = row.undanganPdfName
      ? `\n\nPDF undangan: ${row.undanganPdfName} (lampirkan dari arsip / unduh di sistem).`
      : '\n\n(PDF undangan menyusul dari sekretaris.)';
    const jabatan = p.instansi ? ` (${p.instansi})` : '';
    return (
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Bapak/Ibu ${p.nama}${jabatan} — LMK Kelurahan Rawajati,\n\n` +
      `Dengan hormat, undangan *Rapat Kelurahan Rawajati*:\n` +
      `• Acara: ${row.judul}\n` +
      `• Tanggal: ${row.tanggal} · ${row.jamMulai}\n` +
      `• Tempat: ${row.tempat}\n` +
      `• Agenda: ${row.ringkasanAgenda || '—'}\n` +
      pdfNote +
      `\n\nTerima kasih.\nKelurahan Rawajati`
    );
  }

  buildWaBlastAgendaLmk(row: AgendaRapat, p: PesertaAgenda): string | null {
    const phone = (p.telepon || '').replace(/\D/g, '').replace(/^0/, '62');
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(this.teksBlastUndanganAgendaLmk(row, p))}`;
  }

  catatBlastUndanganAgendaPeserta(agendaId: string, pesertaId: string): void {
    const now = new Date().toISOString().slice(0, 19);
    this.agendaRapats.update((list) =>
      list.map((a) => {
        if (a.id !== agendaId) return a;
        const done = new Set(a.undanganBlastPesertaIds ?? []);
        done.add(pesertaId);
        return { ...a, undanganBlastPesertaIds: [...done], updatedAt: now };
      }),
    );
    this.showToast('Blast WA undangan dicatat. Lampirkan PDF di chat jika perlu.');
  }

  updateStatusAgenda(id: string, status: StatusAgendaRapat): void {
    const now = new Date().toISOString().slice(0, 19);
    this.agendaRapats.update((list) =>
      list.map((a) => (a.id === id ? { ...a, status, updatedAt: now } : a)),
    );
    this.showToast('Status rapat diperbarui.');
  }

  setKehadiranPeserta(agendaId: string, pesertaId: string, hadir: boolean): void {
    const now = new Date().toISOString().slice(0, 19);
    this.agendaRapats.update((list) =>
      list.map((a) => {
        if (a.id !== agendaId) return a;
        return {
          ...a,
          updatedAt: now,
          peserta: a.peserta.map((p) =>
            p.id === pesertaId
              ? { ...p, hadir, hadirAt: hadir ? now : undefined }
              : p,
          ),
        };
      }),
    );
  }

  simpanNotulenAgenda(agendaId: string, notulen: string): void {
    const now = new Date().toISOString().slice(0, 19);
    this.agendaRapats.update((list) =>
      list.map((a) => (a.id === agendaId ? { ...a, notulen: notulen.trim(), updatedAt: now } : a)),
    );
    this.showToast('Notulen disimpan.');
  }

  hapusAgendaRapat(id: string): void {
    const prev = this.getAgendaRapat(id);
    if (prev?.undanganPdfUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.undanganPdfUrl);
    this.agendaRapats.update((list) => list.filter((a) => a.id !== id));
    this.showToast('Agenda rapat dihapus.');
  }

  /** Tambah semua Ketua RW ke undangan. */
  buildPesertaSemuaRw(): Omit<PesertaAgenda, 'id' | 'hadir' | 'hadirAt'>[] {
    return this.rws().map((rw) => ({
      jenis: 'RW' as JenisPesertaAgenda,
      nama: rw.namaKetua,
      rwId: rw.id,
      telepon: rw.telepon,
    }));
  }

  /** Tambah semua Ketua RT ke undangan (bisa ikut blast WA). */
  buildPesertaSemuaRt(): Omit<PesertaAgenda, 'id' | 'hadir' | 'hadirAt'>[] {
    return this.rts().map((rt) => ({
      jenis: 'RT' as JenisPesertaAgenda,
      nama: rt.namaKetua,
      rtId: rt.id,
      rwId: rt.rwId,
      telepon: rt.telepon,
    }));
  }

  addKerjaBakti(input: {
    rwId: string;
    tanggal: string;
    lokasi: string;
    picNama: string;
    deskripsi: string;
    dibuatOleh: string;
    /** Opsional: PDF undangan sekretaris saat buat jadwal */
    undanganPdf?: File | null;
  }): KerjaBaktiRw | null {
    if (!input.rwId || !input.tanggal) {
      this.showToast('RW dan tanggal wajib diisi.');
      return null;
    }
    const rw = this.getRw(input.rwId);
    if (!rw) {
      this.showToast('RW tidak ditemukan.');
      return null;
    }
    if (input.undanganPdf && !input.undanganPdf.name.toLowerCase().endsWith('.pdf')) {
      this.showToast('Unggah file PDF undangan.');
      return null;
    }
    const now = new Date().toISOString().slice(0, 19);
    const row: KerjaBaktiRw = {
      id: `kb-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      rwId: input.rwId,
      tanggal: input.tanggal,
      lokasi: input.lokasi.trim() || `Area ${this.labelRw(rw.nomor)}`,
      picNama: input.picNama.trim() || rw.namaKetua,
      deskripsi: input.deskripsi.trim() || 'Kerja bakti bergilir wilayah RW.',
      status: 'DIJADWALKAN',
      dibuatOleh: input.dibuatOleh,
      createdAt: now,
    };
    if (input.undanganPdf) {
      row.undanganPdfName = input.undanganPdf.name;
      row.undanganPdfUrl = URL.createObjectURL(input.undanganPdf);
      row.undanganPdfUploadedAt = now;
      row.undanganPdfUploadedBy = input.dibuatOleh;
    }
    this.kerjaBaktiRws.update((list) => [row, ...list]);
    this.showToast(
      input.undanganPdf
        ? `Kerja bakti ${this.labelRw(rw.nomor)} dijadwalkan + PDF undangan.`
        : `Kerja bakti ${this.labelRw(rw.nomor)} dijadwalkan.`,
    );
    return row;
  }

  updateStatusKerjaBakti(id: string, status: StatusKerjaBakti, catatan?: string): void {
    const now = new Date().toISOString().slice(0, 19);
    this.kerjaBaktiRws.update((list) =>
      list.map((k) =>
        k.id === id
          ? {
              ...k,
              status,
              catatan: catatan !== undefined ? catatan : k.catatan,
              selesaiAt: status === 'SELESAI' ? now : k.selesaiAt,
            }
          : k,
      ),
    );
    this.showToast('Status kerja bakti diperbarui.');
  }

  uploadFotoKerjaBakti(id: string, file: File): void {
    const url = URL.createObjectURL(file);
    this.kerjaBaktiRws.update((list) =>
      list.map((k) =>
        k.id === id ? { ...k, fotoName: file.name, fotoUrl: url } : k,
      ),
    );
    this.showToast(`Foto tersimpan: ${file.name}`);
  }

  /** PDF undangan kerja bakti dari sekretaris — per jadwal RW. */
  uploadUndanganKerjaBaktiPdf(id: string, file: File, uploaderName: string): boolean {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.showToast('Unggah file PDF undangan.');
      return false;
    }
    const prev = this.getKerjaBakti(id);
    if (prev?.undanganPdfUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.undanganPdfUrl);
    const url = URL.createObjectURL(file);
    this.kerjaBaktiRws.update((list) =>
      list.map((k) =>
        k.id === id
          ? {
              ...k,
              undanganPdfName: file.name,
              undanganPdfUrl: url,
              undanganPdfUploadedAt: new Date().toISOString(),
              undanganPdfUploadedBy: uploaderName,
            }
          : k,
      ),
    );
    this.showToast(`PDF undangan tersimpan: ${file.name}`);
    return true;
  }

  hapusUndanganKerjaBaktiPdf(id: string): void {
    const prev = this.getKerjaBakti(id);
    if (prev?.undanganPdfUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.undanganPdfUrl);
    this.kerjaBaktiRws.update((list) =>
      list.map((k) =>
        k.id === id
          ? {
              ...k,
              undanganPdfName: undefined,
              undanganPdfUrl: undefined,
              undanganPdfUploadedAt: undefined,
              undanganPdfUploadedBy: undefined,
            }
          : k,
      ),
    );
    this.showToast('PDF undangan dihapus.');
  }

  /** Teks blast WA undangan kerja bakti ke Ketua RW setempat. */
  teksBlastUndanganKerjaBakti(row: KerjaBaktiRw): string {
    const rw = this.getRw(row.rwId);
    const label = rw ? this.labelRw(rw.nomor) : 'RW';
    const pdfNote = row.undanganPdfName
      ? `\n\nPDF undangan: ${row.undanganPdfName} (lampirkan dari arsip kelurahan / unduh di sistem).`
      : '\n\n(PDF undangan menyusul dari sekretaris.)';
    return (
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Bapak/Ibu Ketua ${label} (${row.picNama}),\n\n` +
      `Dengan hormat, kami sampaikan undangan *Kerja Bakti* wilayah ${label}:\n` +
      `• Tanggal: ${row.tanggal}\n` +
      `• Lokasi: ${row.lokasi}\n` +
      `• Kegiatan: ${row.deskripsi}\n` +
      pdfNote +
      `\n\nMohon koordinasi warga setempat. Terima kasih.\n` +
      `Kelurahan Rawajati`
    );
  }

  /** Link wa.me ke Ketua RW giliran; null jika nomor kosong. */
  buildWaBlastKerjaBakti(row: KerjaBaktiRw): string | null {
    const rw = this.getRw(row.rwId);
    const phone = (rw?.telepon || '').replace(/\D/g, '').replace(/^0/, '62');
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(this.teksBlastUndanganKerjaBakti(row))}`;
  }

  catatBlastUndanganKerjaBakti(id: string): void {
    this.kerjaBaktiRws.update((list) =>
      list.map((k) =>
        k.id === id ? { ...k, undanganBlastAt: new Date().toISOString() } : k,
      ),
    );
    this.showToast('Blast WA undangan dicatat. Lampirkan PDF di chat jika perlu.');
  }

  /** Dukungan PPSU opsional — tidak wajib untuk menandai selesai. */
  simpanDukunganPpsuKerjaBakti(
    id: string,
    input: {
      ppsuJumlahPersonil?: number;
      ppsuReguLabel?: string;
      ppsuAlatIds?: string[];
      ppsuKendaraan?: string;
    },
  ): void {
    this.kerjaBaktiRws.update((list) =>
      list.map((k) =>
        k.id === id
          ? {
              ...k,
              ppsuJumlahPersonil: input.ppsuJumlahPersonil || undefined,
              ppsuReguLabel: input.ppsuReguLabel?.trim() || undefined,
              ppsuAlatIds: input.ppsuAlatIds?.length ? [...input.ppsuAlatIds] : undefined,
              ppsuKendaraan: input.ppsuKendaraan?.trim() || undefined,
            }
          : k,
      ),
    );
    this.showToast('Dukungan PPSU disimpan (opsional untuk rekap).');
  }

  labelAlatPpsu(ids?: string[]): string {
    if (!ids?.length) return '—';
    const names = ids
      .map((id) => this.asetPpsus().find((a) => a.id === id)?.namaAlat)
      .filter(Boolean);
    return names.length ? names.join(', ') : '—';
  }

  punyaDukunganPpsu(row: KerjaBaktiRw): boolean {
    return !!(
      row.ppsuJumlahPersonil ||
      row.ppsuReguLabel ||
      row.ppsuAlatIds?.length ||
      row.ppsuKendaraan
    );
  }

  hapusKerjaBakti(id: string): void {
    const prev = this.getKerjaBakti(id);
    if (prev?.undanganPdfUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.undanganPdfUrl);
    if (prev?.fotoUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.fotoUrl);
    this.kerjaBaktiRws.update((list) => list.filter((k) => k.id !== id));
    this.showToast('Jadwal kerja bakti dihapus.');
  }

  readonly suratKeluarsSorted = computed(() =>
    [...this.suratKeluars()].sort((a, b) => {
      if (b.tahun !== a.tahun) return b.tahun - a.tahun;
      return b.nomorUrut - a.nomorUrut;
    }),
  );

  labelKodeSurat(kode: KodeSuratKeluar): string {
    const map: Record<KodeSuratKeluar, string> = {
      UND: 'Undangan',
      KET: 'Keterangan',
      LAP: 'Laporan',
      DIS: 'Disposisi / edaran',
      LAIN: 'Lainnya',
    };
    return map[kode];
  }

  /** Bulan Romawi untuk format nomor surat. */
  bulanRomawi(bulan1to12: number): string {
    const r = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return r[Math.max(0, Math.min(11, bulan1to12 - 1))] ?? 'I';
  }

  /**
   * Nomor urut berikutnya per tahun (mock).
   * Produksi: atomic increment di backend.
   */
  nextNomorUrutSurat(tahun: number): number {
    const max = this.suratKeluars()
      .filter((s) => s.tahun === tahun)
      .reduce((m, s) => Math.max(m, s.nomorUrut), 0);
    return max + 1;
  }

  formatNomorSurat(nomorUrut: number, kode: KodeSuratKeluar, tanggal: string): string {
    const d = new Date(tanggal + 'T12:00:00');
    const bulan = Number.isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
    const tahun = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    const urut = String(nomorUrut).padStart(3, '0');
    return `${urut}/${kode}/RWJ/${this.bulanRomawi(bulan)}/${tahun}`;
  }

  previewNomorSurat(kode: KodeSuratKeluar, tanggal: string): string {
    const d = new Date(tanggal + 'T12:00:00');
    const tahun = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    return this.formatNomorSurat(this.nextNomorUrutSurat(tahun), kode, tanggal);
  }

  addSuratKeluar(input: {
    kode: KodeSuratKeluar;
    perihal: string;
    tujuan: string;
    tanggalSurat: string;
    dibuatOleh: string;
    catatan?: string;
    file?: File | null;
  }): SuratKeluar | null {
    if (!input.perihal.trim() || !input.tujuan.trim() || !input.tanggalSurat) {
      this.showToast('Perihal, tujuan, dan tanggal wajib diisi.');
      return null;
    }
    if (input.file && !input.file.name.toLowerCase().endsWith('.pdf')) {
      this.showToast('Arsip file harus PDF (opsional).');
      return null;
    }
    const d = new Date(input.tanggalSurat + 'T12:00:00');
    const tahun = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    const nomorUrut = this.nextNomorUrutSurat(tahun);
    const now = new Date().toISOString().slice(0, 19);
    const row: SuratKeluar = {
      id: `sk-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      nomorSurat: this.formatNomorSurat(nomorUrut, input.kode, input.tanggalSurat),
      nomorUrut,
      tahun,
      kode: input.kode,
      perihal: input.perihal.trim(),
      tujuan: input.tujuan.trim(),
      tanggalSurat: input.tanggalSurat,
      dibuatOleh: input.dibuatOleh,
      catatan: input.catatan?.trim() || undefined,
      createdAt: now,
    };
    if (input.file) {
      row.fileName = input.file.name;
      row.fileUrl = URL.createObjectURL(input.file);
    }
    this.suratKeluars.update((list) => [row, ...list]);
    this.showToast(`Nomor surat dicatat: ${row.nomorSurat}`);
    return row;
  }

  hapusSuratKeluar(id: string): void {
    const prev = this.suratKeluars().find((s) => s.id === id);
    if (prev?.fileUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.fileUrl);
    this.suratKeluars.update((list) => list.filter((s) => s.id !== id));
    this.showToast('Register surat dihapus.');
  }

  setoranSosialPeriode(tahun: number, bulan: number): SetoranSosial[] {
    return this.setoranSosials()
      .filter((s) => s.periodeTahun === tahun && s.periodeBulan === bulan)
      .sort((a, b) => b.tanggalSetor.localeCompare(a.tanggalSetor) || b.createdAt.localeCompare(a.createdAt));
  }

  totalSetoranJenis(tahun: number, bulan: number, jenis: JenisSetoranSosial): number {
    return this.setoranSosialPeriode(tahun, bulan)
      .filter((s) => s.jenis === jenis)
      .reduce((sum, s) => sum + s.nominal, 0);
  }

  getRekapMapPmi(tahun: number, bulan: number): RekapMapPmi | undefined {
    return this.rekapMapPmis().find((r) => r.tahun === tahun && r.bulan === bulan);
  }

  /** Selisih map − total catatan PMI (0 = klop). */
  selisihMapPmi(tahun: number, bulan: number): number {
    const map = this.getRekapMapPmi(tahun, bulan)?.totalUangMap ?? 0;
    return map - this.totalSetoranJenis(tahun, bulan, 'PMI');
  }

  addSetoranSosial(input: {
    jenis: JenisSetoranSosial;
    sumber: SumberSetoranSosial;
    namaPenyetor: string;
    rtId?: string;
    rwId?: string;
    nominal: number;
    adaKupon?: boolean;
    nomorKupon?: string;
    tanggalSetor: string;
    periodeTahun: number;
    periodeBulan: number;
    catatan?: string;
    dicatatOleh: string;
  }): SetoranSosial | null {
    if (!input.namaPenyetor.trim()) {
      this.showToast('Nama penyetor wajib diisi.');
      return null;
    }
    let nominal = Number(input.nominal) || 0;
    if (input.jenis === 'BAZNAS') {
      nominal = this.nominalWajibBaznas;
    }
    if (nominal <= 0) {
      this.showToast('Nominal PMI harus lebih dari 0.');
      return null;
    }
    const now = new Date().toISOString().slice(0, 19);
    const row: SetoranSosial = {
      id: `ss-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      jenis: input.jenis,
      sumber: input.sumber,
      namaPenyetor: input.namaPenyetor.trim(),
      rtId: input.rtId || undefined,
      rwId: input.rwId || undefined,
      nominal,
      adaKupon: input.jenis === 'BAZNAS' ? !!input.adaKupon : undefined,
      nomorKupon: input.jenis === 'BAZNAS' ? input.nomorKupon?.trim() || undefined : undefined,
      tanggalSetor: input.tanggalSetor,
      periodeTahun: input.periodeTahun,
      periodeBulan: input.periodeBulan,
      catatan: input.catatan?.trim() || undefined,
      dicatatOleh: input.dicatatOleh,
      createdAt: now,
    };
    this.setoranSosials.update((list) => [row, ...list]);
    this.showToast(
      input.jenis === 'PMI'
        ? `Setoran PMI ${this.formatRp(nominal)} dicatat.`
        : `Setoran BAZNAS ${this.formatRp(nominal)} dicatat.`,
    );
    return row;
  }

  hapusSetoranSosial(id: string): void {
    this.setoranSosials.update((list) => list.filter((s) => s.id !== id));
    this.showToast('Catatan setoran dihapus.');
  }

  simpanRekapMapPmi(input: {
    tahun: number;
    bulan: number;
    totalUangMap: number;
    updatedBy: string;
    catatan?: string;
  }): void {
    const now = new Date().toISOString().slice(0, 19);
    const existing = this.getRekapMapPmi(input.tahun, input.bulan);
    if (existing) {
      this.rekapMapPmis.update((list) =>
        list.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                totalUangMap: Number(input.totalUangMap) || 0,
                updatedAt: now,
                updatedBy: input.updatedBy,
                catatan: input.catatan?.trim() || undefined,
              }
            : r,
        ),
      );
    } else {
      this.rekapMapPmis.update((list) => [
        {
          id: `map-${Date.now()}`,
          kelurahanId: this.kelurahan.id,
          tahun: input.tahun,
          bulan: input.bulan,
          totalUangMap: Number(input.totalUangMap) || 0,
          updatedAt: now,
          updatedBy: input.updatedBy,
          catatan: input.catatan?.trim() || undefined,
        },
        ...list,
      ]);
    }
    const selisih = this.selisihMapPmi(input.tahun, input.bulan);
    this.showToast(
      selisih === 0
        ? 'Uang map PMI klop dengan catatan.'
        : `Map disimpan. Selisih vs catatan: ${this.formatRp(selisih)}.`,
    );
  }

  labelSumberSetoran(s: SumberSetoranSosial): string {
    const map: Record<SumberSetoranSosial, string> = {
      RT: 'Ketua RT',
      RW: 'Ketua RW',
      TAMU_LAYANAN: 'Tamu layanan',
    };
    return map[s];
  }
}
