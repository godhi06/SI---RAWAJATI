import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/data.service';
import { KondisiAset } from '../../core/models';

@Component({
  selector: 'app-ppsu-aset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <header>
        <h1 class="page-title">Aset Gudang PPSU</h1>
        <p class="page-sub">Inventaris alat — stok dan kondisi terkini.</p>
      </header>

      <form class="card grid gap-4 md:grid-cols-2" (ngSubmit)="tambah()">
        <div>
          <label class="field-label">Kode aset</label>
          <input class="field-input" [(ngModel)]="kode" name="kode" required />
        </div>
        <div>
          <label class="field-label">Nama alat</label>
          <input class="field-input" [(ngModel)]="nama" name="nama" required />
        </div>
        <div>
          <label class="field-label">Jumlah</label>
          <input type="number" min="0" class="field-input" [(ngModel)]="jumlah" name="jumlah" required />
        </div>
        <div>
          <label class="field-label">Kondisi</label>
          <select class="field-input" [(ngModel)]="kondisi" name="kondisi">
            <option value="BAIK">Baik</option>
            <option value="RUSAK_RINGAN">Rusak ringan</option>
            <option value="RUSAK_BERAT">Rusak berat</option>
            <option value="HILANG">Hilang</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="field-label">Lokasi gudang</label>
          <input class="field-input" [(ngModel)]="lokasi" name="lokasi" />
        </div>
        <div class="md:col-span-2">
          <button class="btn-primary" type="submit">Tambah aset</button>
        </div>
      </form>

      <div class="grid gap-3">
        @for (a of data.asetPpsus(); track a.id) {
          <article class="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-ink-500">{{ a.kodeAset }}</p>
              <h2 class="text-lg font-semibold">{{ a.namaAlat }}</h2>
              <p class="text-ink-600">
                {{ a.jumlah }} {{ a.satuan }} · {{ a.lokasiGudang }} ·
                <span [class]="kondisiBadge(a.kondisi)">{{ a.kondisi }}</span>
              </p>
            </div>
            <button type="button" class="btn-secondary" (click)="markService(a.id)">Tandai alat rusak</button>
          </article>
        }
      </div>
    </div>
  `,
})
export class PpsuAsetComponent {
  readonly data = inject(DataService);

  kode = '';
  nama = '';
  jumlah = 1;
  kondisi: KondisiAset = 'BAIK';
  lokasi = 'Gudang PPSU Kelurahan Rawajati';

  tambah(): void {
    if (!this.kode || !this.nama) return;
    this.data.addAset({
      kodeAset: this.kode,
      namaAlat: this.nama,
      jumlah: this.jumlah,
      jumlahBaik: this.kondisi === 'BAIK' ? this.jumlah : 0,
      jumlahRusakRingan: this.kondisi === 'RUSAK_RINGAN' ? this.jumlah : 0,
      jumlahRusakBerat: this.kondisi === 'RUSAK_BERAT' ? this.jumlah : 0,
      jumlahHilang: this.kondisi === 'HILANG' ? this.jumlah : 0,
      satuan: 'unit',
      kondisi: this.kondisi,
      statusPinjam: 'TERSEDIA',
      lokasiGudang: this.lokasi,
    });
    this.kode = '';
    this.nama = '';
    this.jumlah = 1;
    this.kondisi = 'BAIK';
  }

  markService(id: string): void {
    this.data.laporAlatRusak(id, 'Perlu service');
  }

  kondisiBadge(k: string): string {
    if (k === 'BAIK') return 'badge-ok';
    if (k === 'HILANG' || k === 'RUSAK_BERAT') return 'badge-danger';
    return 'badge-warn';
  }
}
