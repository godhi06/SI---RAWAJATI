/**
 * Copy & brand panel login — dipakai demo (/login) dan production (/login-production).
 * Ubah di sini saja supaya kalimat tidak beda.
 */
export const LOGIN_BRAND = {
  tempat: 'Kelurahan Rawajati',
  /** Brand singkat dari Rawajati — jati = kokoh & tahan lama */
  produk: 'JATI',
  judul: 'Pantauan Lurah, kerja sampai RT',
  blurb:
    'Satu sistem operasional kelurahan: monitoring & laporan untuk pimpinan, serta portal kerja untuk RW, RT, dan petugas lapangan.',
  poin: [
    {
      judul: 'Dashboard Lurah',
      teks:
        'Radar mingguan, perintah & tindak lanjut, agenda, PSN/ABJ, DAOP, dan PPSU; laporan siap dicetak atau diekspor bila diperlukan.',
    },
    {
      judul: 'Surat dari kelurahan',
      teks:
        'Undangan ke portal RW & Ketua RT; LMK diundang langsung; nomor surat terjejak rapi.',
    },
    {
      judul: 'Lapangan digital',
      teks:
        'Warga NIK/KK + kas RT/RW, Jumantik PSN, PPSU foto GPS; Lurah pantau dari satu layar.',
    },
  ],
  footer: 'Kelurahan Rawajati · Kec. Pancoran, Jakarta Selatan',
  /**
   * Panel kiri: terang + teks gelap (ramah lansia), gradient lembut biar tidak polos.
   */
  panelClass: 'bg-gradient-to-br from-[#e8f1fb] via-[#f5f8fc] to-[#eef6f3]',
} as const;
