import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

/** Perihal cetak — SK* masuk nomor buku SK; SKD & SKematian terpisah. */
type PerihalSk =
  | 'UMUM'
  | 'SKTM'
  | 'NIKAH'
  | 'CERAI'
  | 'AKTIF_NIK'
  | 'DOMISILI'
  | 'KEMATIAN';

/** Cetak sesuai buku RT: SK / SKD / SKematian. */
@Component({
  selector: 'app-surat-keterangan-cetak',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5 print:space-y-0">
      <header class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a routerLink="/app/surat-keterangan" class="text-sm font-semibold text-blue-700">
            ← Kembali ke Surat Keterangan
          </a>
          <h1 class="page-title mt-1">{{ meta().judul }}</h1>
          <p class="page-sub">
            Buku {{ meta().buku }} · TTD RT kanan
            @if (pakaiTtdRw()) {
              · Mengetahui (RW) kiri — bisa Sekretaris RW
            }
          </p>
        </div>
        <button type="button" class="btn-primary" (click)="cetak()" [disabled]="!warga()">
          Cetak / Simpan PDF
        </button>
      </header>

      @if (pakaiTtdRw() && warga()) {
        <section class="card grid gap-3 !p-4 sm:grid-cols-2 print:hidden">
          <div>
            <label class="field-label" for="jab-mengetahui">Jabatan menandatangani (kiri)</label>
            <select
              id="jab-mengetahui"
              class="field-input"
              [ngModel]="jabatanMengetahui()"
              (ngModelChange)="onJabatanMengetahui($event)"
            >
              <option value="SEKRETARIS">Sekretaris RW</option>
              <option value="KETUA">Ketua RW</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="nama-mengetahui">Nama penandatangan</label>
            <input
              id="nama-mengetahui"
              class="field-input"
              [ngModel]="namaMengetahui()"
              (ngModelChange)="namaMengetahui.set($event)"
              placeholder="Nama yang biasa tanda tangan"
            />
          </div>
        </section>
      }

      @if (warga(); as w) {
        <article
          class="mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
        >
          <header class="border-b-2 border-slate-900 pb-4 text-center">
            <p class="text-[11px] font-bold uppercase tracking-wide">Pemerintah Provinsi DKI Jakarta</p>
            <p class="text-[11px] font-bold uppercase tracking-wide">
              Kota Administrasi {{ data.kelurahan.kota }}
            </p>
            <p class="text-[11px] font-bold uppercase tracking-wide">
              Kecamatan {{ data.kelurahan.kecamatan }}
            </p>
            <p class="mt-1 text-base font-extrabold uppercase">{{ data.kelurahan.nama }}</p>
            <p class="mt-1 text-sm font-bold uppercase">{{ data.labelWilayah(w.rtId) }}</p>
            <p class="mt-1 text-[10px] text-slate-600">{{ data.kelurahan.alamatKantor }}</p>
          </header>

          <div class="mt-6 text-center">
            <p class="text-sm font-extrabold uppercase underline">{{ meta().judul }}</p>
            <p class="mt-1 text-sm font-bold">Nomor: {{ nomorSurat() }}</p>
            @if (meta().perihalLabel) {
              <p class="mt-1 text-xs font-semibold text-slate-600">Perihal: {{ meta().perihalLabel }}</p>
            }
          </div>

          <p class="mt-6 text-sm leading-relaxed">
            Yang bertanda tangan di bawah ini, Ketua {{ data.labelWilayah(w.rtId) }}
            {{ data.kelurahan.nama }}, Kecamatan {{ data.kelurahan.kecamatan }}, dengan ini menerangkan
            bahwa:
          </p>

          <div class="mt-4 space-y-1.5 text-sm">
            <p><span class="inline-block w-40 font-semibold">Nama</span>: {{ w.nama }}</p>
            <p><span class="inline-block w-40 font-semibold">NIK</span>: {{ w.nik }}</p>
            @if (w.noKk) {
              <p><span class="inline-block w-40 font-semibold">No. KK</span>: {{ w.noKk }}</p>
            }
            @if (w.tempatLahir || w.tanggalLahir) {
              <p>
                <span class="inline-block w-40 font-semibold">Tempat / tgl lahir</span>:
                {{ w.tempatLahir || '…' }}{{ w.tanggalLahir ? ', ' + w.tanggalLahir : '' }}
              </p>
            }
            @if (w.jenisKelamin) {
              <p>
                <span class="inline-block w-40 font-semibold">Jenis kelamin</span>:
                {{ w.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki' }}
              </p>
            }
            <p>
              <span class="inline-block w-40 font-semibold">Status tinggal</span>:
              {{ data.labelStatusTinggal(w.statusTinggal) }}
            </p>
            <p><span class="inline-block w-40 font-semibold">Alamat</span>: {{ w.alamat }}</p>
            <p>
              <span class="inline-block w-40 font-semibold">Wilayah</span>:
              {{ data.labelWilayah(w.rtId) }} · {{ data.kelurahan.nama }}
            </p>
          </div>

          <p class="mt-5 text-sm leading-relaxed">{{ meta().dictum }}</p>

          <p class="mt-4 text-sm leading-relaxed">
            Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.
          </p>

          <div
            class="mt-10 grid gap-8 text-sm"
            [class.sm:grid-cols-2]="pakaiTtdRw()"
            [class.justify-items-end]="!pakaiTtdRw()"
          >
            @if (pakaiTtdRw()) {
              <div class="text-center">
                <p class="invisible">{{ data.kelurahan.nama }}, {{ tanggalCetak }}</p>
                <p class="mt-1 font-semibold">Mengetahui</p>
                <p>{{ labelJabatanMengetahui() }}</p>
                <div class="my-14"></div>
                <p class="font-bold underline">{{ namaMengetahuiCetak() }}</p>
              </div>
            }
            <div class="text-center" [class.sm:justify-self-end]="pakaiTtdRw()" [class.w-56]="!pakaiTtdRw()">
              <p>{{ data.kelurahan.nama }}, {{ tanggalCetak }}</p>
              <p class="mt-1">Ketua {{ data.labelWilayah(w.rtId) }}</p>
              <div class="my-14"></div>
              <p class="font-bold underline">{{ ketuaNama() }}</p>
            </div>
          </div>

          <p class="mt-6 text-[10px] text-slate-500">
            JATI · buku {{ meta().buku }} · {{ auth.currentUser()?.name }}
          </p>
        </article>
      } @else {
        <p class="rounded-xl border border-dashed border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm text-rose-700">
          Data warga tidak ditemukan. Pilih warga dari menu Surat Keterangan.
        </p>
      }
    </div>
  `,
})
export class SuratKeteranganCetakComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  private readonly route = inject(ActivatedRoute);

  private readonly qp = toSignal(
    this.route.queryParamMap.pipe(
      map((q) => ({
        id: q.get('id') || '',
        jenis: (q.get('jenis') || 'UMUM').toUpperCase() as PerihalSk,
      })),
    ),
    { initialValue: { id: '', jenis: 'UMUM' as PerihalSk } },
  );

  readonly tanggalCetak = this.data.formatTanggalId();

  /** Default lapangan: Sekretaris RW yang tanda tangan di blok Mengetahui. */
  readonly jabatanMengetahui = signal<'SEKRETARIS' | 'KETUA'>('SEKRETARIS');
  readonly namaMengetahui = signal('');

  readonly warga = computed(() => {
    const id = this.qp().id;
    return id ? this.data.getWargaTerdata(id) : undefined;
  });

  constructor() {
    effect(() => {
      const w = this.warga();
      if (!w) return;
      if (this.namaMengetahui().trim()) return;
      this.onJabatanMengetahui(this.jabatanMengetahui());
    });
  }

  /** SK & SKD: blok Mengetahui di kiri. */
  readonly pakaiTtdRw = computed(() => {
    const b = this.meta().buku;
    return b === 'SK' || b === 'SKD';
  });

  private rwOfWarga() {
    const w = this.warga();
    if (!w) return undefined;
    const rt = this.data.getRt(w.rtId);
    return rt ? this.data.getRw(rt.rwId) : undefined;
  }

  readonly labelRw = computed(() => {
    const rw = this.rwOfWarga();
    return rw ? this.data.labelRw(rw.nomor) : 'RW';
  });

  /** Demo nama sekretaris per RW (bisa diganti di form sebelum cetak). */
  private namaSekretarisDefault(rwId?: string): string {
    const map: Record<string, string> = {
      'rw-7': 'Siti Rohani',
      'rw-1': 'Bambang Wijaya',
      'rw-3': 'Nurhayati',
      'rw-11': 'Eko Prasetyo',
    };
    return (rwId && map[rwId]) || '……………………';
  }

  onJabatanMengetahui(v: string): void {
    const jab = v === 'KETUA' ? 'KETUA' : 'SEKRETARIS';
    this.jabatanMengetahui.set(jab);
    const rw = this.rwOfWarga();
    if (jab === 'KETUA') {
      this.namaMengetahui.set(rw?.namaKetua || '……………………');
    } else {
      this.namaMengetahui.set(this.namaSekretarisDefault(rw?.id));
    }
  }

  labelJabatanMengetahui(): string {
    const rw = this.labelRw();
    return this.jabatanMengetahui() === 'KETUA' ? `Ketua ${rw}` : `Sekretaris ${rw}`;
  }

  namaMengetahuiCetak(): string {
    const typed = this.namaMengetahui().trim();
    if (typed) return typed;
    const rw = this.rwOfWarga();
    if (this.jabatanMengetahui() === 'KETUA') return rw?.namaKetua || '……………………';
    return this.namaSekretarisDefault(rw?.id);
  }

  readonly meta = computed(() => {
    const jenis = this.qp().jenis;
    const map: Record<
      PerihalSk,
      { judul: string; buku: string; kodeNomor: string; perihalLabel?: string; dictum: string }
    > = {
      SKTM: {
        judul: 'Surat Keterangan',
        buku: 'SK',
        kodeNomor: 'SK',
        perihalLabel: 'Tidak mampu (SKTM)',
        dictum:
          'Bahwa yang bersangkutan benar warga kami dan menurut sepengetahuan Ketua RT termasuk keluarga kurang mampu / tidak mampu secara ekonomi. Surat ini (buku SK) dapat dipergunakan untuk pengurusan bantuan, keringanan biaya, atau keperluan lain yang membutuhkan keterangan tidak mampu.',
      },
      NIKAH: {
        judul: 'Surat Keterangan',
        buku: 'SK',
        kodeNomor: 'SK',
        perihalLabel: 'Pengantar nikah',
        dictum:
          'Bahwa yang bersangkutan benar warga wilayah RT kami. Surat keterangan ini (buku SK) dibuat sebagai pengantar / keterangan untuk keperluan administrasi pernikahan sesuai ketentuan yang berlaku.',
      },
      CERAI: {
        judul: 'Surat Keterangan',
        buku: 'SK',
        kodeNomor: 'SK',
        perihalLabel: 'Pengantar / keterangan cerai',
        dictum:
          'Bahwa yang bersangkutan benar warga wilayah RT kami. Surat keterangan ini (buku SK) dibuat untuk keperluan administrasi perceraian / pengantar sesuai ketentuan yang berlaku.',
      },
      AKTIF_NIK: {
        judul: 'Surat Keterangan',
        buku: 'SK',
        kodeNomor: 'SK',
        perihalLabel: 'Aktifkan NIK',
        dictum:
          'Bahwa yang bersangkutan benar warga wilayah RT kami dan data kependudukannya tercatat di buku warga digital. Surat keterangan ini (buku SK) dibuat untuk keperluan pengaktifan / administrasi NIK.',
      },
      UMUM: {
        judul: 'Surat Keterangan',
        buku: 'SK',
        kodeNomor: 'SK',
        perihalLabel: 'Keterangan umum',
        dictum:
          'Bahwa yang bersangkutan benar tercatat dalam buku data warga digital wilayah RT kami. Surat keterangan ini (buku SK) dibuat untuk dipergunakan sebagaimana mestinya.',
      },
      DOMISILI: {
        judul: 'Surat Keterangan Domisili',
        buku: 'SKD',
        kodeNomor: 'SKD',
        dictum:
          'Bahwa yang bersangkutan benar bertempat tinggal / berdomisili di alamat tersebut di atas dalam wilayah RT kami. Surat ini (buku SKD) dibuat untuk keperluan administrasi yang membutuhkan keterangan domisili.',
      },
      KEMATIAN: {
        judul: 'Surat Keterangan Kematian',
        buku: 'SKematian',
        kodeNomor: 'SKEMATIAN',
        dictum:
          'Bahwa yang bersangkutan tercatat sebagai warga wilayah RT kami. Surat ini (buku SKematian) dibuat sehubungan dengan laporan kematian untuk keperluan administrasi kependudukan / ahli waris. (Lengkapi tanggal & sebab kematian secara manual bila diperlukan.)',
      },
    };
    return map[jenis] ?? map.UMUM;
  });

  readonly nomorSurat = computed(() => {
    const kode = this.meta().kodeNomor;
    const bulan = this.data.bulanRomawi(new Date().getMonth() + 1);
    const tahun = new Date().getFullYear();
    return `…/${kode}/RT/${bulan}/${tahun}`;
  });

  readonly ketuaNama = computed(() => {
    const w = this.warga();
    if (!w) return '……………………';
    const rt = this.data.getRt(w.rtId);
    return rt?.namaKetua || this.auth.currentUser()?.name || '……………………';
  });

  cetak(): void {
    window.print();
  }
}
