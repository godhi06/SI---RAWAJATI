export type UserRole = 'ADMIN_KEL' | 'KOORD_RW' | 'OP_RT' | 'PETUGAS_PPSU';

export type JenisKerjaPpsu = 'KURAS_SALURAN' | 'SAPU_JALAN' | 'BABAT_RUMPUT';

/** Ploting rutin harian vs bantuan urgensi dari RW */
export type KategoriTugasPpsu = 'PLOTING_RUTIN' | 'URGENSI_RW';

export type PrioritasUrgensiPpsu = 'NORMAL' | 'DARURAT';

export type StatusPinjamAlat = 'TERSEDIA' | 'DIPINJAM' | 'RUSAK';

export interface FotoKerjaSlot {
  label: 'BEFORE_0' | 'PROGRESS_50' | 'AFTER_100';
  fileName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  /** Akurasi GPS perangkat (meter), jika ada */
  accuracyMeters?: number;
  /** device = GPS HP asli; simulasi = fallback demo */
  gpsSource?: 'device' | 'simulasi';
  /** URL mock/real foto lapangan (contoh: /image/ppsu1.jpg) */
  imageUrl?: string;
}

export interface LaporanKerjaPpsu {
  id: string;
  kelurahanId: string;
  petugasUserId: string;
  petugasNama: string;
  /** Contoh: Regu Zona A (RW 01–03) */
  reguLabel: string;
  lokasi: string;
  jenisPekerjaan: JenisKerjaPpsu;
  kategoriTugas: KategoriTugasPpsu;
  /** Ploting rutin: estimasi panjang/area (mis. Ruas ±300 meter) */
  estimasiArea?: string;
  /** Urgensi RW: asal laporan (rwId) */
  asalRwId?: string;
  asalRwLabel?: string;
  prioritasUrgensi?: PrioritasUrgensiPpsu;
  catatan?: string;
  fotoBefore: FotoKerjaSlot;
  fotoProgress: FotoKerjaSlot;
  fotoAfter: FotoKerjaSlot;
  createdAt: string;
}

export type StatusJentik = 'ADA' | 'TIDAK_ADA';

export type StatusLaporanPsn =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MENUNGGU_VERIFIKASI'
  | 'VALIDATED_RW'
  | 'LOCKED'
  | 'REJECTED';

export type StatusVerifikasi = 'PENDING' | 'DITERIMA' | 'DITOLAK';

export type KondisiAset = 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | 'HILANG';

export type StatusKegiatan = 'DIJADWALKAN' | 'BERLANGSUNG' | 'SELESAI' | 'DITUNDA';

/** Status zona ABJ: >=95% Aman; <95% Zona Merah; 0 diperiksa = Belum Input. */
export type ZonaAbj = 'AMAN' | 'ZONA_MERAH' | 'BELUM_ADA_DATA';

export interface Kelurahan {
  id: string;
  kode: string;
  nama: string;
  kecamatan: string;
  kota: string;
  alamatKantor: string;
}

export interface Rw {
  id: string;
  kelurahanId: string;
  nomor: string;
  namaKetua: string;
  /** Nomor WA Ketua RW untuk pengingat koordinasi DAOP */
  telepon?: string;
  /** Masa jabatan (YYYY-MM-DD) */
  jabatanMulai?: string;
  jabatanSelesai?: string;
  /** Nomor SK pengangkatan */
  nomorSk?: string;
  /** Arsip SK (demo: blob lokal) */
  skFileName?: string;
  skFileUrl?: string;
  skUploadedAt?: string;
}

export interface Rt {
  id: string;
  rwId: string;
  kelurahanId: string;
  nomor: string;
  namaKetua: string;
  /** Nomor WA / HP Ketua RT untuk kontak cepat zona merah */
  telepon?: string;
  publicToken: string;
  tokenActive: boolean;
  jabatanMulai?: string;
  jabatanSelesai?: string;
  nomorSk?: string;
  skFileName?: string;
  skFileUrl?: string;
  skUploadedAt?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  jabatan: string;
  kelurahanId: string;
  rwId?: string;
  rtId?: string;
  /** Regu/zona PPSU — contoh: Regu Zona A (RW 01–03) */
  reguPpsu?: string;
  /** Nomor WA/HP petugas (kontak lapangan) */
  telepon?: string;
  /** Catatan bebas — field tambahan jika nanti dibutuhkan */
  catatan?: string;
}

