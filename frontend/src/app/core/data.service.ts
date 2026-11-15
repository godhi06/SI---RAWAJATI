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
  JenisKalenderOps,
  JenisPenerimaPerintah,
  KalenderOpsItem,
  KegiatanSaluran,
  KerjaBaktiRw,
  KodeSuratKeluar,
  KondisiAset,
  LaporanKeuanganRt,
  LaporanKerjaPpsu,
  LaporanPsn,
  AnggotaLmk,
  ChecklistEventItem,
  EventBesar,
  KategoriPengaduan,
  PengaduanWilayah,
  PerintahLurah,
  PesertaAgenda,
  PrioritasPengaduan,
  PrioritasPerintah,
  RekapMapPmi,
  StatusChecklistItem,
  StatusEventBesar,
  StatusPengaduan,
  StatusSuratMasuk,
  SuratMasuk,
  TamuDinas,
  TujuanKunjungan,
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
  StatusPerintahLurah,
  StatusPinjamAlat,
  StatusVerifikasi,
  SuratKeluar,
  PenerimaSuratKelurahan,
  TemplateDaopKosong,
  UndanganPsnDraft,
  UndanganPsnKirim,
  UndanganPsnPdf,
  UserAccount,
  WargaPendatang,
  WargaTerdata,
  StatusTinggalWarga,
  KategoriWargaKhusus,
  IuranKasWarga,
  KasTransaksiRt,
  KasTransaksiRw,
  KategoriKasRt,
  KategoriKasRw,
  SetoranRtKeRw,
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
  readonly wargaTerdatas = signal<WargaTerdata[]>([]);
  readonly iuranKasWargas = signal<IuranKasWarga[]>([]);
  readonly kasTransaksiRts = signal<KasTransaksiRt[]>([]);
  readonly kasTransaksiRws = signal<KasTransaksiRw[]>([]);
  readonly setoranRtKeRws = signal<SetoranRtKeRw[]>([]);
  readonly asetPpsus = signal<AsetPpsu[]>([]);
  readonly kegiatanSalurans = signal<KegiatanSaluran[]>([]);
  readonly laporanKerjaPpsus = signal<LaporanKerjaPpsu[]>([]);
  readonly laporanKeuanganRts = signal<LaporanKeuanganRt[]>([]);
  readonly agendaRapats = signal<AgendaRapat[]>([]);
  readonly kerjaBaktiRws = signal<KerjaBaktiRw[]>([]);
  readonly suratKeluars = signal<SuratKeluar[]>([]);
  readonly setoranSosials = signal<SetoranSosial[]>([]);
  readonly rekapMapPmis = signal<RekapMapPmi[]>([]);
  readonly perintahLurahs = signal<PerintahLurah[]>([]);
  readonly pengaduans = signal<PengaduanWilayah[]>([]);
  readonly suratMasuks = signal<SuratMasuk[]>([]);
  readonly tamuDinas = signal<TamuDinas[]>([]);
  readonly eventBesars = signal<EventBesar[]>([]);
  readonly anggotaLmks = signal<AnggotaLmk[]>([]);
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
      label: 'Ketua RW 07 — Susilo',
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
    // SK demo: buat file unduhan agar tidak perlu unggah ulang saat cari SK hilang
    this.rws.set(
      structuredClone(seed.rws).map((rw) => {
        const skFileName = rw.skFileName?.replace(/\.txt$/i, '.pdf');
        if (!skFileName || rw.skFileUrl) return { ...rw, skFileName };
        return {
          ...rw,
          skFileName,
          skFileUrl: this.buatUrlSkDemo({
            jenis: 'RW',
            label: this.labelRw(rw.nomor),
            nama: rw.namaKetua,
            nomorSk: rw.nomorSk,
            mulai: rw.jabatanMulai,
            selesai: rw.jabatanSelesai,
            fileName: skFileName,
          }),
        };
      }),
    );
    this.rts.set(
      structuredClone(seed.rts).map((rt) => {
        const skFileName = rt.skFileName?.replace(/\.txt$/i, '.pdf');
        if (!skFileName || rt.skFileUrl) return { ...rt, skFileName };
        const rwNomor = seed.rws.find((r) => r.id === rt.rwId)?.nomor ?? '00';
        return {
          ...rt,
          skFileName,
          skFileUrl: this.buatUrlSkDemo({
            jenis: 'RT',
            label: `${this.labelRt(rt.nomor)}/${this.labelRw(rwNomor)}`,
            nama: rt.namaKetua,
            nomorSk: rt.nomorSk,
            mulai: rt.jabatanMulai,
            selesai: rt.jabatanSelesai,
            fileName: skFileName,
          }),
        };
      }),
    );
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
    this.wargaTerdatas.set(structuredClone(seed.wargaTerdatas ?? []));
    this.iuranKasWargas.set(structuredClone(seed.iuranKasWargas ?? []));
    this.kasTransaksiRts.set(structuredClone(seed.kasTransaksiRts ?? []));
    this.kasTransaksiRws.set(structuredClone(seed.kasTransaksiRws ?? []));
    this.setoranRtKeRws.set(structuredClone(seed.setoranRtKeRws ?? []));
    this.asetPpsus.set(structuredClone(seed.asetPpsus));
    this.kegiatanSalurans.set(structuredClone(seed.kegiatanSalurans));
    this.laporanKerjaPpsus.set(structuredClone(seed.laporanKerjaPpsus));
    this.laporanKeuanganRts.set(structuredClone(seed.laporanKeuanganRts));
    this.agendaRapats.set(structuredClone(seed.agendaRapats));
    this.kerjaBaktiRws.set(structuredClone(seed.kerjaBaktiRws));
    this.suratKeluars.set(
      structuredClone(seed.suratKeluars).map((s) => {
        if (s.fileUrl) return s;
        if (s.kode !== 'UND') return s;
        const fileName = `Surat-${s.nomorSurat.replace(/\//g, '-')}.pdf`;
        return {
          ...s,
          fileName,
          fileUrl: this.buatUrlSuratKeluarDemo(s, fileName),
        };
      }),
    );
    this.setoranSosials.set(structuredClone(seed.setoranSosials));
    this.rekapMapPmis.set(structuredClone(seed.rekapMapPmis));
    this.perintahLurahs.set(structuredClone(seed.perintahLurahs));
    this.pengaduans.set(structuredClone(seed.pengaduans));
    this.suratMasuks.set(structuredClone(seed.suratMasuks));
    this.tamuDinas.set(structuredClone(seed.tamuDinas));
    this.eventBesars.set(structuredClone(seed.eventBesars));
    this.anggotaLmks.set(structuredClone(seed.anggotaLmks));
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
    verifierName?: string,
    catatan?: string,
  ): void {
    const row = this.wargaPendatangs().find((w) => w.id === id);
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
    if (status === 'DITERIMA' && row) {
      const exists = this.wargaTerdatas().some((w) => w.nik === row.nik && w.rtId === row.rtId);
      if (!exists) {
        this.addWargaTerdata({
          rtId: row.rtId,
          rumahWargaId: row.rumahWargaId,
          nama: row.namaPenghuni,
          nik: row.nik,
          jenisKelamin: row.jenisKelamin === 'P' ? 'P' : row.jenisKelamin === 'L' ? 'L' : undefined,
          tanggalLahir: row.tanggalLahir,
          statusTinggal: 'KOS',
          alamat: row.alamatKos,
          asalDaerah: row.asalDaerah,
          tanggalMasuk: row.tanggalMasuk,
          fotoKtpName: row.fotoKtpName,
          statusVerifikasi: 'DITERIMA',
          dicatatOleh: verifierName || 'Ketua RT',
          catatan: catatan || `Dari laporan kos · pemilik ${row.namaPemilikKos}`,
        });
      }
    }
    this.showToast(status === 'DITERIMA' ? 'Laporan kos diterima · masuk buku warga.' : 'Laporan kos ditolak.');
  }

  labelStatusTinggal(s: StatusTinggalWarga): string {
    const map: Record<StatusTinggalWarga, string> = {
      TETAP: 'Warga tetap',
      KOS: 'Kos',
      KONTRAK: 'Kontrak',
    };
    return map[s];
  }

  labelKategoriWarga(k: KategoriWargaKhusus): string {
    const map: Record<KategoriWargaKhusus, string> = {
      LANSIA: 'Lansia',
      JANDA: 'Janda',
      PENERIMA_BANSOS: 'Penerima bansos',
    };
    return map[k];
  }

  wargaPunyaKategori(w: WargaTerdata, k: KategoriWargaKhusus): boolean {
    return (w.kategoriKhusus || []).includes(k);
  }

  ringkasKategoriWarga(user: UserAccount | null | undefined): {
    lansia: number;
    janda: number;
    bansos: number;
  } {
    const list = this.wargaTerdataScoped(user).filter((w) => w.statusVerifikasi === 'DITERIMA');
    return {
      lansia: list.filter((w) => this.wargaPunyaKategori(w, 'LANSIA')).length,
      janda: list.filter((w) => this.wargaPunyaKategori(w, 'JANDA')).length,
      bansos: list.filter((w) => this.wargaPunyaKategori(w, 'PENERIMA_BANSOS')).length,
    };
  }

  wargaTerdataScoped(user: UserAccount | null | undefined): WargaTerdata[] {
    let list = [...this.wargaTerdatas()];
    if (!user) return [];
    if (user.role === 'OP_RT' && user.rtId) list = list.filter((w) => w.rtId === user.rtId);
    else if (user.role === 'KOORD_RW' && user.rwId) {
      const rtIds = new Set(this.rts().filter((r) => r.rwId === user.rwId).map((r) => r.id));
      list = list.filter((w) => rtIds.has(w.rtId));
    }
    return list.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }

  wargaPendatangPendingScoped(user: UserAccount | null | undefined): WargaPendatang[] {
    let list = this.wargaPendatangs().filter((w) => w.statusVerifikasi === 'PENDING');
    if (!user) return [];
    if (user.role === 'OP_RT' && user.rtId) list = list.filter((w) => w.rtId === user.rtId);
    else if (user.role === 'KOORD_RW' && user.rwId) {
      const rtIds = new Set(this.rts().filter((r) => r.rwId === user.rwId).map((r) => r.id));
      list = list.filter((w) => rtIds.has(w.rtId));
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Warga baru dari Dasawisma — menunggu sah Ketua RT. */
  wargaTerdataPendingScoped(user: UserAccount | null | undefined): WargaTerdata[] {
    return this.wargaTerdataScoped(user)
      .filter((w) => w.statusVerifikasi === 'PENDING')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  verifikasiWargaTerdata(
    id: string,
    status: 'DITERIMA' | 'DITOLAK',
    diverifikasiOleh: string,
    catatan?: string,
  ): void {
    const row = this.getWargaTerdata(id);
    if (!row || row.statusVerifikasi !== 'PENDING') {
      this.showToast('Data tidak dalam antrian verifikasi.');
      return;
    }
    if (status === 'DITOLAK') {
      this.wargaTerdatas.update((list) => list.filter((w) => w.id !== id));
      this.showToast(`Data warga ditolak${catatan ? ': ' + catatan : ''}.`);
      return;
    }
    this.wargaTerdatas.update((list) =>
      list.map((w) =>
        w.id === id
          ? {
              ...w,
              statusVerifikasi: 'DITERIMA',
              catatan: catatan || w.catatan,
              updatedAt: new Date().toISOString(),
              dicatatOleh: `${w.dicatatOleh} · disahkan ${diverifikasiOleh}`,
            }
          : w,
      ),
    );
    this.showToast(`Warga disahkan: ${row.nama}`);
  }

  cariWargaTerdata(
    user: UserAccount | null | undefined,
    q: string,
    kategori?: KategoriWargaKhusus | 'SEMUA',
  ): WargaTerdata[] {
    let list = this.wargaTerdataScoped(user);
    if (kategori && kategori !== 'SEMUA') {
      list = list.filter((w) => this.wargaPunyaKategori(w, kategori));
    }
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((w) => {
      const hay = [
        w.nama,
        w.nik,
        w.noKk,
        w.alamat,
        w.pekerjaan,
        w.asalDaerah,
        w.hubunganKk,
        w.programBansos,
        ...(w.kategoriKhusus || []).map((k) => this.labelKategoriWarga(k)),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }

  getWargaTerdata(id: string): WargaTerdata | undefined {
    return this.wargaTerdatas().find((w) => w.id === id);
  }

  labelKategoriKas(k: KategoriKasRt): string {
    const map: Record<KategoriKasRt, string> = {
      IURAN_WARGA: 'Iuran kas warga',
      SETOR_RW: 'Setor taawun / kas RW',
      SAMPAH: 'Sampah / LH',
      BANTUAN_SAKIT: 'Bantuan warga sakit',
      OPERASIONAL: 'Operasional RT',
      DONASI: 'Donasi / iuran pihak lain',
      LAINNYA: 'Lainnya',
    };
    return map[k];
  }

  /** Kepala keluarga / penanggung iuran di RT (untuk matriks). */
  wargaIuranScoped(user: UserAccount | null | undefined): WargaTerdata[] {
    return this.wargaTerdataScoped(user).filter(
      (w) =>
        w.statusVerifikasi === 'DITERIMA' &&
        w.statusTinggal === 'TETAP' &&
        /kepala/i.test(w.hubunganKk || ''),
    );
  }

  iuranKasScoped(rtId: string, tahun: number): IuranKasWarga[] {
    return this.iuranKasWargas().filter((i) => i.rtId === rtId && i.tahun === tahun);
  }

  getIuran(wargaId: string, tahun: number, bulan: number): IuranKasWarga | undefined {
    return this.iuranKasWargas().find(
      (i) => i.wargaTerdataId === wargaId && i.tahun === tahun && i.bulan === bulan,
    );
  }

  setIuranBayar(input: {
    rtId: string;
    wargaTerdataId: string;
    tahun: number;
    bulan: number;
    tanggalBayar: string;
    nominal?: number;
    dicatatOleh: string;
  }): void {
    const existing = this.getIuran(input.wargaTerdataId, input.tahun, input.bulan);
    if (existing) {
      this.iuranKasWargas.update((list) =>
        list.map((i) =>
          i.id === existing.id
            ? { ...i, tanggalBayar: input.tanggalBayar, nominal: input.nominal ?? i.nominal }
            : i,
        ),
      );
    } else {
      const row: IuranKasWarga = {
        id: `iu-${Date.now()}`,
        kelurahanId: this.kelurahan.id,
        rtId: input.rtId,
        wargaTerdataId: input.wargaTerdataId,
        tahun: input.tahun,
        bulan: input.bulan,
        tanggalBayar: input.tanggalBayar,
        nominal: input.nominal ?? 15_000,
        dicatatOleh: input.dicatatOleh,
        createdAt: new Date().toISOString(),
      };
      this.iuranKasWargas.update((list) => [row, ...list]);
    }
    this.showToast('Iuran dicatat.');
  }

  hapusIuran(id: string): void {
    this.iuranKasWargas.update((list) => list.filter((i) => i.id !== id));
    this.showToast('Iuran dihapus.');
  }

  kasTransaksiScoped(rtId: string): KasTransaksiRt[] {
    return [...this.kasTransaksiRts()]
      .filter((k) => k.rtId === rtId)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.createdAt.localeCompare(a.createdAt));
  }

  ringkasKasRt(rtId: string): { debet: number; kredit: number; saldo: number } {
    const list = this.kasTransaksiScoped(rtId);
    const debet = list.reduce((s, x) => s + (x.debet || 0), 0);
    const kredit = list.reduce((s, x) => s + (x.kredit || 0), 0);
    return { debet, kredit, saldo: debet - kredit };
  }

  addKasTransaksi(input: {
    rtId: string;
    tanggal: string;
    uraian: string;
    kategori: KategoriKasRt;
    debet: number;
    kredit: number;
    dicatatOleh: string;
  }): KasTransaksiRt | null {
    if (!input.uraian.trim() || !input.tanggal) {
      this.showToast('Tanggal dan uraian wajib.');
      return null;
    }
    if ((input.debet || 0) <= 0 && (input.kredit || 0) <= 0) {
      this.showToast('Isi debet (masuk) atau kredit (keluar).');
      return null;
    }
    const row: KasTransaksiRt = {
      id: `kas-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      rtId: input.rtId,
      tanggal: input.tanggal,
      uraian: input.uraian.trim(),
      kategori: input.kategori,
      debet: Math.max(0, input.debet || 0),
      kredit: Math.max(0, input.kredit || 0),
      dicatatOleh: input.dicatatOleh,
      createdAt: new Date().toISOString(),
    };
    this.kasTransaksiRts.update((list) => [row, ...list]);
    this.showToast('Transaksi kas dicatat.');
    return row;
  }

  labelKategoriKasRw(k: KategoriKasRw): string {
    const map: Record<KategoriKasRw, string> = {
      SETOR_RT: 'Setoran dari RT',
      IURAN_RW: 'Iuran tingkat RW',
      SANTUNAN_MENINGGAL: 'Santunan meninggal',
      BANTUAN_SAKIT: 'Bantuan sakit',
      OPERASIONAL: 'Operasional RW',
      DONASI: 'Donasi',
      LAINNYA: 'Lainnya',
    };
    return map[k];
  }

  /** Rekap warga + kas per RT di satu RW (portal Ketua RW). */
  rekapWargaPerRt(rwId: string): Array<{
    rtId: string;
    nomor: string;
    namaKetua: string;
    tetap: number;
    kos: number;
    total: number;
    lansia: number;
    janda: number;
    bansos: number;
    saldoKasRt: number;
  }> {
    return this.rts()
      .filter((rt) => rt.rwId === rwId)
      .sort((a, b) => a.nomor.localeCompare(b.nomor, 'id'))
      .map((rt) => {
        const warga = this.wargaTerdatas().filter(
          (w) => w.rtId === rt.id && w.statusVerifikasi === 'DITERIMA',
        );
        const tetap = warga.filter((w) => w.statusTinggal === 'TETAP').length;
        const kos = warga.filter((w) => w.statusTinggal === 'KOS' || w.statusTinggal === 'KONTRAK').length;
        return {
          rtId: rt.id,
          nomor: rt.nomor,
          namaKetua: rt.namaKetua,
          tetap,
          kos,
          total: warga.length,
          lansia: warga.filter((w) => this.wargaPunyaKategori(w, 'LANSIA')).length,
          janda: warga.filter((w) => this.wargaPunyaKategori(w, 'JANDA')).length,
          bansos: warga.filter((w) => this.wargaPunyaKategori(w, 'PENERIMA_BANSOS')).length,
          saldoKasRt: this.ringkasKasRt(rt.id).saldo,
        };
      });
  }

  kasTransaksiRwScoped(rwId: string): KasTransaksiRw[] {
    return [...this.kasTransaksiRws()]
      .filter((k) => k.rwId === rwId)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.createdAt.localeCompare(a.createdAt));
  }

  ringkasKasRw(rwId: string): { debet: number; kredit: number; saldo: number } {
    const list = this.kasTransaksiRwScoped(rwId);
    const debet = list.reduce((s, x) => s + (x.debet || 0), 0);
    const kredit = list.reduce((s, x) => s + (x.kredit || 0), 0);
    return { debet, kredit, saldo: debet - kredit };
  }

  getSetoranRtKeRw(rwId: string, rtId: string, tahun: number, bulan: number): SetoranRtKeRw | undefined {
    return this.setoranRtKeRws().find(
      (s) => s.rwId === rwId && s.rtId === rtId && s.tahun === tahun && s.bulan === bulan,
    );
  }

  ringkasSetoranRtBulan(
    rwId: string,
    tahun: number,
    bulan: number,
  ): { lunas: number; total: number; nominal: number } {
    const rts = this.rts().filter((r) => r.rwId === rwId);
    let nominal = 0;
    let lunas = 0;
    for (const rt of rts) {
      const s = this.getSetoranRtKeRw(rwId, rt.id, tahun, bulan);
      if (s) {
        lunas += 1;
        nominal += s.nominal || 0;
      }
    }
    return { lunas, total: rts.length, nominal };
  }

  setSetoranRtBayar(input: {
    rwId: string;
    rtId: string;
    tahun: number;
    bulan: number;
    tanggalBayar: string;
    nominal?: number;
    dicatatOleh: string;
  }): void {
    const nominal = input.nominal ?? 200_000;
    const existing = this.getSetoranRtKeRw(input.rwId, input.rtId, input.tahun, input.bulan);
    const rt = this.getRt(input.rtId);
    if (existing) {
      this.setoranRtKeRws.update((list) =>
        list.map((s) =>
          s.id === existing.id
            ? { ...s, tanggalBayar: input.tanggalBayar, nominal, dicatatOleh: input.dicatatOleh }
            : s,
        ),
      );
      this.showToast(`Setoran RT ${rt?.nomor || ''} diperbarui.`);
      return;
    }
    const row: SetoranRtKeRw = {
      id: `setor-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      rwId: input.rwId,
      rtId: input.rtId,
      tahun: input.tahun,
      bulan: input.bulan,
      tanggalBayar: input.tanggalBayar,
      nominal,
      dicatatOleh: input.dicatatOleh,
      createdAt: new Date().toISOString(),
    };
    this.setoranRtKeRws.update((list) => [row, ...list]);
    const kasRow: KasTransaksiRw = {
      id: `kasrw-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      rwId: input.rwId,
      dariRtId: input.rtId,
      tanggal: input.tanggalBayar,
      uraian: `Setoran taawun / kas RW dari RT ${rt?.nomor || '?'} bulan ${input.bulan}/${input.tahun}`,
      kategori: 'SETOR_RT',
      debet: nominal,
      kredit: 0,
      dicatatOleh: input.dicatatOleh,
      createdAt: new Date().toISOString(),
    };
    this.kasTransaksiRws.update((list) => [kasRow, ...list]);
    this.showToast(`Setoran RT ${rt?.nomor || ''} dicatat.`);
  }

  hapusSetoranRt(id: string): void {
    const row = this.setoranRtKeRws().find((s) => s.id === id);
    this.setoranRtKeRws.update((list) => list.filter((s) => s.id !== id));
    if (row) {
      // Hapus jejak buku kas setoran yang sama bulan/RT (best-effort demo)
      this.kasTransaksiRws.update((list) =>
        list.filter(
          (k) =>
            !(
              k.kategori === 'SETOR_RT' &&
              k.dariRtId === row.rtId &&
              k.rwId === row.rwId &&
              k.tanggal.startsWith(`${row.tahun}-${String(row.bulan).padStart(2, '0')}`)
            ),
        ),
      );
    }
    this.showToast('Setoran RT dihapus.');
  }

  addKasTransaksiRw(input: {
    rwId: string;
    tanggal: string;
    uraian: string;
    kategori: KategoriKasRw;
    debet: number;
    kredit: number;
    dicatatOleh: string;
    dariRtId?: string;
  }): KasTransaksiRw | null {
    if (!input.uraian.trim() || !input.tanggal) {
      this.showToast('Tanggal dan uraian wajib.');
      return null;
    }
    if ((input.debet || 0) <= 0 && (input.kredit || 0) <= 0) {
      this.showToast('Isi debet (masuk) atau kredit (keluar).');
      return null;
    }
    const row: KasTransaksiRw = {
      id: `kasrw-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      rwId: input.rwId,
      dariRtId: input.dariRtId,
      tanggal: input.tanggal,
      uraian: input.uraian.trim(),
      kategori: input.kategori,
      debet: Math.max(0, input.debet || 0),
      kredit: Math.max(0, input.kredit || 0),
      dicatatOleh: input.dicatatOleh,
      createdAt: new Date().toISOString(),
    };
    this.kasTransaksiRws.update((list) => [row, ...list]);
    this.showToast('Transaksi kas RW dicatat.');
    return row;
  }

  /** Ringkas iuran tahun: berapa KK lunas bulan tertentu. */
  ringkasIuranBulan(rtId: string, tahun: number, bulan: number): { lunas: number; total: number } {
    const warga = this.wargaTerdatas().filter(
      (w) =>
        w.rtId === rtId &&
        w.statusVerifikasi === 'DITERIMA' &&
        w.statusTinggal === 'TETAP' &&
        /kepala/i.test(w.hubunganKk || ''),
    );
    const lunas = warga.filter((w) => !!this.getIuran(w.id, tahun, bulan)).length;
    return { lunas, total: warga.length };
  }

  addWargaTerdata(
    input: Omit<WargaTerdata, 'id' | 'kelurahanId' | 'createdAt' | 'updatedAt'> & {
      statusVerifikasi?: StatusVerifikasi;
    },
  ): WargaTerdata | null {
    if (!input.nama.trim() || !input.nik.trim() || !input.alamat.trim() || !input.rtId) {
      this.showToast('Nama, NIK, alamat, dan RT wajib diisi.');
      return null;
    }
    const nik = input.nik.replace(/\D/g, '');
    if (nik.length < 16) {
      this.showToast('NIK minimal 16 digit.');
      return null;
    }
    if (this.wargaTerdatas().some((w) => w.nik === nik && w.rtId === input.rtId)) {
      this.showToast('NIK sudah tercatat di RT ini.');
      return null;
    }
    const now = new Date().toISOString();
    const row: WargaTerdata = {
      ...input,
      id: `wt-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      nama: input.nama.trim(),
      nik,
      noKk: input.noKk?.replace(/\D/g, '') || undefined,
      alamat: input.alamat.trim(),
      statusVerifikasi: input.statusVerifikasi ?? 'DITERIMA',
      createdAt: now,
      updatedAt: now,
    };
    this.wargaTerdatas.update((list) => [row, ...list]);
    this.showToast(
      row.statusVerifikasi === 'PENDING'
        ? `Warga dikirim ke antrian RT: ${row.nama}`
        : `Warga dicatat: ${row.nama}`,
    );
    return row;
  }

  /** Perbarui data warga (NIK/KK/alamat dummy → data asli). */
  updateWargaTerdata(
    id: string,
    patch: Partial<
      Pick<
        WargaTerdata,
        | 'nama'
        | 'nik'
        | 'noKk'
        | 'statusTinggal'
        | 'alamat'
        | 'hubunganKk'
        | 'pekerjaan'
        | 'jenisKelamin'
        | 'asalDaerah'
        | 'fotoKkName'
        | 'fotoKtpName'
        | 'kategoriKhusus'
        | 'programBansos'
      >
    >,
  ): boolean {
    const existing = this.getWargaTerdata(id);
    if (!existing) {
      this.showToast('Data warga tidak ditemukan.');
      return false;
    }
    const nama = (patch.nama ?? existing.nama).trim();
    const nik = (patch.nik ?? existing.nik).replace(/\D/g, '');
    const alamat = (patch.alamat ?? existing.alamat).trim();
    if (!nama || !nik || !alamat) {
      this.showToast('Nama, NIK, dan alamat wajib diisi.');
      return false;
    }
    if (nik.length < 16) {
      this.showToast('NIK minimal 16 digit.');
      return false;
    }
    if (this.wargaTerdatas().some((w) => w.id !== id && w.nik === nik && w.rtId === existing.rtId)) {
      this.showToast('NIK sudah dipakai warga lain di RT ini.');
      return false;
    }
    const noKkRaw = patch.noKk !== undefined ? patch.noKk : existing.noKk;
    const noKk = noKkRaw?.replace(/\D/g, '') || undefined;
    this.wargaTerdatas.update((list) =>
      list.map((w) =>
        w.id === id
          ? {
              ...w,
              ...patch,
              nama,
              nik,
              noKk,
              alamat,
              updatedAt: new Date().toISOString(),
            }
          : w,
      ),
    );
    this.showToast(`Data warga diperbarui: ${nama}`);
    return true;
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

  /** Koordinat fallback area Rawajati (hanya jika GPS perangkat gagal/ditolak). */
  private gpsSimulasiRawajati(): {
    latitude: number;
    longitude: number;
    gpsSource: 'simulasi';
  } {
    const baseLat = -6.2568;
    const baseLng = 106.8542;
    return {
      latitude: Number((baseLat + (Math.random() - 0.5) * 0.002).toFixed(6)),
      longitude: Number((baseLng + (Math.random() - 0.5) * 0.002).toFixed(6)),
      gpsSource: 'simulasi',
    };
  }

  /** Ambil GPS HP/browser asli; fallback simulasi bila ditolak/timeout. */
  ambilGpsPerangkat(): Promise<{
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    gpsSource: 'device' | 'simulasi';
  }> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return Promise.resolve(this.gpsSimulasiRawajati());
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracyMeters: Math.round(pos.coords.accuracy),
            gpsSource: 'device',
          });
        },
        () => resolve(this.gpsSimulasiRawajati()),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
      );
    });
  }

  /** Foto lapangan + timestamp + koordinat (utama: GPS perangkat). */
  buatFotoSlot(
    label: FotoKerjaSlot['label'],
    fileName: string,
    gps?: {
      latitude: number;
      longitude: number;
      accuracyMeters?: number;
      gpsSource?: 'device' | 'simulasi';
    },
  ): FotoKerjaSlot {
    const fallback = this.gpsSimulasiRawajati();
    return {
      label,
      fileName,
      timestamp: new Date().toISOString(),
      latitude: gps?.latitude ?? fallback.latitude,
      longitude: gps?.longitude ?? fallback.longitude,
      accuracyMeters: gps?.accuracyMeters,
      gpsSource: gps?.gpsSource ?? fallback.gpsSource,
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

  /** Status masa jabatan RT/RW untuk pantauan Lurah. */
  statusMasaJabatan(selesai?: string): 'AKTIF' | 'HAMPIR_HABIS' | 'HABIS' | 'BELUM_DIISI' {
    if (!selesai) return 'BELUM_DIISI';
    const today = this.ymdLocal(new Date());
    if (selesai < today) return 'HABIS';
    const limit = new Date();
    limit.setDate(limit.getDate() + 90);
    if (selesai <= this.ymdLocal(limit)) return 'HAMPIR_HABIS';
    return 'AKTIF';
  }

  labelStatusMasaJabatan(s: ReturnType<DataService['statusMasaJabatan']>): string {
    const map = {
      AKTIF: 'Aktif',
      HAMPIR_HABIS: 'Hampir habis (<90 hari)',
      HABIS: 'Habis masa jabatan',
      BELUM_DIISI: 'Belum diisi',
    } as const;
    return map[s];
  }

  /** RT/RW yang SK/masa jabatan perlu perhatian. */
  wilayahJabatanAlert = computed(() => {
    const rows: Array<{
      id: string;
      jenis: 'RW' | 'RT';
      label: string;
      namaKetua: string;
      jabatanSelesai?: string;
      status: ReturnType<DataService['statusMasaJabatan']>;
      punyaSk: boolean;
    }> = [];
    for (const rw of this.rws()) {
      const st = this.statusMasaJabatan(rw.jabatanSelesai);
      if (st === 'HABIS' || st === 'HAMPIR_HABIS' || !rw.skFileName) {
        rows.push({
          id: rw.id,
          jenis: 'RW',
          label: this.labelRw(rw.nomor),
          namaKetua: rw.namaKetua,
          jabatanSelesai: rw.jabatanSelesai,
          status: st === 'AKTIF' && !rw.skFileName ? 'BELUM_DIISI' : st,
          punyaSk: !!rw.skFileName,
        });
      }
    }
    for (const rt of this.rts()) {
      const st = this.statusMasaJabatan(rt.jabatanSelesai);
      if (st === 'HABIS' || st === 'HAMPIR_HABIS' || !rt.skFileName) {
        rows.push({
          id: rt.id,
          jenis: 'RT',
          label: this.labelWilayah(rt.id),
          namaKetua: rt.namaKetua,
          jabatanSelesai: rt.jabatanSelesai,
          status: st === 'AKTIF' && !rt.skFileName ? 'BELUM_DIISI' : st,
          punyaSk: !!rt.skFileName,
        });
      }
    }
    return rows;
  });

  /** Power user (ADMIN_KEL): tambah RW baru. */
  addRw(input: {
    nomor: string;
    namaKetua: string;
    telepon?: string;
    jabatanMulai?: string;
    jabatanSelesai?: string;
    nomorSk?: string;
  }): Rw | null {
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
      jabatanMulai: input.jabatanMulai || undefined,
      jabatanSelesai: input.jabatanSelesai || undefined,
      nomorSk: input.nomorSk?.trim() || undefined,
    };
    this.rws.update((list) => [...list, row]);
    this.showToast(`${this.labelRw(nomor)} ditambahkan.`);
    return row;
  }

  /** Power user (ADMIN_KEL): tambah RT baru di bawah suatu RW. */
  addRt(input: {
    nomor: string;
    namaKetua: string;
    telepon?: string;
    rwId: string;
    jabatanMulai?: string;
    jabatanSelesai?: string;
    nomorSk?: string;
  }): Rt | null {
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
      jabatanMulai: input.jabatanMulai || undefined,
      jabatanSelesai: input.jabatanSelesai || undefined,
      nomorSk: input.nomorSk?.trim() || undefined,
    };
    this.rts.update((list) => [...list, row]);
    this.showToast(`${this.labelWilayah(row.id)} ditambahkan.`);
    return row;
  }

  /** Power user (ADMIN_KEL): ubah Ketua RW + nomor WA + masa jabatan/SK. */
  updateRw(
    id: string,
    patch: Partial<
      Pick<Rw, 'namaKetua' | 'telepon' | 'nomor' | 'jabatanMulai' | 'jabatanSelesai' | 'nomorSk'>
    >,
  ): void {
    const next = { ...patch };
    if (next.nomor != null) next.nomor = this.normalizeNomorRw(next.nomor);
    this.rws.update((list) => list.map((r) => (r.id === id ? { ...r, ...next } : r)));
    this.showToast('Data Ketua RW diperbarui.');
  }

  /** Power user (ADMIN_KEL): ubah Ketua RT + nomor WA + masa jabatan/SK. */
  updateRt(
    id: string,
    patch: Partial<
      Pick<
        Rt,
        'namaKetua' | 'telepon' | 'nomor' | 'rwId' | 'jabatanMulai' | 'jabatanSelesai' | 'nomorSk'
      >
    >,
  ): void {
    const next = { ...patch };
    if (next.nomor != null) next.nomor = this.normalizeNomorRt(next.nomor);
    this.rts.update((list) => list.map((r) => (r.id === id ? { ...r, ...next } : r)));
    this.showToast('Data Ketua RT diperbarui.');
  }

  setSkRw(id: string, file: File | null): void {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const now = new Date().toISOString().slice(0, 19);
    this.rws.update((list) =>
      list.map((r) =>
        r.id === id
          ? { ...r, skFileName: file.name, skFileUrl: url, skUploadedAt: now }
          : r,
      ),
    );
    this.showToast(`SK RW diunggah: ${file.name}`);
  }

  setSkRt(id: string, file: File | null): void {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const now = new Date().toISOString().slice(0, 19);
    this.rts.update((list) =>
      list.map((r) =>
        r.id === id
          ? { ...r, skFileName: file.name, skFileUrl: url, skUploadedAt: now }
          : r,
      ),
    );
    this.showToast(`SK RT diunggah: ${file.name}`);
  }

  /** PDF demo surat keluar — format surat dinas kelurahan (kop + isi resmi). */
  private buatUrlSuratKeluarDemo(
    s: Pick<SuratKeluar, 'nomorSurat' | 'perihal' | 'tujuan' | 'tanggalSurat' | 'dibuatOleh' | 'kode'>,
    _fileName: string,
  ): string {
    return URL.createObjectURL(this.buatPdfSuratDinasKelurahan(s));
  }

  /**
   * Surat dinas dummy yang lebih layak pitch:
   * kop, garis, nomor/lampiran/perihal, Yth., isi, salam + TTD Lurah.
   */
  private buatPdfSuratDinasKelurahan(
    s: Pick<SuratKeluar, 'nomorSurat' | 'perihal' | 'tujuan' | 'tanggalSurat' | 'dibuatOleh' | 'kode'>,
  ): Blob {
    const esc = (t: string) =>
      t
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '?')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

    const wrap = (text: string, max = 78): string[] => {
      const words = text.split(/\s+/).filter(Boolean);
      const out: string[] = [];
      let line = '';
      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        if (next.length > max) {
          if (line) out.push(line);
          line = w;
        } else line = next;
      }
      if (line) out.push(line);
      return out.length ? out : [''];
    };

    const tglId = (() => {
      try {
        return new Date(`${s.tanggalSurat}T12:00:00`).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } catch {
        return s.tanggalSurat;
      }
    })();

    const jenisJudul =
      s.kode === 'UND'
        ? 'SURAT UNDANGAN'
        : s.kode === 'LAP'
          ? 'SURAT PENYAMPAIAN'
          : s.kode === 'KET'
            ? 'SURAT KETERANGAN'
            : 'SURAT DINAS';

    const perihalLines = wrap(s.perihal, 62);
    const tujuanLines = wrap(s.tujuan, 70);
    const body1 = wrap(
      'Dengan hormat, bersama ini kami sampaikan undangan / pemberitahuan resmi dari Kelurahan Rawajati terkait perihal tersebut di atas.',
      88,
    );
    const body2 = wrap(
      'Mohon kehadiran / perhatian Bapak/Ibu pada waktu dan tempat yang telah ditentukan, serta meneruskan informasi ini kepada jajaran terkait di wilayah masing-masing.',
      88,
    );
    const body3 = wrap(
      'Demikian surat ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.',
      88,
    );

    type Cmd =
      | { t: 'text'; x: number; y: number; size: number; bold?: boolean; text: string }
      | { t: 'line'; x1: number; y1: number; x2: number; y2: number; w?: number };

    const cmds: Cmd[] = [];
    // Kop surat
    cmds.push({ t: 'text', x: 297, y: 800, size: 11, bold: true, text: 'PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA' });
    cmds.push({ t: 'text', x: 297, y: 784, size: 11, bold: true, text: 'KOTA ADMINISTRASI JAKARTA SELATAN' });
    cmds.push({ t: 'text', x: 297, y: 768, size: 10, bold: true, text: 'KECAMATAN PANCORAN' });
    cmds.push({ t: 'text', x: 297, y: 748, size: 16, bold: true, text: 'KELURAHAN RAWAJATI' });
    cmds.push({
      t: 'text',
      x: 297,
      y: 730,
      size: 8,
      text: 'Jl. Rawajati Timur No. 1, Pancoran, Jakarta Selatan 12750  Telp. (021) 794XXXX',
    });
    cmds.push({ t: 'line', x1: 50, y1: 720, x2: 545, y2: 720, w: 1.8 });
    cmds.push({ t: 'line', x1: 50, y1: 716, x2: 545, y2: 716, w: 0.6 });

    // Judul
    cmds.push({ t: 'text', x: 297, y: 690, size: 13, bold: true, text: jenisJudul });
    cmds.push({ t: 'text', x: 297, y: 674, size: 10, text: `Nomor: ${s.nomorSurat}` });

    // Identitas surat (kiri)
    let y = 640;
    cmds.push({ t: 'text', x: 55, y, size: 10, text: 'Nomor' });
    cmds.push({ t: 'text', x: 120, y, size: 10, text: `: ${s.nomorSurat}` });
    y -= 16;
    cmds.push({ t: 'text', x: 55, y, size: 10, text: 'Lampiran' });
    cmds.push({ t: 'text', x: 120, y, size: 10, text: ': -' });
    y -= 16;
    cmds.push({ t: 'text', x: 55, y, size: 10, text: 'Perihal' });
    perihalLines.forEach((ln, i) => {
      cmds.push({ t: 'text', x: 120, y: y - i * 14, size: 10, bold: i === 0, text: i === 0 ? `: ${ln}` : `  ${ln}` });
    });
    y -= Math.max(perihalLines.length, 1) * 14 + 18;

    // Tempat/tanggal kanan
    cmds.push({ t: 'text', x: 380, y: 640, size: 10, text: `Jakarta, ${tglId}` });

    // Yth
    cmds.push({ t: 'text', x: 55, y, size: 10, text: 'Kepada Yth.' });
    y -= 14;
    tujuanLines.forEach((ln) => {
      cmds.push({ t: 'text', x: 55, y, size: 10, bold: true, text: ln });
      y -= 14;
    });
    cmds.push({ t: 'text', x: 55, y, size: 10, text: 'di tempat' });
    y -= 22;

    cmds.push({ t: 'text', x: 55, y, size: 10, text: 'Dengan hormat,' });
    y -= 18;
    for (const ln of body1) {
      cmds.push({ t: 'text', x: 55, y, size: 10, text: ln });
      y -= 14;
    }
    y -= 8;
    for (const ln of body2) {
      cmds.push({ t: 'text', x: 55, y, size: 10, text: ln });
      y -= 14;
    }
    y -= 8;
    for (const ln of body3) {
      cmds.push({ t: 'text', x: 55, y, size: 10, text: ln });
      y -= 14;
    }

    y -= 20;
    cmds.push({ t: 'text', x: 360, y, size: 10, text: 'Lurah Rawajati,' });
    y -= 70;
    cmds.push({ t: 'text', x: 360, y, size: 10, bold: true, text: 'Sariman, S.Sos, M.Si' });
    y -= 14;
    cmds.push({ t: 'text', x: 360, y, size: 9, text: 'NIP. 19XXXXXXXX XXXXXX X XXX' });
    y -= 28;
    cmds.push({
      t: 'text',
      x: 55,
      y,
      size: 8,
      text: `Tembusan: Ketua RT wilayah terkait. Dicatat oleh ${s.dibuatOleh} · SI-RAWAJATI (dokumen demo).`,
    });

    // Build content stream with absolute text positioning (centered via approx width)
    const centerX = (text: string, size: number) => {
      // Helvetica approx 0.5 * size * char length
      const w = text.length * size * 0.48;
      return Math.max(50, 297 - w / 2);
    };

    const parts: string[] = [];
    for (const c of cmds) {
      if (c.t === 'line') {
        parts.push(`${c.w ?? 1} w`);
        parts.push(`${c.x1.toFixed(1)} ${c.y1.toFixed(1)} m ${c.x2.toFixed(1)} ${c.y2.toFixed(1)} l S`);
      } else {
        const font = c.bold ? '/F2' : '/F1';
        const x = c.x === 297 ? centerX(c.text, c.size) : c.x;
        parts.push('BT');
        parts.push(`${font} ${c.size} Tf`);
        parts.push(`${x.toFixed(1)} ${c.y.toFixed(1)} Td`);
        parts.push(`(${esc(c.text)}) Tj`);
        parts.push('ET');
      }
    }
    const stream = parts.join('\n');

    const objs: string[] = [];
    objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objs.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objs.push(
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
        '/Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n',
    );
    objs.push(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
    objs.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
    objs.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const o of objs) {
      offsets.push(pdf.length);
      pdf += o;
    }
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objs.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objs.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefStart}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }

  /**
   * PDF demo arsip SK (bukan .txt) — bisa Unduh/Buka di browser.
   * Produksi: diganti scan/PDF asli lewat Master → Edit → Unggah SK.
   */
  private buatUrlSkDemo(input: {
    jenis: 'RW' | 'RT';
    label: string;
    nama: string;
    nomorSk?: string;
    mulai?: string;
    selesai?: string;
    fileName: string;
  }): string {
    const lines = [
      'PEMERINTAH PROVINSI DKI JAKARTA',
      'KELURAHAN RAWAJATI',
      '',
      'SURAT KEPUTUSAN LURAH (ARSIP DEMO)',
      `Nomor: ${input.nomorSk || '-'}`,
      '',
      `Jenis        : Ketua ${input.jenis}`,
      `Wilayah      : ${input.label}`,
      `Nama         : ${input.nama}`,
      `Masa jabatan : ${input.mulai || '-'} s.d. ${input.selesai || '-'}`,
      '',
      'Dokumen demo SI-RAWAJATI.',
      'Ganti dengan PDF/scan SK asli via Master Data > Edit > Unggah SK.',
      `File arsip: ${input.fileName.replace(/\.txt$/i, '.pdf')}`,
    ];
    const blob = this.buatPdfSederhana(lines);
    return URL.createObjectURL(blob);
  }

  /** Minimal PDF 1 halaman (Helvetica) tanpa library eksternal. */
  private buatPdfSederhana(lines: string[]): Blob {
    const esc = (s: string) =>
      s
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '?')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

    const ops: string[] = ['BT', '/F1 12 Tf', '50 800 Td'];
    lines.forEach((line, i) => {
      if (i === 0) {
        ops.push(`(${esc(line)}) Tj`);
      } else {
        ops.push(`0 -18 Td (${esc(line)}) Tj`);
      }
    });
    ops.push('ET');
    const stream = ops.join('\n');

    const objs: string[] = [];
    objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objs.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objs.push(
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
        '/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    );
    objs.push(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
    objs.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const o of objs) {
      offsets.push(pdf.length);
      pdf += o;
    }
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objs.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objs.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefStart}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
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
      `Yth. Bapak/Ibu ${p.nama}${jabatan} — Perwakilan LMK Kelurahan Rawajati,\n\n` +
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
    penerimaJenis?: PenerimaSuratKelurahan[];
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
    const penerimaJenis = input.penerimaJenis?.length ? [...new Set(input.penerimaJenis)] : undefined;
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
      penerimaJenis,
      createdAt: now,
    };
    if (input.file) {
      row.fileName = input.file.name;
      row.fileUrl = URL.createObjectURL(input.file);
    } else if (input.kode === 'UND') {
      const fileName = `Surat-${row.nomorSurat.replace(/\//g, '-')}.pdf`;
      row.fileName = fileName;
      row.fileUrl = this.buatUrlSuratKeluarDemo(row, fileName);
    }
    this.suratKeluars.update((list) => [row, ...list]);
    const siapa = penerimaJenis?.length ? ` · ke ${penerimaJenis.join('/')}` : '';
    this.showToast(`Nomor surat dicatat: ${row.nomorSurat}${siapa}`);
    return row;
  }

  /** Surat yang muncul di inbox portal RW / Ketua RT. */
  suratDariKelurahanUntuk(
    peran: 'RW' | 'RT',
    user?: UserAccount | null,
  ): SuratKeluar[] {
    return this.suratKeluarsSorted().filter((s) => {
      if (s.kode !== 'UND' && !(s.penerimaJenis || []).length) return false;
      const pj = s.penerimaJenis || [];
      if (pj.includes(peran)) return true;
      // fallback seed lama: filter dari teks tujuan/perihal
      if (pj.length) return false;
      const hay = `${s.tujuan} ${s.perihal} ${s.catatan || ''}`.toLowerCase();
      if (peran === 'RW') {
        const nomor = user?.rwId ? this.getRw(user.rwId)?.nomor || '' : '';
        return (
          hay.includes('ketua rw') ||
          hay.includes('se-kelurahan') ||
          (nomor && hay.includes(`rw ${nomor}`))
        );
      }
      return hay.includes('ketua rt') || hay.includes('jajaran rt') || hay.includes('rt 001');
    });
  }

  /** Kirim teks WA sebaran dari kelurahan ke kontak RW / RT / LMK. */
  sebarSuratKelurahanWa(suratId: string, jenis: PenerimaSuratKelurahan): void {
    const s = this.suratKeluars().find((x) => x.id === suratId);
    if (!s) {
      this.showToast('Surat tidak ditemukan.');
      return;
    }
    const teks = encodeURIComponent(
      `Yth. Bapak/Ibu,\n\n` +
        `Surat dari ${this.kelurahan.nama}:\n` +
        `No. ${s.nomorSurat}\n` +
        `Perihal: ${s.perihal}\n` +
        `Tanggal: ${s.tanggalSurat}\n` +
        `Tujuan: ${s.tujuan}\n` +
        (s.fileName ? `File: ${s.fileName}\n` : '') +
        `\nMohon ditindaklanjuti / dihadiri.\n— ${this.kelurahan.nama}`,
    );
    const targets: Array<{ nama: string; telepon?: string }> = [];
    if (jenis === 'RW') {
      for (const rw of this.rws()) targets.push({ nama: rw.namaKetua, telepon: rw.telepon });
    } else if (jenis === 'RT') {
      for (const rt of this.rts()) targets.push({ nama: rt.namaKetua, telepon: rt.telepon });
    } else {
      for (const l of this.anggotaLmks()) targets.push({ nama: l.nama, telepon: l.telepon });
    }
    let dibuka = 0;
    for (const t of targets) {
      const digits = (t.telepon || '').replace(/\D/g, '').replace(/^0/, '62');
      if (!digits) continue;
      window.open(`https://wa.me/${digits}?text=${teks}`, '_blank', 'noopener');
      dibuka += 1;
      if (dibuka >= 4) break;
    }
    this.showToast(
      dibuka
        ? `Sebaran WA ke ${jenis}: ${dibuka} kontak dibuka (demo).`
        : `Belum ada nomor WA untuk ${jenis}.`,
    );
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

  // ─── Perintah Lurah / tindak lanjut ─────────────────────────────────────

  perintahLurahsSorted = computed(() =>
    [...this.perintahLurahs()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );

  perintahAktifCount = computed(
    () =>
      this.perintahLurahs().filter(
        (p) => p.status === 'BARU' || p.status === 'DITERIMA' || p.status === 'DIKERJAKAN',
      ).length,
  );

  /** SLA perintah: tepat waktu vs terlambat (demo lokal). */
  slaPerintah = computed(() => {
    const today = this.ymdLocal(new Date());
    const list = this.perintahLurahs();
    const aktif = list.filter(
      (p) => p.status === 'BARU' || p.status === 'DITERIMA' || p.status === 'DIKERJAKAN',
    );
    const selesai = list.filter((p) => p.status === 'SELESAI');
    const dibatalkan = list.filter((p) => p.status === 'DIBATALKAN').length;
    const terlambatAktif = aktif.filter((p) => p.tenggatAt < today);
    const selesaiTepatWaktu = selesai.filter((p) => {
      const done = (p.selesaiAt ?? p.updatedAt).slice(0, 10);
      return done <= p.tenggatAt;
    });
    const selesaiTerlambat = selesai.length - selesaiTepatWaktu.length;
    const pctTepat =
      selesai.length === 0 ? null : Math.round((selesaiTepatWaktu.length / selesai.length) * 100);

    const byPenerima = new Map<
      string,
      { label: string; aktif: number; terlambat: number; selesai: number }
    >();
    for (const p of list) {
      const key = p.penerimaLabel;
      const row = byPenerima.get(key) ?? { label: key, aktif: 0, terlambat: 0, selesai: 0 };
      if (p.status === 'SELESAI') row.selesai += 1;
      else if (p.status !== 'DIBATALKAN') {
        row.aktif += 1;
        if (p.tenggatAt < today) row.terlambat += 1;
      }
      byPenerima.set(key, row);
    }

    return {
      total: list.length,
      aktif: aktif.length,
      terlambatAktif: terlambatAktif.length,
      urgentAktif: aktif.filter((p) => p.prioritas === 'URGENT').length,
      selesai: selesai.length,
      selesaiTepatWaktu: selesaiTepatWaktu.length,
      selesaiTerlambat,
      dibatalkan,
      pctTepatWaktu: pctTepat,
      terlambatList: [...terlambatAktif].sort((a, b) => a.tenggatAt.localeCompare(b.tenggatAt)),
      byPenerima: [...byPenerima.values()].sort(
        (a, b) => b.terlambat - a.terlambat || b.aktif - a.aktif,
      ),
    };
  });

  /**
   * Radar mingguan Lurah — ringkas lintas modul untuk baca 2 menit.
   */
  radarMingguan = computed(() => {
    const today = this.ymdLocal(new Date());
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndYmd = this.ymdLocal(weekEnd);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartMs = weekStart.getTime();

    const abj = this.hitungAbj();
    const kesra = this.ringkasKesraMingguIni();
    const sla = this.slaPerintah();
    const kalenderMinggu = this.kalenderOperasional(7).filter(
      (i) => i.tanggal >= today && i.tanggal <= weekEndYmd,
    );
    const ppsuMinggu = this.laporanKerjaPpsus().filter(
      (l) => new Date(l.createdAt).getTime() >= weekStartMs,
    );
    const now = new Date();
    const tahun = now.getFullYear();
    const bulan = now.getMonth() + 1;
    const totalPmi = this.setoranSosials()
      .filter((s) => s.jenis === 'PMI' && s.periodeTahun === tahun && s.periodeBulan === bulan)
      .reduce((sum, s) => sum + s.nominal, 0);
    const mapRow = this.rekapMapPmis().find((r) => r.tahun === tahun && r.bulan === bulan);
    const mapPmi = mapRow?.totalUangMap ?? 0;
    const selisihPmi = mapPmi - totalPmi;

    type AlertItem = {
      id: string;
      level: 'KRITIS' | 'WASPADA' | 'INFO';
      title: string;
      meta: string;
      link: string;
    };
    const alerts: AlertItem[] = [];

    if (abj.status === 'ZONA_MERAH' || this.zonaMerahCount() > 0) {
      alerts.push({
        id: 'abj',
        level: 'KRITIS',
        title: `ABJ kelurahan ${abj.abj}% · ${this.zonaMerahCount()} RT zona merah`,
        meta: `Positif jentik 7 hari: ${kesra.positif} bangunan`,
        link: '/app/psn',
      });
    }
    if (sla.terlambatAktif > 0) {
      alerts.push({
        id: 'sla',
        level: 'KRITIS',
        title: `${sla.terlambatAktif} perintah lewat tenggat`,
        meta: `${sla.urgentAktif} urgent masih aktif`,
        link: '/app/perintah',
      });
    }
    const pengaduanOpen = this.pengaduans().filter(
      (p) => p.status === 'BARU' || p.status === 'DIDISPOSISI' || p.status === 'DIPROSES',
    );
    const pengaduanBaru = pengaduanOpen.filter((p) => p.status === 'BARU');
    if (pengaduanBaru.length > 0) {
      alerts.push({
        id: 'pengaduan',
        level: 'KRITIS',
        title: `${pengaduanBaru.length} pengaduan belum didisposisi`,
        meta: `${pengaduanOpen.length} masih terbuka · perlu arahan Lurah/Kasi`,
        link: '/app/pengaduan',
      });
    } else if (pengaduanOpen.length > 0) {
      alerts.push({
        id: 'pengaduan',
        level: 'WASPADA',
        title: `${pengaduanOpen.length} pengaduan masih diproses`,
        meta: 'Pantau disposisi hingga selesai',
        link: '/app/pengaduan',
      });
    }
    const suratMasukBaru = this.suratMasuks().filter((s) => s.status === 'BARU');
    const suratMasukOpen = this.suratMasuks().filter(
      (s) => s.status === 'BARU' || s.status === 'DIDISPOSISI' || s.status === 'DIPROSES',
    );
    if (suratMasukBaru.length > 0) {
      alerts.push({
        id: 'surat-masuk',
        level: 'KRITIS',
        title: `${suratMasukBaru.length} surat masuk belum didisposisi`,
        meta: `${suratMasukOpen.length} masih terbuka`,
        link: '/app/surat-masuk',
      });
    }
    const jabatanHabis = this.wilayahJabatanAlert().filter((w) => w.status === 'HABIS');
    const jabatanHampir = this.wilayahJabatanAlert().filter((w) => w.status === 'HAMPIR_HABIS');
    if (jabatanHabis.length > 0) {
      alerts.push({
        id: 'jabatan-habis',
        level: 'KRITIS',
        title: `${jabatanHabis.length} Ketua RT/RW habis masa jabatan`,
        meta: 'Cek SK & perpanjangan di Master Data',
        link: '/app/master',
      });
    } else if (jabatanHampir.length > 0) {
      alerts.push({
        id: 'jabatan-hampir',
        level: 'WASPADA',
        title: `${jabatanHampir.length} masa jabatan hampir habis`,
        meta: 'Siapkan proses SK / pergantian',
        link: '/app/master',
      });
    }
    const eventAktif = this.eventBesars().filter(
      (e) => e.status === 'PERSIAPAN' || e.status === 'BERLANGSUNG',
    );
    const checklistTodo = eventAktif.reduce(
      (n, e) => n + e.checklist.filter((c) => c.status !== 'DONE').length,
      0,
    );
    if (checklistTodo > 0) {
      alerts.push({
        id: 'event',
        level: 'INFO',
        title: `${checklistTodo} tugas event belum selesai`,
        meta: `${eventAktif.length} event aktif`,
        link: '/app/event-besar',
      });
    }
    if (this.daopBelumSetorCount() > 0) {
      alerts.push({
        id: 'daop',
        level: 'WASPADA',
        title: `${this.daopBelumSetorCount()} laporan DAOP belum setor`,
        meta: `Sudah upload TTD: ${this.daopSudahUploadCount()}`,
        link: '/app/daop',
      });
    }
    if (this.alatDipinjamCount() > 0) {
      alerts.push({
        id: 'alat',
        level: 'WASPADA',
        title: `${this.alatDipinjamCount()} alat PPSU masih dipinjam`,
        meta: 'Cek pengembalian di pantauan Ekbang',
        link: '/app/ekbang',
      });
    }
    if (selisihPmi !== 0 && mapRow) {
      alerts.push({
        id: 'pmi',
        level: 'WASPADA',
        title: 'Map PMI belum klop dengan catatan',
        meta: `Selisih ${this.formatRp(selisihPmi)}`,
        link: '/app/setoran-pmi-baznas',
      });
    }
    if (kalenderMinggu.length > 0) {
      alerts.push({
        id: 'kal',
        level: 'INFO',
        title: `${kalenderMinggu.length} kegiatan / tenggat 7 hari ke depan`,
        meta: 'Lihat kalender operasional',
        link: '/app/kalender',
      });
    }

    return {
      periodeLabel: `${this.formatTanggalId(new Date())} · pantauan 7 hari`,
      abj,
      zonaMerah: this.zonaMerahCount(),
      kesra,
      daopBelum: this.daopBelumSetorCount(),
      daopSudah: this.daopSudahUploadCount(),
      ppsuMinggu: ppsuMinggu.length,
      alatDipinjam: this.alatDipinjamCount(),
      saluranJadwal: this.saluranJadwalCount(),
      kalenderMinggu: kalenderMinggu.length,
      sla,
      pengaduan: {
        terbuka: pengaduanOpen.length,
        baru: pengaduanBaru.length,
        selesai: this.pengaduans().filter((p) => p.status === 'SELESAI').length,
      },
      pmi: { totalCatatan: totalPmi, map: mapPmi, selisih: selisihPmi, klop: selisihPmi === 0 },
      alerts,
      agendaPreview: kalenderMinggu.slice(0, 6),
    };
  });

  // ─── Pengaduan RW → disposisi ───────────────────────────────────────────

  pengaduansSorted = computed(() =>
    [...this.pengaduans()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );

  pengaduanTerbukaCount = computed(
    () =>
      this.pengaduans().filter(
        (p) => p.status === 'BARU' || p.status === 'DIDISPOSISI' || p.status === 'DIPROSES',
      ).length,
  );

  labelStatusPengaduan(s: StatusPengaduan): string {
    const map: Record<StatusPengaduan, string> = {
      BARU: 'Baru',
      DIDISPOSISI: 'Didisposisi',
      DIPROSES: 'Diproses',
      SELESAI: 'Selesai',
      DITOLAK: 'Ditolak',
    };
    return map[s];
  }

  labelKategoriPengaduan(k: KategoriPengaduan): string {
    const map: Record<KategoriPengaduan, string> = {
      SALURAN: 'Saluran / genangan',
      KEBERSIHAN: 'Kebersihan',
      PENERANGAN: 'Penerangan / PJU',
      KEAMANAN: 'Keamanan',
      ADMINISTRASI: 'Administrasi',
      LAIN: 'Lainnya',
    };
    return map[k];
  }

  pengaduanUntukUser(user: UserAccount | null | undefined): PengaduanWilayah[] {
    if (!user) return [];
    const all = this.pengaduansSorted();
    if (user.role === 'ADMIN_KEL') return all;
    if (user.role === 'KOORD_RW') {
      return all.filter(
        (p) =>
          p.rwId === user.rwId ||
          (p.disposisiJenis === 'RW' && p.disposisiRwId === user.rwId),
      );
    }
    if (user.role === 'PETUGAS_PPSU') {
      return all.filter((p) => p.disposisiJenis === 'PPSU' && p.disposisiUserId === user.id);
    }
    return [];
  }

  addPengaduan(input: {
    judul: string;
    isi: string;
    kategori: KategoriPengaduan;
    prioritas: PrioritasPengaduan;
    lokasi?: string;
    rwId: string;
    rtId?: string;
    pelaporNama: string;
    pelaporUserId?: string;
  }): PengaduanWilayah | null {
    const judul = input.judul.trim();
    const isi = input.isi.trim();
    if (!judul || !isi || !input.rwId) {
      this.showToast('Lengkapi judul, isi, dan RW.');
      return null;
    }
    const now = new Date().toISOString().slice(0, 19);
    const row: PengaduanWilayah = {
      id: `pg-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      judul,
      isi,
      kategori: input.kategori,
      prioritas: input.prioritas,
      status: 'BARU',
      lokasi: input.lokasi?.trim() || undefined,
      rwId: input.rwId,
      rtId: input.rtId || undefined,
      pelaporNama: input.pelaporNama,
      pelaporUserId: input.pelaporUserId,
      createdAt: now,
      updatedAt: now,
    };
    this.pengaduans.update((list) => [row, ...list]);
    this.showToast('Pengaduan tercatat — menunggu disposisi kelurahan.');
    return row;
  }

  disposisiPengaduan(
    id: string,
    penerimaKey: string,
    catatan?: string,
  ): void {
    const opt = this.opsiPenerimaPerintah().find((o) => o.key === penerimaKey);
    if (!opt) {
      this.showToast('Pilih penerima disposisi.');
      return;
    }
    const now = new Date().toISOString().slice(0, 19);
    this.pengaduans.update((list) =>
      list.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'DIDISPOSISI' as const,
              disposisiJenis: opt.jenis,
              disposisiUserId: opt.userId,
              disposisiRwId: opt.rwId,
              disposisiLabel: opt.label,
              catatanDisposisi: catatan?.trim() || undefined,
              didisposisiAt: now,
              updatedAt: now,
            }
          : p,
      ),
    );
    this.showToast(`Didisposisi ke ${opt.label}.`);
  }

  updateStatusPengaduan(
    id: string,
    status: StatusPengaduan,
    catatanSelesai?: string,
  ): void {
    const now = new Date().toISOString().slice(0, 19);
    this.pengaduans.update((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        const next: PengaduanWilayah = {
          ...p,
          status,
          updatedAt: now,
          catatanSelesai:
            catatanSelesai !== undefined
              ? catatanSelesai.trim() || undefined
              : p.catatanSelesai,
        };
        if (status === 'DIPROSES') next.diprosesAt = now;
        if (status === 'SELESAI' || status === 'DITOLAK') next.selesaiAt = now;
        return next;
      }),
    );
    this.showToast(`Status pengaduan → ${this.labelStatusPengaduan(status)}.`);
  }

  labelStatusPerintah(s: StatusPerintahLurah): string {
    const map: Record<StatusPerintahLurah, string> = {
      BARU: 'Baru',
      DITERIMA: 'Diterima',
      DIKERJAKAN: 'Dikerjakan',
      SELESAI: 'Selesai',
      DIBATALKAN: 'Dibatalkan',
    };
    return map[s];
  }

  labelPrioritasPerintah(p: PrioritasPerintah): string {
    return p === 'URGENT' ? 'Urgent' : 'Normal';
  }

  /** Opsi penerima untuk form buat perintah. */
  opsiPenerimaPerintah(): Array<{
    key: string;
    jenis: JenisPenerimaPerintah;
    userId?: string;
    rwId?: string;
    label: string;
  }> {
    const staf = this.users()
      .filter((u) => u.role === 'ADMIN_KEL' && u.id !== 'u-admin')
      .map((u) => ({
        key: `STAF:${u.id}`,
        jenis: 'STAF' as const,
        userId: u.id,
        label: `${u.name} · ${u.jabatan}`,
      }));
    const rw = this.rws().map((r) => ({
      key: `RW:${r.id}`,
      jenis: 'RW' as const,
      rwId: r.id,
      label: `Ketua ${this.labelRw(r.nomor)} · ${r.namaKetua}`,
    }));
    const ppsu = this.users()
      .filter((u) => u.role === 'PETUGAS_PPSU')
      .map((u) => ({
        key: `PPSU:${u.id}`,
        jenis: 'PPSU' as const,
        userId: u.id,
        label: `${u.name} · ${u.jabatan}`,
      }));
    return [...staf, ...rw, ...ppsu];
  }

  perintahUntukUser(user: UserAccount | null | undefined): PerintahLurah[] {
    if (!user) return [];
    const all = this.perintahLurahsSorted();
    if (user.role === 'ADMIN_KEL') {
      // Lurah & staf: lihat semua + yang ditugaskan ke mereka
      return all;
    }
    if (user.role === 'KOORD_RW') {
      return all.filter((p) => p.penerimaJenis === 'RW' && p.penerimaRwId === user.rwId);
    }
    if (user.role === 'PETUGAS_PPSU') {
      return all.filter((p) => p.penerimaJenis === 'PPSU' && p.penerimaUserId === user.id);
    }
    return [];
  }

  perintahInboxCount(user: UserAccount | null | undefined): number {
    return this.perintahUntukUser(user).filter(
      (p) =>
        (p.status === 'BARU' || p.status === 'DITERIMA' || p.status === 'DIKERJAKAN') &&
        (user?.role === 'ADMIN_KEL'
          ? p.penerimaJenis === 'STAF' && p.penerimaUserId === user.id
          : true),
    ).length;
  }

  addPerintahLurah(input: {
    judul: string;
    isi: string;
    prioritas: PrioritasPerintah;
    tenggatAt: string;
    penerimaKey: string;
    dibuatOlehUserId: string;
    dibuatOlehNama: string;
  }): PerintahLurah | null {
    const judul = input.judul.trim();
    const isi = input.isi.trim();
    if (!judul || !isi || !input.penerimaKey || !input.tenggatAt) {
      this.showToast('Lengkapi judul, isi, penerima, dan tenggat.');
      return null;
    }
    const opt = this.opsiPenerimaPerintah().find((o) => o.key === input.penerimaKey);
    if (!opt) {
      this.showToast('Penerima tidak valid.');
      return null;
    }
    const now = new Date().toISOString().slice(0, 19);
    const row: PerintahLurah = {
      id: `pr-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      judul,
      isi,
      prioritas: input.prioritas,
      status: 'BARU',
      tenggatAt: input.tenggatAt,
      dibuatOlehUserId: input.dibuatOlehUserId,
      dibuatOlehNama: input.dibuatOlehNama,
      penerimaJenis: opt.jenis,
      penerimaUserId: opt.userId,
      penerimaRwId: opt.rwId,
      penerimaLabel: opt.label,
      createdAt: now,
      updatedAt: now,
    };
    this.perintahLurahs.update((list) => [row, ...list]);
    this.showToast(`Perintah dikirim ke ${opt.label}.`);
    return row;
  }

  updateStatusPerintah(
    id: string,
    status: StatusPerintahLurah,
    catatan?: string,
  ): void {
    const now = new Date().toISOString().slice(0, 19);
    this.perintahLurahs.update((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        const next: PerintahLurah = {
          ...p,
          status,
          updatedAt: now,
          catatanTindakLanjut:
            catatan !== undefined ? catatan.trim() || undefined : p.catatanTindakLanjut,
        };
        if (status === 'DITERIMA') next.diterimaAt = now;
        if (status === 'DIKERJAKAN') next.dikerjakanAt = now;
        if (status === 'SELESAI') next.selesaiAt = now;
        return next;
      }),
    );
    this.showToast(`Status perintah → ${this.labelStatusPerintah(status)}.`);
  }

  // ─── Kalender Operasional (gabungan) ────────────────────────────────────

  private ymdLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /** Jumat PSN mendatang (4 minggu) — recurring operasional. */
  private jumatPsnMendatang(from = new Date(), count = 4): string[] {
    const out: string[] = [];
    const d = new Date(from);
    d.setHours(12, 0, 0, 0);
    // maju ke Jumat (5)
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
    for (let i = 0; i < count; i++) {
      out.push(this.ymdLocal(d));
      d.setDate(d.getDate() + 7);
    }
    return out;
  }

  /**
   * Satu layar: agenda + kerja bakti + saluran PPSU + Jumat PSN + undangan + tenggat perintah.
   */
  kalenderOperasional(hariSpan = 21): KalenderOpsItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + hariSpan);
    const inRange = (ymd: string) => {
      const t = new Date(`${ymd}T12:00:00`);
      return t >= today && t <= end;
    };

    const items: KalenderOpsItem[] = [];

    for (const a of this.agendaRapats()) {
      if (!inRange(a.tanggal)) continue;
      if (a.status === 'DIBATALKAN') continue;
      items.push({
        id: `agenda-${a.id}`,
        jenis: 'AGENDA',
        tanggal: a.tanggal,
        jam: a.jamMulai,
        judul: a.judul,
        meta: `${a.jenisKegiatan ?? 'RAPAT'} · ${a.tempat}`,
        link: '/app/agenda',
        statusLabel: a.status,
      });
    }

    for (const k of this.kerjaBaktiRws()) {
      if (!inRange(k.tanggal)) continue;
      const rw = this.getRw(k.rwId);
      items.push({
        id: `kb-${k.id}`,
        jenis: 'KERJA_BAKTI',
        tanggal: k.tanggal,
        judul: `Kerja bakti ${rw ? this.labelRw(rw.nomor) : 'RW'}`,
        meta: `${k.lokasi} · PIC ${k.picNama}`,
        link: '/app/agenda',
        statusLabel: k.status,
      });
    }

    for (const s of this.kegiatanSalurans()) {
      if (!inRange(s.tanggalRencana)) continue;
      items.push({
        id: `sal-${s.id}`,
        jenis: 'PPSU_SALURAN',
        tanggal: s.tanggalRencana,
        judul: s.namaLokasi,
        meta: `${s.ruasSaluran} · ${s.petugas}`,
        link: '/app/ekbang',
        statusLabel: s.statusKegiatan,
      });
    }

    for (const ymd of this.jumatPsnMendatang(today, 4)) {
      if (!inRange(ymd)) continue;
      items.push({
        id: `psn-jumat-${ymd}`,
        jenis: 'PSN_JUMAT',
        tanggal: ymd,
        jam: '07:00',
        judul: 'Jumat PSN Jumantik',
        meta: 'Pemeriksaan jentik rutin tingkat RT',
        link: '/app/psn',
        statusLabel: 'RUTIN',
      });
    }

    const und = this.undanganPsnDraft();
    // Ambil tanggal dari string "Jumat, 21 November 2026" bila bisa; fallback tetap tampilkan meta
    const undMatch = und.hariTanggal.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (undMatch) {
      const bulanMap: Record<string, number> = {
        januari: 0,
        februari: 1,
        maret: 2,
        april: 3,
        mei: 4,
        juni: 5,
        juli: 6,
        agustus: 7,
        september: 8,
        oktober: 9,
        november: 10,
        desember: 11,
      };
      const bl = bulanMap[undMatch[2].toLowerCase()];
      if (bl != null) {
        const d = new Date(Number(undMatch[3]), bl, Number(undMatch[1]));
        const ymd = this.ymdLocal(d);
        if (inRange(ymd)) {
          items.push({
            id: 'undangan-psn-draft',
            jenis: 'UNDANGAN_PSN',
            tanggal: ymd,
            jam: und.jam.replace(/[^\d:]/g, '').slice(0, 5) || undefined,
            judul: 'Undangan evaluasi PSN',
            meta: `${und.tempat} · ${und.nomorSurat}`,
            link: '/app/psn/undangan-cetak',
            statusLabel: 'UNDANGAN',
          });
        }
      }
    }

    for (const p of this.perintahLurahs()) {
      if (!inRange(p.tenggatAt)) continue;
      if (p.status === 'SELESAI' || p.status === 'DIBATALKAN') continue;
      items.push({
        id: `pr-cal-${p.id}`,
        jenis: 'PERINTAH',
        tanggal: p.tenggatAt,
        judul: `Tenggat: ${p.judul}`,
        meta: `${p.penerimaLabel} · ${this.labelStatusPerintah(p.status)}`,
        link: '/app/perintah',
        statusLabel: p.prioritas,
      });
    }

    return items.sort((a, b) => {
      const ta = `${a.tanggal}T${a.jam ?? '99:99'}`;
      const tb = `${b.tanggal}T${b.jam ?? '99:99'}`;
      return ta.localeCompare(tb);
    });
  }

  labelJenisKalender(j: JenisKalenderOps): string {
    const map: Record<JenisKalenderOps, string> = {
      AGENDA: 'Agenda',
      KERJA_BAKTI: 'Kerja bakti',
      PPSU_SALURAN: 'PPSU saluran',
      PSN_JUMAT: 'PSN Jumat',
      UNDANGAN_PSN: 'Undangan PSN',
      PERINTAH: 'Tenggat perintah',
    };
    return map[j];
  }

  // ─── Surat masuk + disposisi ────────────────────────────────────────────

  suratMasuksSorted = computed(() =>
    [...this.suratMasuks()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );

  suratMasukTerbukaCount = computed(
    () =>
      this.suratMasuks().filter(
        (s) => s.status === 'BARU' || s.status === 'DIDISPOSISI' || s.status === 'DIPROSES',
      ).length,
  );

  labelStatusSuratMasuk(s: StatusSuratMasuk): string {
    const map: Record<StatusSuratMasuk, string> = {
      BARU: 'Baru',
      DIDISPOSISI: 'Didisposisi',
      DIPROSES: 'Diproses',
      SELESAI: 'Selesai',
      DIARSIPKAN: 'Diarsipkan',
    };
    return map[s];
  }

  private nextNomorAgendaSuratMasuk(): string {
    const now = new Date();
    const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const y = now.getFullYear();
    const m = bulanRomawi[now.getMonth()];
    const count = this.suratMasuks().filter((s) => s.nomorAgenda.includes(`/${y}`)).length + 1;
    return `${String(count).padStart(3, '0')}/SM/${m}/${y}`;
  }

  opsiStafDisposisi(): Array<{ userId: string; label: string }> {
    return this.users()
      .filter((u) => u.role === 'ADMIN_KEL')
      .map((u) => ({ userId: u.id, label: `${u.name} · ${u.jabatan}` }));
  }

  addSuratMasuk(input: {
    nomorSuratAsal?: string;
    asal: string;
    perihal: string;
    tanggalSurat: string;
    tanggalTerima: string;
    ringkasan?: string;
    dicatatOleh: string;
  }): SuratMasuk | null {
    if (!input.asal.trim() || !input.perihal.trim() || !input.tanggalTerima) {
      this.showToast('Lengkapi asal, perihal, dan tanggal terima.');
      return null;
    }
    const now = new Date().toISOString().slice(0, 19);
    const row: SuratMasuk = {
      id: `sm-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      nomorAgenda: this.nextNomorAgendaSuratMasuk(),
      nomorSuratAsal: input.nomorSuratAsal?.trim() || undefined,
      asal: input.asal.trim(),
      perihal: input.perihal.trim(),
      tanggalSurat: input.tanggalSurat || input.tanggalTerima,
      tanggalTerima: input.tanggalTerima,
      status: 'BARU',
      ringkasan: input.ringkasan?.trim() || undefined,
      dicatatOleh: input.dicatatOleh,
      createdAt: now,
      updatedAt: now,
    };
    this.suratMasuks.update((list) => [row, ...list]);
    this.showToast(`Surat masuk dicatat · ${row.nomorAgenda}`);
    return row;
  }

  disposisiSuratMasuk(id: string, userId: string, catatan?: string): void {
    const staf = this.opsiStafDisposisi().find((s) => s.userId === userId);
    if (!staf) {
      this.showToast('Pilih staf disposisi.');
      return;
    }
    const now = new Date().toISOString().slice(0, 19);
    this.suratMasuks.update((list) =>
      list.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'DIDISPOSISI' as const,
              disposisiUserId: staf.userId,
              disposisiLabel: staf.label,
              catatanDisposisi: catatan?.trim() || undefined,
              didisposisiAt: now,
              updatedAt: now,
            }
          : s,
      ),
    );
    this.showToast(`Didisposisi ke ${staf.label}.`);
  }

  updateStatusSuratMasuk(id: string, status: StatusSuratMasuk, catatanSelesai?: string): void {
    const now = new Date().toISOString().slice(0, 19);
    this.suratMasuks.update((list) =>
      list.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status,
          updatedAt: now,
          catatanSelesai:
            catatanSelesai !== undefined ? catatanSelesai.trim() || undefined : s.catatanSelesai,
          selesaiAt: status === 'SELESAI' || status === 'DIARSIPKAN' ? now : s.selesaiAt,
        };
      }),
    );
    this.showToast(`Status surat → ${this.labelStatusSuratMasuk(status)}.`);
  }

  // ─── Tamu dinas / kunjungan ─────────────────────────────────────────────

  tamuDinasSorted = computed(() =>
    [...this.tamuDinas()].sort((a, b) => {
      const ta = `${a.tanggal}T${a.jamDatang}`;
      const tb = `${b.tanggal}T${b.jamDatang}`;
      return tb.localeCompare(ta);
    }),
  );

  tamuDinasHariIniCount = computed(() => {
    const today = this.ymdLocal(new Date());
    return this.tamuDinas().filter((t) => t.tanggal === today).length;
  });

  labelTujuanKunjungan(t: TujuanKunjungan): string {
    const map: Record<TujuanKunjungan, string> = {
      KOORDINASI: 'Koordinasi',
      MONITORING: 'Monitoring',
      SOSIALISASI: 'Sosialisasi',
      LAYANAN: 'Layanan',
      LAIN: 'Lainnya',
    };
    return map[t];
  }

  addTamuDinas(input: {
    namaTamu: string;
    instansi: string;
    jabatan?: string;
    tujuan: TujuanKunjungan;
    keperluan: string;
    tanggal: string;
    jamDatang: string;
    jamPulang?: string;
    didampingiOleh: string;
    didampingiUserId?: string;
    catatan?: string;
    dicatatOleh: string;
  }): TamuDinas | null {
    if (!input.namaTamu.trim() || !input.instansi.trim() || !input.keperluan.trim()) {
      this.showToast('Lengkapi nama tamu, instansi, dan keperluan.');
      return null;
    }
    const row: TamuDinas = {
      id: `td-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      namaTamu: input.namaTamu.trim(),
      instansi: input.instansi.trim(),
      jabatan: input.jabatan?.trim() || undefined,
      tujuan: input.tujuan,
      keperluan: input.keperluan.trim(),
      tanggal: input.tanggal,
      jamDatang: input.jamDatang,
      jamPulang: input.jamPulang || undefined,
      didampingiOleh: input.didampingiOleh.trim(),
      didampingiUserId: input.didampingiUserId,
      catatan: input.catatan?.trim() || undefined,
      dicatatOleh: input.dicatatOleh,
      createdAt: new Date().toISOString().slice(0, 19),
    };
    this.tamuDinas.update((list) => [row, ...list]);
    this.showToast(`Tamu ${row.namaTamu} dicatat.`);
    return row;
  }

  // ─── Event besar + checklist ────────────────────────────────────────────

  eventBesarsSorted = computed(() =>
    [...this.eventBesars()].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
  );

  labelStatusEvent(s: StatusEventBesar): string {
    const map: Record<StatusEventBesar, string> = {
      PERSIAPAN: 'Persiapan',
      BERLANGSUNG: 'Berlangsung',
      SELESAI: 'Selesai',
      DIBATALKAN: 'Dibatalkan',
    };
    return map[s];
  }

  labelStatusChecklist(s: StatusChecklistItem): string {
    const map: Record<StatusChecklistItem, string> = {
      TODO: 'Belum',
      PROGRESS: 'Proses',
      DONE: 'Selesai',
    };
    return map[s];
  }

  addEventBesar(input: {
    nama: string;
    tanggal: string;
    lokasi: string;
    deskripsi?: string;
    dibuatOleh: string;
  }): EventBesar | null {
    if (!input.nama.trim() || !input.tanggal || !input.lokasi.trim()) {
      this.showToast('Lengkapi nama, tanggal, dan lokasi event.');
      return null;
    }
    const now = new Date().toISOString().slice(0, 19);
    const row: EventBesar = {
      id: `ev-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      nama: input.nama.trim(),
      tanggal: input.tanggal,
      lokasi: input.lokasi.trim(),
      status: 'PERSIAPAN',
      deskripsi: input.deskripsi?.trim() || undefined,
      checklist: [],
      dibuatOleh: input.dibuatOleh,
      createdAt: now,
      updatedAt: now,
    };
    this.eventBesars.update((list) => [row, ...list]);
    this.showToast('Event dicatat — tambahkan checklist tugas.');
    return row;
  }

  addChecklistItem(
    eventId: string,
    input: { judul: string; picNama: string; picUserId?: string; tenggatAt?: string },
  ): void {
    if (!input.judul.trim() || !input.picNama.trim()) {
      this.showToast('Isi tugas dan PIC.');
      return;
    }
    const item: ChecklistEventItem = {
      id: `ci-${Date.now()}`,
      judul: input.judul.trim(),
      picNama: input.picNama.trim(),
      picUserId: input.picUserId,
      status: 'TODO',
      tenggatAt: input.tenggatAt || undefined,
    };
    const now = new Date().toISOString().slice(0, 19);
    this.eventBesars.update((list) =>
      list.map((e) =>
        e.id === eventId ? { ...e, checklist: [...e.checklist, item], updatedAt: now } : e,
      ),
    );
    this.showToast('Tugas checklist ditambahkan.');
  }

  updateChecklistStatus(eventId: string, itemId: string, status: StatusChecklistItem): void {
    const now = new Date().toISOString().slice(0, 19);
    this.eventBesars.update((list) =>
      list.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          updatedAt: now,
          checklist: e.checklist.map((c) =>
            c.id === itemId
              ? { ...c, status, selesaiAt: status === 'DONE' ? now : c.selesaiAt }
              : c,
          ),
        };
      }),
    );
  }

  updateStatusEvent(eventId: string, status: StatusEventBesar): void {
    const now = new Date().toISOString().slice(0, 19);
    this.eventBesars.update((list) =>
      list.map((e) => (e.id === eventId ? { ...e, status, updatedAt: now } : e)),
    );
    this.showToast(`Status event → ${this.labelStatusEvent(status)}.`);
  }

  // ─── Anggota LMK (1 lembaga · 1 orang per RW) ────────────────────────────

  anggotaLmksSorted = computed(() =>
    [...this.anggotaLmks()].sort((a, b) => {
      const ra = this.getRw(a.rwId)?.nomor ?? '';
      const rb = this.getRw(b.rwId)?.nomor ?? '';
      return ra.localeCompare(rb);
    }),
  );

  labelAnggotaLmk(a: AnggotaLmk): string {
    const rw = this.getRw(a.rwId);
    return `${a.nama} · Perwakilan LMK ${rw ? this.labelRw(rw.nomor) : 'RW'}`;
  }

  getAnggotaLmkByRw(rwId: string): AnggotaLmk | undefined {
    return this.anggotaLmks().find((a) => a.rwId === rwId && a.isActive);
  }

  addAnggotaLmk(input: {
    rwId: string;
    nama: string;
    telepon?: string;
    nomorSk?: string;
    catatan?: string;
  }): AnggotaLmk | null {
    const nama = input.nama.trim();
    const rw = this.getRw(input.rwId);
    if (!rw || !nama) {
      this.showToast('Pilih RW dan isi nama perwakilan LMK.');
      return null;
    }
    if (this.anggotaLmks().some((a) => a.rwId === rw.id && a.isActive)) {
      this.showToast(`${this.labelRw(rw.nomor)} sudah punya perwakilan LMK aktif.`);
      return null;
    }
    const row: AnggotaLmk = {
      id: `lmk-${rw.id}-${Date.now()}`,
      kelurahanId: this.kelurahan.id,
      rwId: rw.id,
      nama,
      telepon: input.telepon?.trim() || undefined,
      nomorSk: input.nomorSk?.trim() || undefined,
      catatan: input.catatan?.trim() || undefined,
      isActive: true,
    };
    this.anggotaLmks.update((list) => [row, ...list]);
    this.showToast(`Anggota LMK ${this.labelRw(rw.nomor)} dicatat.`);
    return row;
  }

  updateAnggotaLmk(
    id: string,
    patch: Partial<Pick<AnggotaLmk, 'nama' | 'telepon' | 'nomorSk' | 'catatan' | 'isActive' | 'rwId'>>,
  ): void {
    if (patch.rwId) {
      const clash = this.anggotaLmks().some(
        (a) => a.id !== id && a.rwId === patch.rwId && a.isActive,
      );
      if (clash) {
        this.showToast('RW itu sudah punya perwakilan LMK aktif.');
        return;
      }
    }
    this.anggotaLmks.update((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    this.showToast('Data anggota LMK diperbarui.');
  }
}
