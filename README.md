# SI-RAWAJATI

Prototipe sistem informasi operasional **Kelurahan Rawajati** (Kecamatan Pancoran, Jakarta Selatan).

**Demo (Vercel):** https://si-rawajati.vercel.app

> Data masih contoh (seed). Belum terhubung database produksi.

## Fitur utama

- **Login multi-peran** — Lurah / Sekkel / RW / RT / Jumantik / PPSU
- **DAOP** — pantauan setoran RT/RW, status nunggak, blast WA
- **PSN Jumantik** — input lapangan, validasi, undangan/cetak
- **PPSU** — lapor kerja Non-CRM (foto Before/Progress/After + GPS perangkat), gudang alat, pantauan Ekbang
- **Agenda kelurahan** — rapat / kegiatan, undangan
- **Surat keluar** — register surat
- **Setoran sosial** — PMI & BAZNAS (rekap/cetak)
- **Laporan gabungan** — rekap bulanan / PDF
- **Master data** — akun & data wilayah (sesuai role)

Tampilan **responsif** (komputer kantor & HP).

## Tech stack

- Angular 19 (standalone)
- Tailwind CSS
- Deploy frontend: Vercel

## Cara menjalankan lokal

```bash
git clone https://github.com/godhi06/SI---RAWAJATI.git
cd SI---RAWAJATI/frontend
npm install
npm start
```

Buka http://localhost:4200

## Cara coba (Lurah / staf)

- Panduan singkat: [docs/cara-coba.md](docs/cara-coba.md)
- Di demo: https://si-rawajati.vercel.app/cara-coba.html

## Deploy Vercel

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist/frontend/browser`

## Catatan

Prototipe untuk diskusi & penyesuaian kebutuhan kantor — bukan pengganti sistem resmi kecuali disepakati.