export type KategoriBangunan = 'RUMAH_WARGA' | 'KOS_KONTRAKAN' | 'FASUM';

export interface RumahWarga {
  id: string;
  kelurahanId: string;
  rtId: string;
  kategori: KategoriBangunan;
  alamat: string;
  noRumah: string;
  namaKk: string;
  telepon?: string;
  isActive: boolean;
}

export interface LaporanPsn {
  id: string;
  kelurahanId: string;
  rtId: string;
  rumahWargaId?: string;
  /**
   * Label bebas dari kader (nama akrab), mis. "rumah ucok" / "bangunan kontrakan gang 2".
   * Dipakai jika tidak pilih dari master bangunan.
   */
  labelBangunan?: string;
  /** Kategori saat input ketik bebas */
  kategoriBangunan?: KategoriBangunan;
  pelaporUserId?: string;
  pelaporNama?: string;
  tanggalPemeriksaan: string;
  sumber: 'KADER_RT' | 'MANDIRI_PUBLIK';
  statusJentik: StatusJentik;
  jumlahKontainer?: number;
  statusLaporan: StatusLaporanPsn;
  catatan?: string;
  /** Foto bukti pemeriksaan dari HP kader */
  fotoName?: string;
  fotoTimestamp?: string;
  fotoLatitude?: number;
  fotoLongitude?: number;
  validatedRwAt?: string;
  createdAt: string;
}

export interface WargaPendatang {
  id: string;
  kelurahanId: string;
  rtId: string;
  /** Opsional taut ke master bangunan kos */
  rumahWargaId?: string;
  namaPemilikKos: string;
  alamatKos: string;
  namaPenghuni: string;
  nik: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  asalDaerah?: string;
  tanggalMasuk: string;
  fotoKtpName: string;
  statusVerifikasi: StatusVerifikasi;
  diverifikasiOleh?: string;
  diverifikasiAt?: string;
  catatanVerifikasi?: string;
  createdAt: string;
}

/** Status tinggal di wilayah RT — warga tetap vs kos/kontrak (sering ganti). */
export type StatusTinggalWarga = 'TETAP' | 'KOS' | 'KONTRAK';

/**
 * Kategori khusus untuk deteksi cepat bantuan (pemerintah / swasta).
 * Bisa lebih dari satu sekaligus (mis. lansia + penerima bansos).
 */
export type KategoriWargaKhusus = 'LANSIA' | 'JANDA' | 'PENERIMA_BANSOS';

/**
 * Buku data warga digital per RT — ganti tumpukan fotokopi KK.
 * Diisi Ketua RT / Dasawisma; Lurah & RW pantau.
 */
