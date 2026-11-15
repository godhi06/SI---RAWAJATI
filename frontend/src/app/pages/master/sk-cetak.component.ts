import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

type JenisSk = 'RW' | 'RT' | 'LMK';

/** Cetak berkas fisik SK Ketua RT/RW / keterangan perwakilan LMK. */
@Component({
  selector: 'app-sk-cetak',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 class="page-title">Cetak berkas SK</h1>
          <p class="page-sub">Preview di bawah · satu tombol untuk cetak fisik atau simpan PDF.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a routerLink="/app/master" class="btn-secondary text-sm">Kembali Master</a>
          <button type="button" class="btn-primary text-sm" (click)="cetak()" [disabled]="!dok()">
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      @if (dok(); as d) {
        <article
          class="sk-sheet mx-auto max-w-[210mm] bg-white px-8 py-10 text-slate-900 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none"
        >
          <header class="border-b-2 border-slate-900 pb-3 text-center">
            <p class="text-[11px] font-bold uppercase tracking-wide">Pemerintah Provinsi Daerah Khusus Ibukota Jakarta</p>
            <p class="text-[11px] font-bold uppercase tracking-wide">Kota Administrasi {{ data.kelurahan.kota }}</p>
            <p class="text-[11px] font-bold uppercase tracking-wide">Kecamatan {{ data.kelurahan.kecamatan }}</p>
            <p class="mt-1 text-base font-extrabold uppercase tracking-wide">{{ data.kelurahan.nama }}</p>
            <p class="mt-1 text-[10px] text-slate-600">
              {{ data.kelurahan.alamatKantor }}
            </p>
          </header>

          <div class="mt-6 text-center">
            <p class="text-sm font-extrabold uppercase underline">Surat Keputusan Lurah</p>
            <p class="mt-1 text-sm font-bold">Nomor: {{ d.nomorSk }}</p>
          </div>

          <p class="mt-6 text-sm leading-relaxed">
            Lurah {{ data.kelurahan.nama }}, Kecamatan {{ data.kelurahan.kecamatan }}, Kota Administrasi
            {{ data.kelurahan.kota }}, dengan ini menetapkan:
          </p>

          <div class="mt-5 space-y-2 text-sm">
            <p class="font-extrabold uppercase">Menetapkan</p>
            <p>
              <span class="inline-block w-28 font-semibold">Nama</span>: {{ d.nama }}
            </p>
            <p>
              <span class="inline-block w-28 font-semibold">Jabatan</span>: {{ d.jabatan }}
            </p>
            <p>
              <span class="inline-block w-28 font-semibold">Wilayah</span>: {{ d.wilayah }}
            </p>
            <p>
              <span class="inline-block w-28 font-semibold">Masa jabatan</span>:
              {{ d.mulai || '………………' }} s.d. {{ d.selesai || '………………' }}
            </p>
          </div>

          <p class="mt-5 text-sm leading-relaxed">
            {{ d.dictum }}
          </p>

          <p class="mt-4 text-sm leading-relaxed">
            Surat Keputusan ini dibuat untuk dipergunakan sebagaimana mestinya. Apabila di kemudian hari
            terdapat kekeliruan, akan diadakan perbaikan sebagaimana mestinya.
          </p>

          <div class="mt-10 flex justify-end">
            <div class="w-56 text-center text-sm">
              <p>{{ data.kelurahan.nama }}, {{ tanggalCetak }}</p>
              <p class="mt-1">Lurah {{ data.kelurahan.nama }}</p>
              <div class="my-14"></div>
              <p class="font-bold underline">{{ lurahNama() }}</p>
              <p class="text-xs">NIP. …………………………</p>
            </div>
          </div>

          <p class="mt-8 text-[10px] text-slate-500 print:mt-6">
            Dicetak dari SI-RAWAJATI · {{ d.jenisLabel }} · {{ auth.currentUser()?.name }}
          </p>
        </article>
      } @else {
        <p class="rounded-xl border border-dashed border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm text-rose-700">
          Data SK tidak ditemukan. Kembali ke Master Data lalu pilih Cetak SK.
        </p>
      }
    </div>
  `,
  styles: [
    `
      @media print {
        :host {
          display: block;
        }
        .sk-sheet {
          box-shadow: none !important;
        }
      }
    `,
  ],
})
export class SkCetakComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  private readonly route = inject(ActivatedRoute);

  private readonly qp = toSignal(
    this.route.queryParamMap.pipe(
      map((q) => ({
        jenis: (q.get('jenis') || '').toUpperCase() as JenisSk | '',
        id: q.get('id') || '',
      })),
    ),
    { initialValue: { jenis: '' as JenisSk | '', id: '' } },
  );

  readonly tanggalCetak = this.data.formatTanggalId();

  readonly lurahNama = computed(() => {
    const lurah = this.data.users().find((u) => /lurah/i.test(u.jabatan || ''));
    return lurah?.name || this.auth.currentUser()?.name || '……………………';
  });

  readonly dok = computed(() => {
    const { jenis, id } = this.qp();
    if (!jenis || !id) return null;

    if (jenis === 'RW') {
      const rw = this.data.getRw(id);
      if (!rw) return null;
      return {
        jenisLabel: 'Ketua RW',
        nomorSk: rw.nomorSk || `…/SK-RW/RWJ/…`,
        nama: rw.namaKetua,
        jabatan: `Ketua Rukun Warga ${this.data.labelRw(rw.nomor)}`,
        wilayah: `${this.data.labelRw(rw.nomor)} · ${this.data.kelurahan.nama}`,
        mulai: rw.jabatanMulai,
        selesai: rw.jabatanSelesai,
        dictum:
          `Mengangkat saudara/i tersebut di atas sebagai Ketua ${this.data.labelRw(rw.nomor)} ` +
          `Kelurahan ${this.data.kelurahan.nama} untuk masa jabatan sebagaimana tercantum.`,
      };
    }

    if (jenis === 'RT') {
      const rt = this.data.getRt(id);
      if (!rt) return null;
      return {
        jenisLabel: 'Ketua RT',
        nomorSk: rt.nomorSk || `…/SK-RT/RWJ/…`,
        nama: rt.namaKetua,
        jabatan: `Ketua Rukun Tetangga ${this.data.labelWilayah(rt.id)}`,
        wilayah: `${this.data.labelWilayah(rt.id)} · ${this.data.kelurahan.nama}`,
        mulai: rt.jabatanMulai,
        selesai: rt.jabatanSelesai,
        dictum:
          `Mengangkat saudara/i tersebut di atas sebagai Ketua ${this.data.labelWilayah(rt.id)} ` +
          `Kelurahan ${this.data.kelurahan.nama} untuk masa jabatan sebagaimana tercantum.`,
      };
    }

    if (jenis === 'LMK') {
      const a = this.data.anggotaLmks().find((x) => x.id === id);
      if (!a) return null;
      const rw = this.data.getRw(a.rwId);
      const labelRw = rw ? this.data.labelRw(rw.nomor) : 'RW';
      return {
        jenisLabel: 'Perwakilan LMK',
        nomorSk: a.nomorSk || `…/LMK/RWJ/…`,
        nama: a.nama,
        jabatan: `Anggota Lembaga Musyawarah Kelurahan (perwakilan ${labelRw})`,
        wilayah: `${labelRw} · ${this.data.kelurahan.nama}`,
        mulai: undefined as string | undefined,
        selesai: undefined as string | undefined,
        dictum:
          `Menetapkan saudara/i tersebut di atas sebagai Anggota Lembaga Musyawarah Kelurahan (LMK) ` +
          `${this.data.kelurahan.nama}, mewakili ${labelRw}, sesuai ketentuan peraturan daerah yang berlaku ` +
          `(satu lembaga LMK di tingkat kelurahan; satu perwakilan tokoh masyarakat per RW).`,
      };
    }

    return null;
  });

  cetak(): void {
    window.print();
  }
}