export interface WargaTerdata {
  id: string;
  kelurahanId: string;
  rtId: string;
  rumahWargaId?: string;
  nama: string;
  nik: string;
  noKk?: string;
  jenisKelamin?: 'L' | 'P';
  tempatLahir?: string;
  tanggalLahir?: string;
  statusTinggal: StatusTinggalWarga;
  alamat: string;
  hubunganKk?: string;
  pekerjaan?: string;
  asalDaerah?: string;
  tanggalMasuk?: string;
  fotoKkName?: string;
  fotoKtpName?: string;
  /** Tag untuk sorting bantuan: lansia / janda / penerima bansos */
  kategoriKhusus?: KategoriWargaKhusus[];
  /** Mis. PKH, BPNT, BST, bansos kelurahan, CSR swasta */
  programBansos?: string;
  statusVerifikasi: StatusVerifikasi;
  dicatatOleh: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

/** Kategori buku kas RT (dari kebiasaan bendahara Excel/WA). */
export type KategoriKasRt =
  | 'IURAN_WARGA'
  | 'SETOR_RW'
  | 'SAMPAH'
  | 'BANTUAN_SAKIT'
  | 'OPERASIONAL'
  | 'DONASI'
  | 'LAINNYA';

/** Pembayaran iuran kas per warga per bulan — tertaut wargaTerdata (NIK/KK). */
export interface IuranKasWarga {
  id: string;
  kelurahanId: string;
  rtId: string;
  wargaTerdataId: string;
  tahun: number;
  bulan: number;
  /** Tanggal bayar YYYY-MM-DD */
  tanggalBayar: string;
  nominal?: number;
  dicatatOleh: string;
  createdAt: string;
}

/** Buku kas harian RT — debet masuk, kredit keluar. */
export interface KasTransaksiRt {
  id: string;
  kelurahanId: string;
  rtId: string;
  tanggal: string;
  uraian: string;
  kategori: KategoriKasRt;
  debet: number;
  kredit: number;
  dicatatOleh: string;
  createdAt: string;
}

/** Kategori kas tingkat RW (setor RT, santunan, operasional). */
export type KategoriKasRw =
  | 'SETOR_RT'
  | 'IURAN_RW'
  | 'SANTUNAN_MENINGGAL'
  | 'BANTUAN_SAKIT'
  | 'OPERASIONAL'
  | 'DONASI'
  | 'LAINNYA';

/** Buku kas harian RW — ringkas setoran RT + pengeluaran RW. */
export interface KasTransaksiRw {
  id: string;
  kelurahanId: string;
  rwId: string;
  /** Opsional: setoran dari RT tertentu */
  dariRtId?: string;
  tanggal: string;
  uraian: string;
  kategori: KategoriKasRw;
  debet: number;
  kredit: number;
  dicatatOleh: string;
  createdAt: string;
}

/** Setoran taawun/kas RW dari tiap RT per bulan — matriks mirip iuran warga. */
export interface SetoranRtKeRw {
  id: string;
  kelurahanId: string;
  rwId: string;
  rtId: string;
  tahun: number;
  bulan: number;
  tanggalBayar: string;
  nominal: number;
  dicatatOleh: string;
  createdAt: string;
}

export interface AsetPpsu {
  id: string;
  kelurahanId: string;
  kodeAset: string;
  namaAlat: string;
  /** Total = baik + rusak ringan + rusak berat + hilang */
  jumlah: number;
  satuan: string;
  /** Rincian stok per kondisi (mis. 10 total: 6 baik, 4 rusak ringan) */
  jumlahBaik: number;
  jumlahRusakRingan: number;
  jumlahRusakBerat: number;
  jumlahHilang: number;
  /** Ringkasan kondisi terburuk yang masih ada stoknya */
  kondisi: KondisiAset;
  statusPinjam: StatusPinjamAlat;
  dipinjamOleh?: string;
  dipinjamAt?: string;
  lokasiGudang: string;
  catatan?: string;
  updatedAt: string;
}

export interface KegiatanSaluran {
  id: string;
  kelurahanId: string;
  namaLokasi: string;
  ruasSaluran: string;
  tanggalRencana: string;
  tanggalRealisasi?: string;
  statusKegiatan: StatusKegiatan;
  petugas: string;
  catatan?: string;
  createdAt: string;
}

export interface AbjSummary {
  scopeLabel: string;
  diperiksa: number;
  bebasJentik: number;
  positif: number;
  abj: number;
  status: ZonaAbj;
}

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  role: UserRole;
  description: string;
}

/** Jenis laporan keuangan RT/RW yang dikumpulkan kelurahan. */
export type JenisLaporanKeuanganRt = 'DAOP' | 'PMI' | 'BANSOS';

/** Alur: belum → cetak form → TTD basah → upload scan. */
export type StatusLaporanKeuanganRt = 'BELUM_SETOR' | 'SUDAH_CETAK' | 'SUDAH_UPLOAD_TTD';

/** Detail teks undangan pertemuan PSN se-kelurahan. */
export interface UndanganPsnDraft {
  hariTanggal: string;
  jam: string;
  tempat: string;
  agenda: string;
  nomorSurat: string;
}

/** PDF surat undangan pertemuan PSN yang diunggah staf kelurahan. */
export interface UndanganPsnPdf {
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  /** Blob URL lokal (demo) agar PDF bisa dibuka/diunduh lagi */
  objectUrl?: string;
}

/**
 * Template kosong laporan DAOP resmi (Word) yang diunggah staf/Lurah.
 * File ini yang diunduh Ketua RT / Ketua RW untuk diisi, TTD, lalu stempel basah.
 */
export interface TemplateDaopKosong {
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  /** Blob URL lokal (demo) */
  objectUrl?: string;
  /** doc | docx */
  mimeType?: string;
}

/**
 * Log kirim undangan PSN ke Ketua RW.
 * Demo: via wa.me (teks) + PDF disiapkan untuk dilampirkan.
 * Produksi nanti: WhatsApp Business API bisa kirim teks + dokumen sekaligus.
 */
export interface UndanganPsnKirim {
  id: string;
  rwId: string;
  labelRw: string;
  namaKetua: string;
  telepon: string;
  nomorSurat: string;
  pdfFileName?: string;
  /** true jika PDF ikut disiapkan / (nanti) terkirim via API */
  denganPdf: boolean;
  channel: 'DEMO_WA_ME' | 'WA_BUSINESS_API';
  dikirimOleh: string;
  dikirimAt: string;
}

/** Laporan DAOP bisa dari Ketua RT atau Ketua RW. */
export type TingkatLaporanDaop = 'RT' | 'RW';

export interface LaporanKeuanganRt {
  id: string;
  kelurahanId: string;
  /** RT | RW — kewajiban setor DAOP masing-masing */
  tingkat: TingkatLaporanDaop;
  /** Diisi jika tingkat = RT */
  rtId?: string;
  rwId: string;
  /** Contoh: Agustus 2026 */
  periodeLabel: string;
  tahun: number;
  /** 1–12 */
  bulan: number;
  jenis: JenisLaporanKeuanganRt;
  status: StatusLaporanKeuanganRt;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
  catatan?: string;
  /** Nama file scan berkas yang sudah TTD basah */
  scanFileName?: string;
  /** URL preview scan (demo: /image/… atau blob upload) */
  scanImageUrl?: string;
  scanUploadedAt?: string;
  dicetakAt?: string;
  diuploadOleh?: string;
  /** Datang ke kantor, atau upload sendiri dari HP */
  caraSetor?: 'DATANG_KELURAHAN' | 'UPLOAD_MANDIRI';
  tenggatAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Anggota LMK (Lembaga Musyawarah Kelurahan).
 * Perda DKI: 1 lembaga LMK per kelurahan; anggota = 1 tokoh perwakilan per RW
 * (bukan struktur Ketua/Sekretaris/Bendahara terpisah per RW).
 */
export interface AnggotaLmk {
  id: string;
  kelurahanId: string;
  /** RW yang diwakili (1 RW = 1 anggota) */
  rwId: string;
  nama: string;
  telepon?: string;
  /** Opsional: nomor SK / surat keterangan pemilihan */
  nomorSk?: string;
  catatan?: string;
  isActive: boolean;
}

/** Peserta undangan rapat kelurahan. */
export type JenisPesertaAgenda = 'RT' | 'RW' | 'STAF' | 'TAMU' | 'LMK';

export type StatusAgendaRapat = 'DIJADWALKAN' | 'BERLANGSUNG' | 'SELESAI' | 'DIBATALKAN';

export interface PesertaAgenda {
  id: string;
  jenis: JenisPesertaAgenda;
  nama: string;
  /**
   * Tamu: instansi.
   * LMK: label "Perwakilan LMK · RW xx" (bukan jabatan Ketua/Sekretaris LMK).
   */
  instansi?: string;
  /** WA untuk blast undangan (LMK / tamu yang perlu dikirim). */
  telepon?: string;
  rtId?: string;
  rwId?: string;
  hadir: boolean;
  hadirAt?: string;
}

/** Jenis kegiatan di modul Agenda (satu modul untuk banyak acara). */
export type JenisKegiatanAgenda =
  | 'RAPAT'
  | 'PENYULUHAN'
  | 'SOSIALISASI'
  | 'POSYANDU'
  | 'LAIN';

/** Agenda kegiatan kelurahan: rapat, penyuluhan, sosialisasi, dll. */
export interface AgendaRapat {
  id: string;
  kelurahanId: string;
  /** Default RAPAT untuk data lama. */
  jenisKegiatan?: JenisKegiatanAgenda;
  judul: string;
  tanggal: string;
  jamMulai: string;
  tempat: string;
  ringkasanAgenda: string;
  status: StatusAgendaRapat;
  peserta: PesertaAgenda[];
  notulen?: string;
  /** PDF undangan sekretaris — blast WA hanya ke Ketua RW (bukan tiap RT). */
  undanganPdfName?: string;
  undanganPdfUrl?: string;
  undanganPdfUploadedAt?: string;
  undanganPdfUploadedBy?: string;
  /** rwId yang sudah di-blast undangan */
  undanganBlastRwIds?: string[];
  /** id peserta LMK/tamu yang sudah di-blast */
  undanganBlastPesertaIds?: string[];
  dibuatOleh: string;
  createdAt: string;
  updatedAt: string;
}

export type StatusKerjaBakti = 'DIJADWALKAN' | 'BERLANGSUNG' | 'SELESAI' | 'DITUNDA';

/** Kerja bakti bergilir per RW. */
export interface KerjaBaktiRw {
  id: string;
  kelurahanId: string;
  rwId: string;
  tanggal: string;
  lokasi: string;
  picNama: string;
  deskripsi: string;
  status: StatusKerjaBakti;
  catatan?: string;
  fotoName?: string;
  fotoUrl?: string;
  /** PDF undangan resmi dari sekretaris kelurahan */
  undanganPdfName?: string;
  undanganPdfUrl?: string;
  undanganPdfUploadedAt?: string;
  undanganPdfUploadedBy?: string;
  /** Terakhir blast WA undangan ke Ketua RW */
  undanganBlastAt?: string;
  /**
   * Dukungan PPSU — opsional, untuk rekap bila PPSU ikut.
   * Bukan langkah wajib; isi kalau perlu saja.
   */
  ppsuJumlahPersonil?: number;
  ppsuReguLabel?: string;
  /** id aset dari Master gudang */
  ppsuAlatIds?: string[];
  ppsuKendaraan?: string;
  selesaiAt?: string;
  dibuatOleh: string;
  createdAt: string;
}

/** Kode klasifikasi singkat surat keluar kelurahan. */
export type KodeSuratKeluar = 'UND' | 'KET' | 'LAP' | 'DIS' | 'LAIN';

/**
 * Register nomor surat keluar (mockup).
 * Produksi: nomor unik & urutan di backend agar anti-dobel multi-user.
 */
/** Penerima sebaran surat keluar kelurahan (terintegrasi portal + WA). */
export type PenerimaSuratKelurahan = 'RW' | 'RT' | 'LMK';

export interface SuratKeluar {
  id: string;
  kelurahanId: string;
  /** Nomor lengkap, contoh: 012/UND/RWJ/XI/2026 */
  nomorSurat: string;
  nomorUrut: number;
  tahun: number;
  kode: KodeSuratKeluar;
  perihal: string;
  tujuan: string;
  tanggalSurat: string;
  dibuatOleh: string;
  catatan?: string;
  /**
   * Siapa yang menerima di JATI / WA:
   * RW = portal Ketua RW, RT = portal Ketua RT, LMK = blast WA dari kelurahan.
   */
  penerimaJenis?: PenerimaSuratKelurahan[];
  /** File scan/PDF opsional (demo blob) */
  fileName?: string;
  fileUrl?: string;
  createdAt: string;
}

/** Setoran PMI (seikhlasnya) atau BAZNAS (wajib + kupon). */
export type JenisSetoranSosial = 'PMI' | 'BAZNAS';

export type SumberSetoranSosial = 'RT' | 'RW' | 'TAMU_LAYANAN';

/**
 * Catatan setoran untuk rekap map ↔ laporan (ganti Excel).
 * Framing: bantu rekonsiliasi ke PMI/BAZNAS, bukan tagihan.
 */
export interface SetoranSosial {
  id: string;
  kelurahanId: string;
  jenis: JenisSetoranSosial;
  sumber: SumberSetoranSosial;
  /** Label penyetor: nama tamu / ketua / wilayah */
  namaPenyetor: string;
  rtId?: string;
  rwId?: string;
  nominal: number;
  /** BAZNAS: kupon diberikan (wajib 100rb) */
  adaKupon?: boolean;
  nomorKupon?: string;
  tanggalSetor: string;
  periodeTahun: number;
  periodeBulan: number;
  catatan?: string;
  dicatatOleh: string;
  createdAt: string;
}

/** Rekap kas map PMI per periode — cocokkan dengan total catatan. */
export interface RekapMapPmi {
  id: string;
  kelurahanId: string;
  tahun: number;
  bulan: number;
  /** Uang fisik dihitung dari map */
  totalUangMap: number;
  updatedAt: string;
  updatedBy: string;
  catatan?: string;
}

/** Arahan Lurah / staf → ditugaskan ke Kasi, RW, atau PPSU. */
export type StatusPerintahLurah =
  | 'BARU'
  | 'DITERIMA'
  | 'DIKERJAKAN'
  | 'SELESAI'
  | 'DIBATALKAN';

export type PrioritasPerintah = 'NORMAL' | 'URGENT';

/** Siapa yang mengerjakan perintah. */
export type JenisPenerimaPerintah = 'STAF' | 'RW' | 'PPSU';

export interface PerintahLurah {
  id: string;
  kelurahanId: string;
  judul: string;
  isi: string;
  prioritas: PrioritasPerintah;
  status: StatusPerintahLurah;
  /** Batas selesai YYYY-MM-DD */
  tenggatAt: string;
  dibuatOlehUserId: string;
  dibuatOlehNama: string;
  penerimaJenis: JenisPenerimaPerintah;
  /** STAF / PPSU: user yang ditugaskan */
  penerimaUserId?: string;
  /** RW: wilayah yang ditugaskan */
  penerimaRwId?: string;
  /** Label tampilan: "Kasi Ekbang · …" / "Ketua RW 07" */
  penerimaLabel: string;
  catatanTindakLanjut?: string;
  diterimaAt?: string;
  dikerjakanAt?: string;
  selesaiAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Item gabungan untuk Kalender Operasional (bukan entitas tersimpan). */
export type JenisKalenderOps =
  | 'AGENDA'
  | 'KERJA_BAKTI'
  | 'PPSU_SALURAN'
  | 'PSN_JUMAT'
  | 'UNDANGAN_PSN'
  | 'PERINTAH';

export interface KalenderOpsItem {
  id: string;
  jenis: JenisKalenderOps;
  tanggal: string;
  jam?: string;
  judul: string;
  meta: string;
  link: string;
  statusLabel?: string;
}

/** Pengaduan / laporan warga via RW → disposisi kelurahan. */
export type StatusPengaduan =
  | 'BARU'
  | 'DIDISPOSISI'
  | 'DIPROSES'
  | 'SELESAI'
  | 'DITOLAK';

export type KategoriPengaduan =
  | 'SALURAN'
  | 'KEBERSIHAN'
  | 'PENERANGAN'
  | 'KEAMANAN'
  | 'ADMINISTRASI'
  | 'LAIN';

export type PrioritasPengaduan = 'NORMAL' | 'URGENT';

export interface PengaduanWilayah {
  id: string;
  kelurahanId: string;
  judul: string;
  isi: string;
  kategori: KategoriPengaduan;
  prioritas: PrioritasPengaduan;
  status: StatusPengaduan;
  lokasi?: string;
  rwId: string;
  rtId?: string;
  pelaporNama: string;
  pelaporUserId?: string;
  /** Disposisi ke staf / PPSU / tetap di RW */
  disposisiJenis?: JenisPenerimaPerintah;
  disposisiUserId?: string;
  disposisiRwId?: string;
  disposisiLabel?: string;
  catatanDisposisi?: string;
  catatanSelesai?: string;
  didisposisiAt?: string;
  diprosesAt?: string;
  selesaiAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Surat masuk kelurahan → disposisi ke Kasi/staf. */
export type StatusSuratMasuk =
  | 'BARU'
  | 'DIDISPOSISI'
  | 'DIPROSES'
  | 'SELESAI'
  | 'DIARSIPKAN';

export interface SuratMasuk {
  id: string;
  kelurahanId: string;
  nomorAgenda: string;
  nomorSuratAsal?: string;
  asal: string;
  perihal: string;
  tanggalSurat: string;
  tanggalTerima: string;
  status: StatusSuratMasuk;
  ringkasan?: string;
  disposisiUserId?: string;
  disposisiLabel?: string;
  catatanDisposisi?: string;
  catatanSelesai?: string;
  didisposisiAt?: string;
  selesaiAt?: string;
  dicatatOleh: string;
  createdAt: string;
  updatedAt: string;
}

/** Buku tamu dinas / kunjungan ke kelurahan. */
export type TujuanKunjungan =
  | 'KOORDINASI'
  | 'MONITORING'
  | 'SOSIALISASI'
  | 'LAYANAN'
  | 'LAIN';

export interface TamuDinas {
  id: string;
  kelurahanId: string;
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
  createdAt: string;
}

/** Event besar kelurahan + checklist tugas. */
export type StatusEventBesar = 'PERSIAPAN' | 'BERLANGSUNG' | 'SELESAI' | 'DIBATALKAN';

export type StatusChecklistItem = 'TODO' | 'PROGRESS' | 'DONE';

export interface ChecklistEventItem {
  id: string;
  judul: string;
  picNama: string;
  picUserId?: string;
  status: StatusChecklistItem;
  tenggatAt?: string;
  catatan?: string;
  selesaiAt?: string;
}

export interface EventBesar {
  id: string;
  kelurahanId: string;
  nama: string;
  tanggal: string;
  lokasi: string;
  status: StatusEventBesar;
  deskripsi?: string;
  checklist: ChecklistEventItem[];
  dibuatOleh: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoSeed {
  rws: Rw[];
  rts: Rt[];
  users: UserAccount[];
  rumahWargas: RumahWarga[];
  laporanPsns: LaporanPsn[];
  wargaPendatangs: WargaPendatang[];
  wargaTerdatas: WargaTerdata[];
  iuranKasWargas: IuranKasWarga[];
  kasTransaksiRts: KasTransaksiRt[];
  kasTransaksiRws: KasTransaksiRw[];
  setoranRtKeRws: SetoranRtKeRw[];
  asetPpsus: AsetPpsu[];
  kegiatanSalurans: KegiatanSaluran[];
  laporanKerjaPpsus: LaporanKerjaPpsu[];
  laporanKeuanganRts: LaporanKeuanganRt[];
  agendaRapats: AgendaRapat[];
  kerjaBaktiRws: KerjaBaktiRw[];
  suratKeluars: SuratKeluar[];
  setoranSosials: SetoranSosial[];
  rekapMapPmis: RekapMapPmi[];
  perintahLurahs: PerintahLurah[];
  pengaduans: PengaduanWilayah[];
  suratMasuks: SuratMasuk[];
  tamuDinas: TamuDinas[];
  eventBesars: EventBesar[];
  anggotaLmks: AnggotaLmk[];
}
