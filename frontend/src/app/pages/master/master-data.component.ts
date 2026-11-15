import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { AnggotaLmk, AsetPpsu, Rt, Rw, UserAccount } from '../../core/models';

type TabMaster = 'RW' | 'RT' | 'LMK' | 'JUMANTIK' | 'PPSU' | 'ALAT' | 'TEMPLATE_DAOP';
type FieldErrRw = { nomor?: string; namaKetua?: string; telepon?: string };
type FieldErrRt = { nomor?: string; namaKetua?: string; telepon?: string; rwId?: string };
type FieldErrAkun = {
  name?: string;
  email?: string;
  password?: string;
  jabatan?: string;
  rwId?: string;
  rtId?: string;
  reguPpsu?: string;
  telepon?: string;
};

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header>
        <h1 class="page-title">
          @if (masterPenuh()) {
            Master Data · Power User
          } @else {
            Master PPSU · Ketua Bidang
          }
        </h1>
        <p class="page-sub">
          @if (masterPenuh()) {
            Akses Lurah / Admin Kelurahan: kelola RT/RW, <strong>anggota LMK</strong> (1 perwakilan/RW),
            akun petugas, stok alat, dan template DAOP.
          } @else {
            Akses Ketua Bidang PPSU: kelola <strong>akun petugas PPSU</strong> dan
            <strong>stok alat gudang</strong> (tanpa mengubah data RT/RW/Jumantik/DAOP).
          }
        </p>
      </header>

      <div class="max-w-md">
        <label class="field-label" for="master-tab">Kelola data</label>
        <select
          id="master-tab"
          class="field-input font-semibold"
          [ngModel]="tab()"
          (ngModelChange)="pilihTab($event)"
          name="master-tab"
        >
          @if (masterPenuh()) {
            <option value="RW">Ketua RW</option>
            <option value="RT">Ketua RT</option>
            <option value="LMK">Anggota LMK</option>
            <option value="JUMANTIK">Staff Jumantik</option>
          }
          <option value="PPSU">Petugas PPSU</option>
          <option value="ALAT">Stok alat PPSU</option>
          @if (masterPenuh()) {
            <option value="TEMPLATE_DAOP">Template DAOP</option>
          }
        </select>
      </div>

      @if (tab() === 'RW') {
        <section class="card space-y-3 !p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <p class="text-sm text-slate-500">{{ rws().length }} RW · klik baris untuk edit</p>
            @if (!tambahRwOpen()) {
              <button type="button" class="btn-primary !py-2 !px-3 text-sm shrink-0" (click)="mulaiTambahRw()">
                + Tambah RW
              </button>
            }
          </div>

          @if (tambahRwOpen()) {
            <article class="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3">
              <p class="mb-3 text-sm font-bold text-blue-900">Tambah Ketua RW</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="field-label" for="tambah-rw-nomor">Nomor RW</label>
                  <input
                    id="tambah-rw-nomor"
                    [class]="inputClass(!!errRw().nomor)"
                    [(ngModel)]="formRw.nomor"
                    (ngModelChange)="clearErr('rw', 'nomor')"
                    name="tambah-rw-nomor"
                    placeholder="Contoh: 05"
                    inputmode="numeric"
                  />
                  @if (errRw().nomor) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errRw().nomor }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tambah-rw-nama">Nama Ketua RW</label>
                  <input
                    id="tambah-rw-nama"
                    [class]="inputClass(!!errRw().namaKetua)"
                    [(ngModel)]="formRw.namaKetua"
                    (ngModelChange)="clearErr('rw', 'namaKetua')"
                    name="tambah-rw-nama"
                    placeholder="Nama lengkap"
                  />
                  @if (errRw().namaKetua) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errRw().namaKetua }}</p>
                  }
                </div>
                <div class="sm:col-span-2">
                  <label class="field-label" for="tambah-rw-tel">Nomor WA</label>
                  <input
                    id="tambah-rw-tel"
                    [class]="inputClass(!!errRw().telepon)"
                    [(ngModel)]="formRw.telepon"
                    (ngModelChange)="clearErr('rw', 'telepon')"
                    name="tambah-rw-tel"
                    placeholder="08xxxxxxxxxx"
                    inputmode="tel"
                  />
                  @if (errRw().telepon) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errRw().telepon }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tambah-rw-mulai">Jabatan mulai</label>
                  <input id="tambah-rw-mulai" type="date" class="field-input" [(ngModel)]="formRw.jabatanMulai" name="tambah-rw-mulai" />
                </div>
                <div>
                  <label class="field-label" for="tambah-rw-selesai">Jabatan selesai</label>
                  <input id="tambah-rw-selesai" type="date" class="field-input" [(ngModel)]="formRw.jabatanSelesai" name="tambah-rw-selesai" />
                </div>
                <div class="sm:col-span-2">
                  <label class="field-label" for="tambah-rw-sk">Nomor SK</label>
                  <input id="tambah-rw-sk" class="field-input" [(ngModel)]="formRw.nomorSk" name="tambah-rw-sk" placeholder="Contoh: 12/SK-RW/RWJ/I/2023" />
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanTambahRw()">
                  Simpan RW
                </button>
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
              </div>
            </article>
          }

          @for (rw of rws(); track rw.id) {
            <article class="rounded-xl border border-slate-200 p-3">
              @if (editRwId() === rw.id) {
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="field-label">Nomor RW</label>
                    <input
                      [class]="inputClass(!!errRw().nomor)"
                      [(ngModel)]="formRw.nomor"
                      (ngModelChange)="clearErr('rw', 'nomor')"
                      name="rw-nomor-{{ rw.id }}"
                      inputmode="numeric"
                    />
                    @if (errRw().nomor) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errRw().nomor }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Nama Ketua RW</label>
                    <input
                      [class]="inputClass(!!errRw().namaKetua)"
                      [(ngModel)]="formRw.namaKetua"
                      (ngModelChange)="clearErr('rw', 'namaKetua')"
                      name="rw-nama-{{ rw.id }}"
                    />
                    @if (errRw().namaKetua) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errRw().namaKetua }}</p>
                    }
                  </div>
                  <div class="sm:col-span-2">
                    <label class="field-label">Nomor WA</label>
                    <input
                      [class]="inputClass(!!errRw().telepon)"
                      [(ngModel)]="formRw.telepon"
                      (ngModelChange)="clearErr('rw', 'telepon')"
                      name="rw-tel-{{ rw.id }}"
                      placeholder="08xxxxxxxxxx"
                      inputmode="tel"
                    />
                    @if (errRw().telepon) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errRw().telepon }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Jabatan mulai</label>
                    <input type="date" class="field-input" [(ngModel)]="formRw.jabatanMulai" name="rw-mulai-{{ rw.id }}" />
                  </div>
                  <div>
                    <label class="field-label">Jabatan selesai</label>
                    <input type="date" class="field-input" [(ngModel)]="formRw.jabatanSelesai" name="rw-selesai-{{ rw.id }}" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="field-label">Nomor SK</label>
                    <input class="field-input" [(ngModel)]="formRw.nomorSk" name="rw-skno-{{ rw.id }}" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="field-label">Unggah file SK (PDF/foto)</label>
                    <input class="field-input" type="file" accept="application/pdf,image/*" (change)="onSkRw(rw.id, $event)" />
                    @if (rw.skFileName) {
                      <p class="mt-1 text-xs text-slate-600">Arsip asli terunggah: {{ rw.skFileName }}</p>
                    }
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanRw(rw.id)">Simpan</button>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
                </div>
              } @else {
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-bold text-slate-900">{{ data.labelRw(rw.nomor) }} · {{ rw.namaKetua }}</p>
                    <p class="text-sm text-slate-500">WA: {{ rw.telepon || '—' }}</p>
                    <p class="mt-1 text-xs text-slate-500">
                      Jabatan {{ rw.jabatanMulai || '—' }} s.d. {{ rw.jabatanSelesai || '—' }}
                      · SK {{ rw.nomorSk || '—' }}
                    </p>
                    <div class="mt-1 flex flex-wrap items-center gap-2">
                      <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="badgeJabatan(rw.jabatanSelesai)">
                        {{ data.labelStatusMasaJabatan(data.statusMasaJabatan(rw.jabatanSelesai)) }}
                      </span>
                      @if (rw.skFileName) {
                        <span class="text-xs font-semibold text-slate-500">Arsip SK ada</span>
                      }
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <a
                      class="btn-primary !py-2 !px-3 text-sm"
                      [routerLink]="['/app/master/sk-cetak']"
                      [queryParams]="{ jenis: 'RW', id: rw.id }"
                    >
                      Cetak SK
                    </a>
                    <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="mulaiEditRw(rw)">
                      Edit
                    </button>
                  </div>
                </div>
              }
            </article>
          }
        </section>
      }

      @if (tab() === 'RT') {
        <section class="card space-y-3 !p-4">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div class="max-w-xs flex-1">
              <label class="field-label" for="filter-rw-rt">Filter RW</label>
              <select id="filter-rw-rt" class="field-input" [ngModel]="filterRwId()" (ngModelChange)="filterRwId.set($event)">
                <option value="">Semua RW</option>
                @for (rw of rws(); track rw.id) {
                  <option [value]="rw.id">{{ data.labelRw(rw.nomor) }}</option>
                }
              </select>
            </div>
            @if (!tambahRtOpen()) {
              <button type="button" class="btn-primary !py-2 !px-3 text-sm shrink-0" (click)="mulaiTambahRt()">
                + Tambah RT
              </button>
            }
          </div>
          <p class="text-sm text-slate-500">{{ rtsFiltered().length }} RT</p>

          @if (tambahRtOpen()) {
            <article class="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3">
              <p class="mb-3 text-sm font-bold text-blue-900">Tambah Ketua RT</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="field-label" for="tambah-rt-nomor">Nomor RT</label>
                  <input
                    id="tambah-rt-nomor"
                    [class]="inputClass(!!errRt().nomor)"
                    [(ngModel)]="formRt.nomor"
                    (ngModelChange)="clearErr('rt', 'nomor')"
                    name="tambah-rt-nomor"
                    placeholder="Contoh: 04"
                    inputmode="numeric"
                  />
                  @if (errRt().nomor) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errRt().nomor }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tambah-rt-rw">RW</label>
                  <select
                    id="tambah-rt-rw"
                    [class]="inputClass(!!errRt().rwId)"
                    [(ngModel)]="formRt.rwId"
                    (ngModelChange)="clearErr('rt', 'rwId')"
                    name="tambah-rt-rw"
                  >
                    <option value="" disabled>Pilih RW</option>
                    @for (rw of rws(); track rw.id) {
                      <option [value]="rw.id">{{ data.labelRw(rw.nomor) }}</option>
                    }
                  </select>
                  @if (errRt().rwId) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errRt().rwId }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tambah-rt-nama">Nama Ketua RT</label>
                  <input
                    id="tambah-rt-nama"
                    [class]="inputClass(!!errRt().namaKetua)"
                    [(ngModel)]="formRt.namaKetua"
                    (ngModelChange)="clearErr('rt', 'namaKetua')"
                    name="tambah-rt-nama"
                    placeholder="Nama lengkap"
                  />
                  @if (errRt().namaKetua) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errRt().namaKetua }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tambah-rt-tel">Nomor WA</label>
                  <input
                    id="tambah-rt-tel"
                    [class]="inputClass(!!errRt().telepon)"
                    [(ngModel)]="formRt.telepon"
                    (ngModelChange)="clearErr('rt', 'telepon')"
                    name="tambah-rt-tel"
                    placeholder="08xxxxxxxxxx"
                    inputmode="tel"
                  />
                  @if (errRt().telepon) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errRt().telepon }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tambah-rt-mulai">Jabatan mulai</label>
                  <input id="tambah-rt-mulai" type="date" class="field-input" [(ngModel)]="formRt.jabatanMulai" name="tambah-rt-mulai" />
                </div>
                <div>
                  <label class="field-label" for="tambah-rt-selesai">Jabatan selesai</label>
                  <input id="tambah-rt-selesai" type="date" class="field-input" [(ngModel)]="formRt.jabatanSelesai" name="tambah-rt-selesai" />
                </div>
                <div class="sm:col-span-2">
                  <label class="field-label" for="tambah-rt-sk">Nomor SK</label>
                  <input id="tambah-rt-sk" class="field-input" [(ngModel)]="formRt.nomorSk" name="tambah-rt-sk" />
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanTambahRt()">
                  Simpan RT
                </button>
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
              </div>
            </article>
          }

          @for (rt of rtsFiltered(); track rt.id) {
            <article class="rounded-xl border border-slate-200 p-3">
              @if (editRtId() === rt.id) {
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="field-label">Nomor RT</label>
                    <input
                      [class]="inputClass(!!errRt().nomor)"
                      [(ngModel)]="formRt.nomor"
                      (ngModelChange)="clearErr('rt', 'nomor')"
                      name="rt-nomor-{{ rt.id }}"
                      inputmode="numeric"
                    />
                    @if (errRt().nomor) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errRt().nomor }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">RW</label>
                    <select
                      [class]="inputClass(!!errRt().rwId)"
                      [(ngModel)]="formRt.rwId"
                      (ngModelChange)="clearErr('rt', 'rwId')"
                      name="rt-rw-{{ rt.id }}"
                    >
                      @for (rw of rws(); track rw.id) {
                        <option [value]="rw.id">{{ data.labelRw(rw.nomor) }}</option>
                      }
                    </select>
                    @if (errRt().rwId) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errRt().rwId }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Nama Ketua RT</label>
                    <input
                      [class]="inputClass(!!errRt().namaKetua)"
                      [(ngModel)]="formRt.namaKetua"
                      (ngModelChange)="clearErr('rt', 'namaKetua')"
                      name="rt-nama-{{ rt.id }}"
                    />
                    @if (errRt().namaKetua) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errRt().namaKetua }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Nomor WA</label>
                    <input
                      [class]="inputClass(!!errRt().telepon)"
                      [(ngModel)]="formRt.telepon"
                      (ngModelChange)="clearErr('rt', 'telepon')"
                      name="rt-tel-{{ rt.id }}"
                      placeholder="08xxxxxxxxxx"
                      inputmode="tel"
                    />
                    @if (errRt().telepon) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errRt().telepon }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Jabatan mulai</label>
                    <input type="date" class="field-input" [(ngModel)]="formRt.jabatanMulai" name="rt-mulai-{{ rt.id }}" />
                  </div>
                  <div>
                    <label class="field-label">Jabatan selesai</label>
                    <input type="date" class="field-input" [(ngModel)]="formRt.jabatanSelesai" name="rt-selesai-{{ rt.id }}" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="field-label">Nomor SK</label>
                    <input class="field-input" [(ngModel)]="formRt.nomorSk" name="rt-skno-{{ rt.id }}" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="field-label">Unggah file SK (PDF/foto)</label>
                    <input class="field-input" type="file" accept="application/pdf,image/*" (change)="onSkRt(rt.id, $event)" />
                    @if (rt.skFileName) {
                      <p class="mt-1 text-xs text-slate-600">Arsip asli terunggah: {{ rt.skFileName }}</p>
                    }
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanRt(rt.id)">Simpan</button>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
                </div>
              } @else {
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-bold text-slate-900">{{ data.labelWilayah(rt.id) }} · {{ rt.namaKetua }}</p>
                    <p class="text-sm text-slate-500">WA: {{ rt.telepon || '—' }}</p>
                    <p class="mt-1 text-xs text-slate-500">
                      Jabatan {{ rt.jabatanMulai || '—' }} s.d. {{ rt.jabatanSelesai || '—' }}
                      · SK {{ rt.nomorSk || '—' }}
                    </p>
                    <div class="mt-1 flex flex-wrap items-center gap-2">
                      <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="badgeJabatan(rt.jabatanSelesai)">
                        {{ data.labelStatusMasaJabatan(data.statusMasaJabatan(rt.jabatanSelesai)) }}
                      </span>
                      @if (rt.skFileName) {
                        <span class="text-xs font-semibold text-slate-500">Arsip SK ada</span>
                      }
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <a
                      class="btn-primary !py-2 !px-3 text-sm"
                      [routerLink]="['/app/master/sk-cetak']"
                      [queryParams]="{ jenis: 'RT', id: rt.id }"
                    >
                      Cetak SK
                    </a>
                    <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="mulaiEditRt(rt)">
                      Edit
                    </button>
                  </div>
                </div>
              }
            </article>
          }
        </section>
      }

      @if (tab() === 'LMK') {
        <section class="card space-y-3 !p-4">
          <div>
            <p class="text-sm font-semibold text-slate-800">Lembaga Musyawarah Kelurahan (LMK)</p>
            <p class="mt-1 text-xs text-slate-500">
              Satu lembaga di tingkat kelurahan (mitra Lurah). Anggota = 1 tokoh masyarakat per RW
              (Perda DKI 5/2010 jo. 4/2024) — bukan struktur Ketua/Sekretaris/Bendahara.
            </p>
            <p class="mt-2 text-sm text-slate-500">
              {{ data.anggotaLmksSorted().length }} / {{ rws().length }} RW sudah punya perwakilan
            </p>
          </div>

          <article class="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3">
            <p class="mb-3 text-sm font-bold text-blue-900">Tambah / isi perwakilan</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="field-label" for="lmk-rw">RW yang diwakili</label>
                <select id="lmk-rw" class="field-input" [(ngModel)]="formLmk.rwId" name="lmk-rw">
                  <option value="">— Pilih RW —</option>
                  @for (rw of rwsTanpaLmk(); track rw.id) {
                    <option [value]="rw.id">{{ data.labelRw(rw.nomor) }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="field-label" for="lmk-nama">Nama tokoh / perwakilan</label>
                <input id="lmk-nama" class="field-input" [(ngModel)]="formLmk.nama" name="lmk-nama" />
              </div>
              <div>
                <label class="field-label" for="lmk-tel">No. WA</label>
                <input id="lmk-tel" class="field-input" [(ngModel)]="formLmk.telepon" name="lmk-tel" placeholder="08…" />
              </div>
              <div>
                <label class="field-label" for="lmk-sk">No. SK / keterangan (opsional)</label>
                <input id="lmk-sk" class="field-input" [(ngModel)]="formLmk.nomorSk" name="lmk-sk" />
              </div>
            </div>
            <div class="mt-3">
              <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanTambahLmk()">Simpan</button>
            </div>
          </article>

          @for (a of data.anggotaLmksSorted(); track a.id) {
            <article class="rounded-xl border border-slate-200 p-3">
              @if (editLmkId() === a.id) {
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <p class="text-sm font-bold text-slate-800">{{ data.labelRw(data.getRw(a.rwId)?.nomor || '') }}</p>
                  </div>
                  <div>
                    <label class="field-label">Nama</label>
                    <input class="field-input" [(ngModel)]="formLmk.nama" name="lmk-edit-nama-{{ a.id }}" />
                  </div>
                  <div>
                    <label class="field-label">No. WA</label>
                    <input class="field-input" [(ngModel)]="formLmk.telepon" name="lmk-edit-tel-{{ a.id }}" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="field-label">No. SK</label>
                    <input class="field-input" [(ngModel)]="formLmk.nomorSk" name="lmk-edit-sk-{{ a.id }}" />
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanLmk(a.id)">Simpan</button>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
                </div>
              } @else {
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-bold text-slate-900">{{ a.nama }}</p>
                    <p class="text-sm text-slate-600">
                      Perwakilan LMK · {{ data.labelRw(data.getRw(a.rwId)?.nomor || '') }}
                    </p>
                    <p class="text-xs text-slate-500">
                      WA {{ a.telepon || '—' }} · SK {{ a.nomorSk || '—' }}
                      @if (!a.isActive) {
                        · <span class="font-semibold text-rose-600">nonaktif</span>
                      }
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <a
                      class="btn-primary !py-2 !px-3 text-sm"
                      [routerLink]="['/app/master/sk-cetak']"
                      [queryParams]="{ jenis: 'LMK', id: a.id }"
                    >
                      Cetak SK
                    </a>
                    <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="mulaiEditLmk(a)">
                      Edit
                    </button>
                  </div>
                </div>
              }
            </article>
          } @empty {
            <p class="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              Belum ada anggota LMK.
            </p>
          }
        </section>
      }

      @if (tab() === 'JUMANTIK') {
        <section class="card space-y-3 !p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <p class="text-sm text-slate-500">
              {{ jumantiks().length }} kader · akun login input PSN per RT
            </p>
            @if (!tambahJumantikOpen()) {
              <button type="button" class="btn-primary !py-2 !px-3 text-sm shrink-0" (click)="mulaiTambahJumantik()">
                + Tambah Jumantik
              </button>
            }
          </div>

          @if (tambahJumantikOpen()) {
            <article class="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3">
              <p class="mb-3 text-sm font-bold text-blue-900">Tambah Staff Jumantik</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="field-label" for="tj-nama">Nama lengkap</label>
                  <input
                    id="tj-nama"
                    [class]="inputClass(!!errAkun().name)"
                    [(ngModel)]="formAkun.name"
                    (ngModelChange)="clearErrAkun('name')"
                    name="tj-nama"
                    placeholder="Nama kader"
                  />
                  @if (errAkun().name) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().name }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tj-email">Email login</label>
                  <input
                    id="tj-email"
                    type="email"
                    [class]="inputClass(!!errAkun().email)"
                    [(ngModel)]="formAkun.email"
                    (ngModelChange)="clearErrAkun('email')"
                    name="tj-email"
                    placeholder="jumantik.rt01@kelurahan.id"
                  />
                  @if (errAkun().email) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().email }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tj-pass">Kata sandi</label>
                  <input
                    id="tj-pass"
                    type="text"
                    [class]="inputClass(!!errAkun().password)"
                    [(ngModel)]="formAkun.password"
                    (ngModelChange)="clearErrAkun('password')"
                    name="tj-pass"
                    placeholder="Minimal 6 karakter"
                  />
                  @if (errAkun().password) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().password }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tj-rw">RW wilayah</label>
                  <select
                    id="tj-rw"
                    [class]="inputClass(!!errAkun().rwId)"
                    [ngModel]="formAkun.rwId"
                    (ngModelChange)="onAkunRwChange($event)"
                    name="tj-rw"
                  >
                    <option value="" disabled>Pilih RW</option>
                    @for (rw of rws(); track rw.id) {
                      <option [value]="rw.id">{{ data.labelRw(rw.nomor) }}</option>
                    }
                  </select>
                  @if (errAkun().rwId) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().rwId }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tj-rt">RT wilayah</label>
                  <select
                    id="tj-rt"
                    [class]="inputClass(!!errAkun().rtId)"
                    [ngModel]="formAkun.rtId"
                    (ngModelChange)="onAkunRtChange($event)"
                    name="tj-rt"
                  >
                    <option value="" disabled>Pilih RT</option>
                    @for (rt of rtsForAkunRw(); track rt.id) {
                      <option [value]="rt.id">{{ data.labelWilayah(rt.id) }}</option>
                    }
                  </select>
                  @if (errAkun().rtId) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().rtId }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tj-jab">Jabatan</label>
                  <input
                    id="tj-jab"
                    [class]="inputClass(!!errAkun().jabatan)"
                    [(ngModel)]="formAkun.jabatan"
                    (ngModelChange)="clearErrAkun('jabatan')"
                    name="tj-jab"
                    placeholder="Kader Jumantik …"
                  />
                  @if (errAkun().jabatan) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().jabatan }}</p>
                  }
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanTambahJumantik()">
                  Simpan akun
                </button>
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
              </div>
            </article>
          }

          @for (u of jumantiks(); track u.id) {
            <article class="rounded-xl border border-slate-200 p-3">
              @if (editAkunId() === u.id) {
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="field-label">Nama lengkap</label>
                    <input
                      [class]="inputClass(!!errAkun().name)"
                      [(ngModel)]="formAkun.name"
                      (ngModelChange)="clearErrAkun('name')"
                      name="ej-nama-{{ u.id }}"
                    />
                    @if (errAkun().name) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().name }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Email login</label>
                    <input
                      type="email"
                      [class]="inputClass(!!errAkun().email)"
                      [(ngModel)]="formAkun.email"
                      (ngModelChange)="clearErrAkun('email')"
                      name="ej-email-{{ u.id }}"
                    />
                    @if (errAkun().email) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().email }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Kata sandi</label>
                    <input
                      type="text"
                      [class]="inputClass(!!errAkun().password)"
                      [(ngModel)]="formAkun.password"
                      (ngModelChange)="clearErrAkun('password')"
                      name="ej-pass-{{ u.id }}"
                    />
                    @if (errAkun().password) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().password }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">RW wilayah</label>
                    <select
                      [class]="inputClass(!!errAkun().rwId)"
                      [ngModel]="formAkun.rwId"
                      (ngModelChange)="onAkunRwChange($event)"
                      name="ej-rw-{{ u.id }}"
                    >
                      @for (rw of rws(); track rw.id) {
                        <option [value]="rw.id">{{ data.labelRw(rw.nomor) }}</option>
                      }
                    </select>
                    @if (errAkun().rwId) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().rwId }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">RT wilayah</label>
                    <select
                      [class]="inputClass(!!errAkun().rtId)"
                      [ngModel]="formAkun.rtId"
                      (ngModelChange)="onAkunRtChange($event)"
                      name="ej-rt-{{ u.id }}"
                    >
                      @for (rt of rtsForAkunRw(); track rt.id) {
                        <option [value]="rt.id">{{ data.labelWilayah(rt.id) }}</option>
                      }
                    </select>
                    @if (errAkun().rtId) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().rtId }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Jabatan</label>
                    <input
                      [class]="inputClass(!!errAkun().jabatan)"
                      [(ngModel)]="formAkun.jabatan"
                      (ngModelChange)="clearErrAkun('jabatan')"
                      name="ej-jab-{{ u.id }}"
                    />
                    @if (errAkun().jabatan) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().jabatan }}</p>
                    }
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanEditJumantik(u.id)">
                    Simpan
                  </button>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
                </div>
              } @else {
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-bold text-slate-900">{{ u.name }}</p>
                    <p class="text-sm text-slate-500">
                      {{ u.jabatan }} · {{ u.rtId ? data.labelWilayah(u.rtId) : '—' }}
                    </p>
                    <p class="text-xs text-slate-400">{{ u.email }}</p>
                  </div>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="mulaiEditJumantik(u)">
                    Edit akun
                  </button>
                </div>
              }
            </article>
          }
        </section>
      }

      @if (tab() === 'PPSU') {
        <section class="card space-y-3 !p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <p class="text-sm text-slate-500">
              {{ ppsuStaffFiltered().length }} / {{ ppsuStaff().length }} petugas · akun login laporan lapangan
            </p>
            @if (!tambahPpsuOpen()) {
              <button type="button" class="btn-primary !py-2 !px-3 text-sm shrink-0" (click)="mulaiTambahPpsu()">
                + Tambah petugas
              </button>
            }
          </div>

          <div class="max-w-md">
            <label class="field-label" for="cari-ppsu">Cari nama / email / WA / regu</label>
            <input
              id="cari-ppsu"
              class="field-input"
              [ngModel]="cariPpsu()"
              (ngModelChange)="cariPpsu.set($event)"
              name="cari-ppsu"
              placeholder="Contoh: Joko, 0812, Zona A…"
            />
          </div>

          @if (tambahPpsuOpen()) {
            <article class="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3">
              <p class="mb-3 text-sm font-bold text-blue-900">Tambah Petugas PPSU</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="field-label" for="tp-nama">Nama lengkap</label>
                  <input
                    id="tp-nama"
                    [class]="inputClass(!!errAkun().name)"
                    [(ngModel)]="formAkun.name"
                    (ngModelChange)="clearErrAkun('name')"
                    name="tp-nama"
                    placeholder="Nama petugas"
                  />
                  @if (errAkun().name) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().name }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tp-tel">Nomor WA / HP</label>
                  <input
                    id="tp-tel"
                    [class]="inputClass(!!errAkun().telepon)"
                    [(ngModel)]="formAkun.telepon"
                    (ngModelChange)="clearErrAkun('telepon')"
                    name="tp-tel"
                    placeholder="08xxxxxxxxxx"
                    inputmode="tel"
                  />
                  @if (errAkun().telepon) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().telepon }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tp-email">Email login</label>
                  <input
                    id="tp-email"
                    type="email"
                    [class]="inputClass(!!errAkun().email)"
                    [(ngModel)]="formAkun.email"
                    (ngModelChange)="clearErrAkun('email')"
                    name="tp-email"
                    placeholder="ppsu.zona@kelurahan.id"
                  />
                  @if (errAkun().email) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().email }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tp-pass">Kata sandi</label>
                  <input
                    id="tp-pass"
                    type="text"
                    [class]="inputClass(!!errAkun().password)"
                    [(ngModel)]="formAkun.password"
                    (ngModelChange)="clearErrAkun('password')"
                    name="tp-pass"
                    placeholder="Minimal 6 karakter"
                  />
                  @if (errAkun().password) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().password }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tp-jab">Jabatan</label>
                  <select
                    id="tp-jab"
                    [class]="inputClass(!!errAkun().jabatan)"
                    [(ngModel)]="formAkun.jabatan"
                    (ngModelChange)="clearErrAkun('jabatan')"
                    name="tp-jab"
                  >
                    <option value="Anggota / Petugas PPSU Lapangan">Anggota / Petugas PPSU Lapangan</option>
                    <option value="Koordinator / Ketua Bidang PPSU">Koordinator / Ketua Bidang PPSU</option>
                  </select>
                  @if (errAkun().jabatan) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().jabatan }}</p>
                  }
                </div>
                <div>
                  <label class="field-label" for="tp-regu">Regu / zona</label>
                  <select
                    id="tp-regu"
                    [class]="inputClass(!!errAkun().reguPpsu)"
                    [(ngModel)]="formAkun.reguPpsu"
                    (ngModelChange)="clearErrAkun('reguPpsu')"
                    name="tp-regu"
                  >
                    @for (r of reguPpsuOptions; track r) {
                      <option [value]="r">{{ r }}</option>
                    }
                  </select>
                  @if (errAkun().reguPpsu) {
                    <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().reguPpsu }}</p>
                  }
                </div>
                <div class="sm:col-span-2">
                  <label class="field-label" for="tp-cat">Catatan (opsional)</label>
                  <input
                    id="tp-cat"
                    class="field-input"
                    [(ngModel)]="formAkun.catatan"
                    name="tp-cat"
                    placeholder="Field tambahan bila nanti dibutuhkan"
                  />
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanTambahPpsu()">
                  Simpan akun
                </button>
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
              </div>
            </article>
          }

          @for (u of ppsuStaffFiltered(); track u.id) {
            <article class="rounded-xl border border-slate-200 p-3">
              @if (editAkunId() === u.id) {
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="field-label">Nama lengkap</label>
                    <input
                      [class]="inputClass(!!errAkun().name)"
                      [(ngModel)]="formAkun.name"
                      (ngModelChange)="clearErrAkun('name')"
                      name="ep-nama-{{ u.id }}"
                    />
                    @if (errAkun().name) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().name }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Nomor WA / HP</label>
                    <input
                      [class]="inputClass(!!errAkun().telepon)"
                      [(ngModel)]="formAkun.telepon"
                      (ngModelChange)="clearErrAkun('telepon')"
                      name="ep-tel-{{ u.id }}"
                      placeholder="08xxxxxxxxxx"
                      inputmode="tel"
                    />
                    @if (errAkun().telepon) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().telepon }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Email login</label>
                    <input
                      type="email"
                      [class]="inputClass(!!errAkun().email)"
                      [(ngModel)]="formAkun.email"
                      (ngModelChange)="clearErrAkun('email')"
                      name="ep-email-{{ u.id }}"
                    />
                    @if (errAkun().email) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().email }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Kata sandi</label>
                    <input
                      type="text"
                      [class]="inputClass(!!errAkun().password)"
                      [(ngModel)]="formAkun.password"
                      (ngModelChange)="clearErrAkun('password')"
                      name="ep-pass-{{ u.id }}"
                    />
                    @if (errAkun().password) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().password }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Jabatan</label>
                    <select
                      [class]="inputClass(!!errAkun().jabatan)"
                      [(ngModel)]="formAkun.jabatan"
                      (ngModelChange)="clearErrAkun('jabatan')"
                      name="ep-jab-{{ u.id }}"
                    >
                      <option value="Anggota / Petugas PPSU Lapangan">Anggota / Petugas PPSU Lapangan</option>
                      <option value="Koordinator / Ketua Bidang PPSU">Koordinator / Ketua Bidang PPSU</option>
                    </select>
                    @if (errAkun().jabatan) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().jabatan }}</p>
                    }
                  </div>
                  <div>
                    <label class="field-label">Regu / zona</label>
                    <select
                      [class]="inputClass(!!errAkun().reguPpsu)"
                      [(ngModel)]="formAkun.reguPpsu"
                      (ngModelChange)="clearErrAkun('reguPpsu')"
                      name="ep-regu-{{ u.id }}"
                    >
                      @for (r of reguPpsuOptions; track r) {
                        <option [value]="r">{{ r }}</option>
                      }
                    </select>
                    @if (errAkun().reguPpsu) {
                      <p class="mt-1 text-xs font-medium text-rose-600">{{ errAkun().reguPpsu }}</p>
                    }
                  </div>
                  <div class="sm:col-span-2">
                    <label class="field-label">Catatan (opsional)</label>
                    <input
                      class="field-input"
                      [(ngModel)]="formAkun.catatan"
                      name="ep-cat-{{ u.id }}"
                      placeholder="Field tambahan bila nanti dibutuhkan"
                    />
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanEditPpsu(u.id)">
                    Simpan
                  </button>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
                </div>
              } @else if (detailPpsuId() === u.id) {
                <div class="space-y-3">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Detail petugas</p>
                      <p class="text-lg font-bold text-slate-900">{{ u.name }}</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="mulaiEditPpsu(u)">
                        Edit akun
                      </button>
                      <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="tutupDetailPpsu()">
                        Tutup
                      </button>
                    </div>
                  </div>
                  <dl class="grid gap-2 sm:grid-cols-2 text-sm">
                    <div class="rounded-lg bg-slate-50 px-3 py-2">
                      <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Jabatan</dt>
                      <dd class="mt-0.5 font-medium text-slate-900">{{ u.jabatan }}</dd>
                    </div>
                    <div class="rounded-lg bg-slate-50 px-3 py-2">
                      <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nomor WA / HP</dt>
                      <dd class="mt-0.5 font-medium text-slate-900">{{ u.telepon || '—' }}</dd>
                    </div>
                    <div class="rounded-lg bg-slate-50 px-3 py-2">
                      <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Email login</dt>
                      <dd class="mt-0.5 font-medium text-slate-900 break-all">{{ u.email }}</dd>
                    </div>
                    <div class="rounded-lg bg-slate-50 px-3 py-2">
                      <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Regu / zona</dt>
                      <dd class="mt-0.5 font-medium text-slate-900">{{ u.reguPpsu || '—' }}</dd>
                    </div>
                    <div class="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">
                      <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Catatan</dt>
                      <dd class="mt-0.5 font-medium text-slate-900">{{ u.catatan || '—' }}</dd>
                    </div>
                  </dl>
                </div>
              } @else {
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-bold text-slate-900">{{ u.name }}</p>
                    <p class="text-sm text-slate-500">{{ u.jabatan }}</p>
                    <p class="text-xs text-slate-400">
                      {{ u.telepon || 'WA —' }} · {{ u.email }} · {{ u.reguPpsu || 'Tanpa regu' }}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="lihatDetailPpsu(u)">
                      Lihat detail
                    </button>
                    <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="mulaiEditPpsu(u)">
                      Edit akun
                    </button>
                  </div>
                </div>
              }
            </article>
          } @empty {
            <p class="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
              Tidak ada petugas yang cocok dengan pencarian.
            </p>
          }
        </section>
      }

      @if (tab() === 'ALAT') {
        <section class="card space-y-3 !p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <p class="text-sm text-slate-500">
              Pecah stok per kondisi. Contoh: total 10 → Baik 6 · Rusak ringan 4. Total dihitung otomatis.
            </p>
            @if (!tambahAsetOpen()) {
              <button type="button" class="btn-primary !py-2 !px-3 text-sm shrink-0" (click)="mulaiTambahAset()">
                + Tambah alat
              </button>
            }
          </div>

          @if (tambahAsetOpen()) {
            <article class="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3">
              <p class="mb-3 text-sm font-bold text-blue-900">Tambah alat baru</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label class="field-label" for="tambah-nama">Nama alat</label>
                  <input
                    id="tambah-nama"
                    class="field-input"
                    [(ngModel)]="formAset.namaAlat"
                    name="tambah-nama"
                    placeholder="Contoh: Sekop"
                  />
                </div>
                <div>
                  <label class="field-label" for="tambah-kode">Kode aset</label>
                  <input
                    id="tambah-kode"
                    class="field-input"
                    [(ngModel)]="formAset.kodeAset"
                    name="tambah-kode"
                    placeholder="Otomatis jika kosong"
                  />
                </div>
                <div>
                  <label class="field-label" for="tambah-sat">Satuan</label>
                  <input id="tambah-sat" class="field-input" [(ngModel)]="formAset.satuan" name="tambah-sat" />
                </div>
                <div class="sm:col-span-2">
                  <label class="field-label" for="tambah-lokasi">Lokasi gudang</label>
                  <input
                    id="tambah-lokasi"
                    class="field-input"
                    [(ngModel)]="formAset.lokasiGudang"
                    name="tambah-lokasi"
                  />
                </div>
                <div class="rounded-xl bg-white px-3 py-2 sm:col-span-2">
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Rincian stok</p>
                  <div class="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label class="field-label" for="tambah-baik">Baik</label>
                      <input
                        id="tambah-baik"
                        class="field-input"
                        type="number"
                        min="0"
                        [(ngModel)]="formAset.jumlahBaik"
                        name="tambah-baik"
                      />
                    </div>
                    <div>
                      <label class="field-label" for="tambah-rr">Rusak ringan</label>
                      <input
                        id="tambah-rr"
                        class="field-input"
                        type="number"
                        min="0"
                        [(ngModel)]="formAset.jumlahRusakRingan"
                        name="tambah-rr"
                      />
                    </div>
                    <div>
                      <label class="field-label" for="tambah-rb">Rusak berat</label>
                      <input
                        id="tambah-rb"
                        class="field-input"
                        type="number"
                        min="0"
                        [(ngModel)]="formAset.jumlahRusakBerat"
                        name="tambah-rb"
                      />
                    </div>
                    <div>
                      <label class="field-label" for="tambah-hilang">Hilang</label>
                      <input
                        id="tambah-hilang"
                        class="field-input"
                        type="number"
                        min="0"
                        [(ngModel)]="formAset.jumlahHilang"
                        name="tambah-hilang"
                      />
                    </div>
                  </div>
                  <p class="mt-2 text-sm font-semibold text-slate-800">
                    Total: {{ totalFormAset() }} {{ formAset.satuan || 'unit' }}
                  </p>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanTambahAset()">
                  Simpan alat
                </button>
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
              </div>
            </article>
          }

          @for (a of alat(); track a.id) {
            <article class="rounded-xl border border-slate-200 p-3">
              @if (editAsetId() === a.id) {
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label class="field-label">Nama alat</label>
                    <input class="field-input" [(ngModel)]="formAset.namaAlat" name="aset-nama-{{ a.id }}" />
                  </div>
                  <div>
                    <label class="field-label">Satuan</label>
                    <input class="field-input" [(ngModel)]="formAset.satuan" name="aset-sat-{{ a.id }}" />
                  </div>
                  <div class="rounded-xl bg-slate-50 px-3 py-2 sm:col-span-2">
                    <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Rincian stok</p>
                    <div class="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <label class="field-label" for="baik-{{ a.id }}">Baik</label>
                        <input
                          id="baik-{{ a.id }}"
                          class="field-input"
                          type="number"
                          min="0"
                          [(ngModel)]="formAset.jumlahBaik"
                          name="aset-baik-{{ a.id }}"
                        />
                      </div>
                      <div>
                        <label class="field-label" for="rr-{{ a.id }}">Rusak ringan</label>
                        <input
                          id="rr-{{ a.id }}"
                          class="field-input"
                          type="number"
                          min="0"
                          [(ngModel)]="formAset.jumlahRusakRingan"
                          name="aset-rr-{{ a.id }}"
                        />
                      </div>
                      <div>
                        <label class="field-label" for="rb-{{ a.id }}">Rusak berat</label>
                        <input
                          id="rb-{{ a.id }}"
                          class="field-input"
                          type="number"
                          min="0"
                          [(ngModel)]="formAset.jumlahRusakBerat"
                          name="aset-rb-{{ a.id }}"
                        />
                      </div>
                      <div>
                        <label class="field-label" for="hilang-{{ a.id }}">Hilang</label>
                        <input
                          id="hilang-{{ a.id }}"
                          class="field-input"
                          type="number"
                          min="0"
                          [(ngModel)]="formAset.jumlahHilang"
                          name="aset-hilang-{{ a.id }}"
                        />
                      </div>
                    </div>
                    <p class="mt-2 text-sm font-semibold text-slate-800">
                      Total: {{ totalFormAset() }} {{ formAset.satuan || 'unit' }}
                    </p>
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn-primary !py-2 !px-3 text-sm" (click)="simpanAset(a.id)">
                    Simpan
                  </button>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="batalEdit()">Batal</button>
                </div>
              } @else {
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="font-bold text-slate-900">{{ a.namaAlat }}</p>
                    <p class="text-sm text-slate-500">
                      {{ a.kodeAset }} ·
                      <strong class="text-slate-800">{{ a.jumlah }} {{ a.satuan }}</strong>
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      Baik {{ a.jumlahBaik || 0 }} · Rusak ringan {{ a.jumlahRusakRingan || 0 }} · Rusak berat
                      {{ a.jumlahRusakBerat || 0 }} · Hilang {{ a.jumlahHilang || 0 }}
                    </p>
                  </div>
                  <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="mulaiEditAset(a)">
                    Edit stok
                  </button>
                </div>
              }
            </article>
          }
        </section>
      }

      @if (tab() === 'TEMPLATE_DAOP') {
        <section class="card space-y-4 !p-4">
          <div>
            <h2 class="text-base font-bold text-slate-900">Template kosong Laporan DAOP</h2>
            <p class="mt-1 text-sm text-slate-500">
              Lurah / staf kelurahan mengunggah file Word resmi (kosongan). File inilah yang diunduh
              Ketua RT &amp; Ketua RW untuk diisi, TTD, dicetak, lalu distempel basah.
            </p>
          </div>

          @if (data.templateDaopKosong(); as tpl) {
            <article class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p class="text-xs font-bold uppercase tracking-wide text-emerald-800">Template aktif</p>
              <p class="mt-1 font-bold text-slate-900">{{ tpl.fileName }}</p>
              <p class="mt-1 text-sm text-slate-600">
                Diunggah {{ formatWaktu(tpl.uploadedAt) }} · oleh {{ tpl.uploadedBy }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="unduhTemplateDaop()">
                  Unduh / cek file
                </button>
                <button type="button" class="btn-secondary !py-2 !px-3 text-sm" (click)="hapusTemplateDaop()">
                  Hapus template
                </button>
                <label class="btn-primary !py-2 !px-3 text-sm cursor-pointer">
                  Ganti file
                  <input
                    type="file"
                    class="hidden"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    (change)="onPilihTemplateDaop($event)"
                  />
                </label>
              </div>
            </article>
          } @else {
            <article class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-800">Belum ada template resmi</p>
              <p class="mt-1 text-sm text-slate-500">
                Sementara Ketua RT/RW mengunduh form demo sistem. Unggah Word kosong resmi agar semua
                memakai template seragam.
              </p>
              <label class="btn-primary mt-3 inline-flex !py-2 !px-3 text-sm cursor-pointer">
                + Upload template Word
                <input
                  type="file"
                  class="hidden"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  (change)="onPilihTemplateDaop($event)"
                />
              </label>
            </article>
          }

          <div class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <p class="font-semibold text-slate-800">Alur pemakaian</p>
            <ol class="mt-2 list-decimal space-y-1 pl-5">
              <li>Staf/Lurah unggah template kosong DAOP (.doc / .docx)</li>
              <li>Ketua RT / Ketua RW unduh template itu dari menu Laporan DAOP</li>
              <li>Isi &amp; TTD di Word → cetak → stempel basah → upload scan</li>
            </ol>
          </div>
        </section>
      }
    </div>
  `,
})
export class MasterDataComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly masterPenuh = computed(() => this.auth.canAccessMasterFull());
  readonly tab = signal<TabMaster>(this.auth.canAccessMasterFull() ? 'RW' : 'PPSU');
  readonly filterRwId = signal('');
  readonly editRwId = signal<string | null>(null);
  readonly editRtId = signal<string | null>(null);
  readonly editAsetId = signal<string | null>(null);
  readonly tambahRwOpen = signal(false);
  readonly tambahRtOpen = signal(false);
  readonly tambahJumantikOpen = signal(false);
  readonly tambahPpsuOpen = signal(false);
  readonly tambahAsetOpen = signal(false);
  readonly editAkunId = signal<string | null>(null);
  readonly detailPpsuId = signal<string | null>(null);
  readonly cariPpsu = signal('');
  /** Track RW pilihan akun agar daftar RT ikut reaktif. */
  readonly akunRwId = signal('');
  readonly errRw = signal<FieldErrRw>({});
  readonly errRt = signal<FieldErrRt>({});
  readonly errAkun = signal<FieldErrAkun>({});

  readonly reguPpsuOptions = [
    'Regu Zona A (RW 01–03)',
    'Regu Zona B (RW 07)',
    'Regu Zona C (RW 11)',
    'Koordinator semua zona',
  ];

  formRw = {
    nomor: '',
    namaKetua: '',
    telepon: '',
    jabatanMulai: '',
    jabatanSelesai: '',
    nomorSk: '',
  };
  formRt = {
    nomor: '',
    namaKetua: '',
    telepon: '',
    rwId: '',
    jabatanMulai: '',
    jabatanSelesai: '',
    nomorSk: '',
  };
  formLmk = { rwId: '', nama: '', telepon: '', nomorSk: '' };
  readonly editLmkId = signal<string | null>(null);
  formAkun = {
    name: '',
    email: '',
    password: '',
    jabatan: '',
    rwId: '',
    rtId: '',
    reguPpsu: 'Regu Zona A (RW 01–03)',
    telepon: '',
    catatan: '',
  };
  formAset = {
    namaAlat: '',
    kodeAset: '',
    satuan: 'unit',
    lokasiGudang: 'Gudang PPSU Kelurahan Rawajati',
    jumlahBaik: 0,
    jumlahRusakRingan: 0,
    jumlahRusakBerat: 0,
    jumlahHilang: 0,
  };

  readonly rws = computed(() =>
    [...this.data.rws()].sort(
      (a, b) => Number.parseInt(a.nomor, 10) - Number.parseInt(b.nomor, 10) || a.nomor.localeCompare(b.nomor, 'id'),
    ),
  );

  readonly rtsFiltered = computed(() => {
    const rw = this.filterRwId();
    const rwNomor = new Map(this.data.rws().map((r) => [r.id, r.nomor]));
    let list = [...this.data.rts()];
    if (rw) list = list.filter((r) => r.rwId === rw);
    return list.sort((a, b) => {
      const c =
        Number.parseInt(rwNomor.get(a.rwId) || '0', 10) - Number.parseInt(rwNomor.get(b.rwId) || '0', 10);
      return c || Number.parseInt(a.nomor, 10) - Number.parseInt(b.nomor, 10);
    });
  });

  readonly rtsForAkunRw = computed(() => {
    const rwId = this.akunRwId();
    if (!rwId) return [];
    return [...this.data.rts()]
      .filter((r) => r.rwId === rwId)
      .sort((a, b) => Number.parseInt(a.nomor, 10) - Number.parseInt(b.nomor, 10));
  });

  readonly jumantiks = computed(() =>
    this.data.users().filter((u) => this.data.isStaffJumantik(u)),
  );

  readonly ppsuStaff = computed(() =>
    this.data.users().filter((u) => this.data.isPetugasPpsu(u)),
  );

  readonly ppsuStaffFiltered = computed(() => {
    const q = this.cariPpsu().trim().toLowerCase();
    let list = this.ppsuStaff();
    if (!q) return list;
    return list.filter((u) => {
      const hay = [u.name, u.email, u.jabatan, u.reguPpsu, u.telepon, u.catatan]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  });

  readonly alat = computed(() => [...this.data.asetPpsus()]);

  pilihTab(value: string): void {
    const allowed: TabMaster[] = this.masterPenuh()
      ? ['RW', 'RT', 'LMK', 'JUMANTIK', 'PPSU', 'ALAT', 'TEMPLATE_DAOP']
      : ['PPSU', 'ALAT'];
    if (allowed.includes(value as TabMaster)) {
      this.tab.set(value as TabMaster);
      this.batalEdit();
    }
  }

  inputClass(hasError: boolean): string {
    return hasError
      ? 'field-input !border-rose-500 focus:!border-rose-500 focus:!ring-rose-200'
      : 'field-input';
  }

  clearErr(kind: 'rw' | 'rt', key: keyof FieldErrRw | keyof FieldErrRt): void {
    if (kind === 'rw') {
      const cur = { ...this.errRw() };
      delete cur[key as keyof FieldErrRw];
      this.errRw.set(cur);
    } else {
      const cur = { ...this.errRt() };
      delete cur[key as keyof FieldErrRt];
      this.errRt.set(cur);
    }
  }

  clearErrAkun(key: keyof FieldErrAkun): void {
    const cur = { ...this.errAkun() };
    delete cur[key];
    this.errAkun.set(cur);
  }

  onAkunRwChange(rwId: string): void {
    this.formAkun.rwId = rwId;
    this.akunRwId.set(rwId);
    this.formAkun.rtId = '';
    this.clearErrAkun('rwId');
    this.clearErrAkun('rtId');
    if (rwId) {
      const first = this.data.rts().find((r) => r.rwId === rwId);
      if (first) this.formAkun.rtId = first.id;
      this.syncJabatanJumantik();
    }
  }

  onAkunRtChange(rtId: string): void {
    this.formAkun.rtId = rtId;
    this.clearErrAkun('rtId');
    this.syncJabatanJumantik();
  }

  syncJabatanJumantik(): void {
    if (!this.formAkun.rtId) return;
    const label = this.data.labelWilayah(this.formAkun.rtId);
    if (!this.formAkun.jabatan.trim() || /^Kader Jumantik/i.test(this.formAkun.jabatan)) {
      this.formAkun.jabatan = `Kader Jumantik ${label}`;
    }
  }

  private validEmail(raw: string): string | undefined {
    const e = raw.trim().toLowerCase();
    if (!e) return 'Email wajib diisi.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Format email tidak valid.';
    return undefined;
  }

  private validateJumantik(excludeId?: string): boolean {
    const err: FieldErrAkun = {};
    if (!this.formAkun.name.trim()) err.name = 'Nama wajib diisi.';
    else if (this.formAkun.name.trim().length < 3) err.name = 'Nama minimal 3 karakter.';
    const emailMsg = this.validEmail(this.formAkun.email);
    if (emailMsg) err.email = emailMsg;
    else {
      const email = this.formAkun.email.trim().toLowerCase();
      if (this.data.users().some((u) => u.id !== excludeId && u.email.toLowerCase() === email)) {
        err.email = 'Email sudah terpakai.';
      }
    }
    if (!this.formAkun.password.trim()) err.password = 'Kata sandi wajib diisi.';
    else if (this.formAkun.password.trim().length < 6) err.password = 'Kata sandi minimal 6 karakter.';
    if (!this.formAkun.rwId) err.rwId = 'Pilih RW dulu.';
    if (!this.formAkun.rtId) err.rtId = 'Pilih RT dulu.';
    else if (this.formAkun.rwId) {
      const rt = this.data.getRt(this.formAkun.rtId);
      if (!rt || rt.rwId !== this.formAkun.rwId) err.rtId = 'RT tidak cocok dengan RW.';
    }
    if (!this.formAkun.jabatan.trim()) err.jabatan = 'Jabatan wajib diisi.';
    else if (!/jumantik/i.test(this.formAkun.jabatan)) {
      err.jabatan = 'Jabatan harus memuat kata Jumantik.';
    }
    this.errAkun.set(err);
    return Object.keys(err).length === 0;
  }

  private validatePpsu(excludeId?: string): boolean {
    const err: FieldErrAkun = {};
    if (!this.formAkun.name.trim()) err.name = 'Nama wajib diisi.';
    else if (this.formAkun.name.trim().length < 3) err.name = 'Nama minimal 3 karakter.';
    const emailMsg = this.validEmail(this.formAkun.email);
    if (emailMsg) err.email = emailMsg;
    else {
      const email = this.formAkun.email.trim().toLowerCase();
      if (this.data.users().some((u) => u.id !== excludeId && u.email.toLowerCase() === email)) {
        err.email = 'Email sudah terpakai.';
      }
    }
    if (!this.formAkun.password.trim()) err.password = 'Kata sandi wajib diisi.';
    else if (this.formAkun.password.trim().length < 6) err.password = 'Kata sandi minimal 6 karakter.';
    if (!this.formAkun.jabatan.trim()) err.jabatan = 'Pilih jabatan.';
    if (!this.formAkun.reguPpsu.trim()) err.reguPpsu = 'Pilih regu / zona.';
    const telMsg = this.validTelepon(this.formAkun.telepon);
    if (telMsg) err.telepon = telMsg;
    this.errAkun.set(err);
    return Object.keys(err).length === 0;
  }

  mulaiTambahJumantik(): void {
    this.batalEdit();
    this.tambahJumantikOpen.set(true);
    const rw0 = this.rws()[0];
    const rt0 = rw0 ? this.data.rts().find((r) => r.rwId === rw0.id) : undefined;
    this.formAkun = {
      name: '',
      email: '',
      password: '',
      jabatan: rt0 ? `Kader Jumantik ${this.data.labelWilayah(rt0.id)}` : 'Kader Jumantik',
      rwId: rw0?.id || '',
      rtId: rt0?.id || '',
      reguPpsu: '',
      telepon: '',
      catatan: '',
    };
    this.akunRwId.set(this.formAkun.rwId);
  }

  mulaiEditJumantik(u: UserAccount): void {
    this.batalEdit();
    this.editAkunId.set(u.id);
    this.formAkun = {
      name: u.name,
      email: u.email,
      password: u.password,
      jabatan: u.jabatan,
      rwId: u.rwId || '',
      rtId: u.rtId || '',
      reguPpsu: '',
      telepon: u.telepon || '',
      catatan: u.catatan || '',
    };
    this.akunRwId.set(this.formAkun.rwId);
  }

  simpanTambahJumantik(): void {
    this.syncJabatanJumantik();
    if (!this.validateJumantik()) return;
    const ok = this.data.addUser({
      name: this.formAkun.name,
      email: this.formAkun.email,
      password: this.formAkun.password,
      role: 'OP_RT',
      jabatan: this.formAkun.jabatan,
      rwId: this.formAkun.rwId,
      rtId: this.formAkun.rtId,
    });
    if (ok) this.batalEdit();
  }

  simpanEditJumantik(id: string): void {
    this.syncJabatanJumantik();
    if (!this.validateJumantik(id)) return;
    const ok = this.data.updateUser(id, {
      name: this.formAkun.name,
      email: this.formAkun.email,
      password: this.formAkun.password,
      jabatan: this.formAkun.jabatan,
      rwId: this.formAkun.rwId,
      rtId: this.formAkun.rtId,
      role: 'OP_RT',
    });
    if (ok) this.batalEdit();
  }

  mulaiTambahPpsu(): void {
    this.batalEdit();
    this.tambahPpsuOpen.set(true);
    this.formAkun = {
      name: '',
      email: '',
      password: '',
      jabatan: 'Anggota / Petugas PPSU Lapangan',
      rwId: '',
      rtId: '',
      reguPpsu: this.reguPpsuOptions[0],
      telepon: '',
      catatan: '',
    };
  }

  lihatDetailPpsu(u: UserAccount): void {
    this.batalEdit();
    this.detailPpsuId.set(u.id);
  }

  tutupDetailPpsu(): void {
    this.detailPpsuId.set(null);
  }

  mulaiEditPpsu(u: UserAccount): void {
    this.batalEdit();
    this.editAkunId.set(u.id);
    this.formAkun = {
      name: u.name,
      email: u.email,
      password: u.password,
      jabatan: u.jabatan,
      rwId: '',
      rtId: '',
      reguPpsu: u.reguPpsu || this.reguPpsuOptions[0],
      telepon: u.telepon || '',
      catatan: u.catatan || '',
    };
  }

  simpanTambahPpsu(): void {
    if (!this.validatePpsu()) return;
    const ok = this.data.addUser({
      name: this.formAkun.name,
      email: this.formAkun.email,
      password: this.formAkun.password,
      role: 'PETUGAS_PPSU',
      jabatan: this.formAkun.jabatan,
      reguPpsu: this.formAkun.reguPpsu,
      telepon: this.formAkun.telepon.trim() || undefined,
      catatan: this.formAkun.catatan.trim() || undefined,
    });
    if (ok) this.batalEdit();
  }

  simpanEditPpsu(id: string): void {
    if (!this.validatePpsu(id)) return;
    const ok = this.data.updateUser(id, {
      name: this.formAkun.name,
      email: this.formAkun.email,
      password: this.formAkun.password,
      jabatan: this.formAkun.jabatan,
      reguPpsu: this.formAkun.reguPpsu,
      telepon: this.formAkun.telepon.trim() || undefined,
      catatan: this.formAkun.catatan.trim() || undefined,
      role: 'PETUGAS_PPSU',
    });
    if (ok) this.batalEdit();
  }

  private validTelepon(raw: string): string | undefined {
    const t = raw.trim();
    if (!t) return undefined;
    const digits = t.replace(/\D/g, '');
    if (!/^08\d{8,12}$/.test(digits)) {
      return 'Nomor WA harus diawali 08 dan 10–14 digit.';
    }
    return undefined;
  }

  private validNomorWilayah(raw: string, label: 'RW' | 'RT'): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return `Nomor ${label} wajib diisi.`;
    if (/\D/.test(trimmed.replace(/\s/g, ''))) {
      return `Isi angka saja, contoh: ${label === 'RW' ? '05' : '04'}.`;
    }
    const digits = trimmed.replace(/\D/g, '');
    if (!digits || digits === '0' || /^0+$/.test(digits)) {
      return `Nomor ${label} tidak valid.`;
    }
    if (digits.length > 2) {
      return `Nomor ${label} maksimal 2 digit (01–99).`;
    }
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n) || n < 1 || n > 99) {
      return `Nomor ${label} harus 01–99.`;
    }
    return undefined;
  }

  private validateRw(excludeId?: string): boolean {
    const err: FieldErrRw = {};
    const nomorMsg = this.validNomorWilayah(this.formRw.nomor, 'RW');
    if (nomorMsg) err.nomor = nomorMsg;
    else {
      const norm = this.data.normalizeNomorRw(this.formRw.nomor);
      const dup = this.data
        .rws()
        .some((r) => r.id !== excludeId && this.data.normalizeNomorRw(r.nomor) === norm);
      if (dup) err.nomor = `RW ${norm} sudah ada.`;
    }
    if (!this.formRw.namaKetua.trim()) err.namaKetua = 'Nama Ketua RW wajib diisi.';
    else if (this.formRw.namaKetua.trim().length < 3) err.namaKetua = 'Nama minimal 3 karakter.';
    const telMsg = this.validTelepon(this.formRw.telepon);
    if (telMsg) err.telepon = telMsg;
    this.errRw.set(err);
    return Object.keys(err).length === 0;
  }

  private validateRt(excludeId?: string): boolean {
    const err: FieldErrRt = {};
    if (!this.formRt.rwId) err.rwId = 'Pilih RW dulu.';
    const nomorMsg = this.validNomorWilayah(this.formRt.nomor, 'RT');
    if (nomorMsg) err.nomor = nomorMsg;
    else if (this.formRt.rwId) {
      const norm = this.data.normalizeNomorRt(this.formRt.nomor);
      const dup = this.data
        .rts()
        .some(
          (r) =>
            r.id !== excludeId &&
            r.rwId === this.formRt.rwId &&
            this.data.normalizeNomorRt(r.nomor) === norm,
        );
      if (dup) {
        const rw = this.data.getRw(this.formRt.rwId);
        err.nomor = `${this.data.labelRt(norm)}/${this.data.labelRw(rw?.nomor ?? '0')} sudah ada.`;
      }
    }
    if (!this.formRt.namaKetua.trim()) err.namaKetua = 'Nama Ketua RT wajib diisi.';
    else if (this.formRt.namaKetua.trim().length < 3) err.namaKetua = 'Nama minimal 3 karakter.';
    const telMsg = this.validTelepon(this.formRt.telepon);
    if (telMsg) err.telepon = telMsg;
    this.errRt.set(err);
    return Object.keys(err).length === 0;
  }

  mulaiEditRw(rw: Rw): void {
    this.batalEdit();
    this.editRwId.set(rw.id);
    this.formRw = {
      nomor: rw.nomor,
      namaKetua: rw.namaKetua,
      telepon: rw.telepon || '',
      jabatanMulai: rw.jabatanMulai || '',
      jabatanSelesai: rw.jabatanSelesai || '',
      nomorSk: rw.nomorSk || '',
    };
  }

  mulaiTambahRw(): void {
    this.batalEdit();
    this.tambahRwOpen.set(true);
    this.formRw = {
      nomor: '',
      namaKetua: '',
      telepon: '',
      jabatanMulai: '',
      jabatanSelesai: '',
      nomorSk: '',
    };
  }

  simpanTambahRw(): void {
    if (!this.validateRw()) return;
    const ok = this.data.addRw({
      nomor: this.formRw.nomor,
      namaKetua: this.formRw.namaKetua,
      telepon: this.formRw.telepon.trim() || undefined,
      jabatanMulai: this.formRw.jabatanMulai || undefined,
      jabatanSelesai: this.formRw.jabatanSelesai || undefined,
      nomorSk: this.formRw.nomorSk.trim() || undefined,
    });
    if (ok) this.batalEdit();
  }

  simpanRw(id: string): void {
    if (!this.validateRw(id)) return;
    this.data.updateRw(id, {
      nomor: this.formRw.nomor.trim(),
      namaKetua: this.formRw.namaKetua.trim(),
      telepon: this.formRw.telepon.trim() || undefined,
      jabatanMulai: this.formRw.jabatanMulai || undefined,
      jabatanSelesai: this.formRw.jabatanSelesai || undefined,
      nomorSk: this.formRw.nomorSk.trim() || undefined,
    });
    this.batalEdit();
  }

  onSkRw(id: string, ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.data.setSkRw(id, f);
  }

  onSkRt(id: string, ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.data.setSkRt(id, f);
  }

  badgeJabatan(selesai?: string): string {
    const s = this.data.statusMasaJabatan(selesai);
    if (s === 'HABIS') return 'bg-rose-100 text-rose-800';
    if (s === 'HAMPIR_HABIS') return 'bg-amber-100 text-amber-900';
    if (s === 'BELUM_DIISI') return 'bg-slate-100 text-slate-600';
    return 'bg-emerald-100 text-emerald-800';
  }

  mulaiEditRt(rt: Rt): void {
    this.batalEdit();
    this.editRtId.set(rt.id);
    this.formRt = {
      nomor: rt.nomor,
      namaKetua: rt.namaKetua,
      telepon: rt.telepon || '',
      rwId: rt.rwId,
      jabatanMulai: rt.jabatanMulai || '',
      jabatanSelesai: rt.jabatanSelesai || '',
      nomorSk: rt.nomorSk || '',
    };
  }

  mulaiTambahRt(): void {
    this.batalEdit();
    this.tambahRtOpen.set(true);
    this.formRt = {
      nomor: '',
      namaKetua: '',
      telepon: '',
      rwId: this.filterRwId() || this.rws()[0]?.id || '',
      jabatanMulai: '',
      jabatanSelesai: '',
      nomorSk: '',
    };
  }

  simpanTambahRt(): void {
    if (!this.validateRt()) return;
    const ok = this.data.addRt({
      nomor: this.formRt.nomor,
      namaKetua: this.formRt.namaKetua,
      telepon: this.formRt.telepon.trim() || undefined,
      rwId: this.formRt.rwId,
      jabatanMulai: this.formRt.jabatanMulai || undefined,
      jabatanSelesai: this.formRt.jabatanSelesai || undefined,
      nomorSk: this.formRt.nomorSk.trim() || undefined,
    });
    if (ok) this.batalEdit();
  }

  simpanRt(id: string): void {
    if (!this.validateRt(id)) return;
    this.data.updateRt(id, {
      nomor: this.formRt.nomor.trim(),
      namaKetua: this.formRt.namaKetua.trim(),
      telepon: this.formRt.telepon.trim() || undefined,
      rwId: this.formRt.rwId,
      jabatanMulai: this.formRt.jabatanMulai || undefined,
      jabatanSelesai: this.formRt.jabatanSelesai || undefined,
      nomorSk: this.formRt.nomorSk.trim() || undefined,
    });
    this.batalEdit();
  }

  totalFormAset(): number {
    return (
      (Number(this.formAset.jumlahBaik) || 0) +
      (Number(this.formAset.jumlahRusakRingan) || 0) +
      (Number(this.formAset.jumlahRusakBerat) || 0) +
      (Number(this.formAset.jumlahHilang) || 0)
    );
  }

  mulaiEditAset(a: AsetPpsu): void {
    this.batalEdit();
    this.editAsetId.set(a.id);
    this.formAset = {
      namaAlat: a.namaAlat,
      kodeAset: a.kodeAset,
      satuan: a.satuan,
      lokasiGudang: a.lokasiGudang,
      jumlahBaik: a.jumlahBaik ?? a.jumlah ?? 0,
      jumlahRusakRingan: a.jumlahRusakRingan ?? 0,
      jumlahRusakBerat: a.jumlahRusakBerat ?? 0,
      jumlahHilang: a.jumlahHilang ?? 0,
    };
  }

  mulaiTambahAset(): void {
    this.batalEdit();
    this.tambahAsetOpen.set(true);
    this.formAset = {
      namaAlat: '',
      kodeAset: '',
      satuan: 'unit',
      lokasiGudang: 'Gudang PPSU Kelurahan Rawajati',
      jumlahBaik: 0,
      jumlahRusakRingan: 0,
      jumlahRusakBerat: 0,
      jumlahHilang: 0,
    };
  }

  simpanTambahAset(): void {
    const nama = this.formAset.namaAlat.trim();
    if (!nama) {
      this.data.showToast('Isi nama alat dulu.');
      return;
    }
    const nextNo = this.data.asetPpsus().length + 1;
    const kode =
      this.formAset.kodeAset.trim() ||
      `PPSU-RWJ-${String(nextNo).padStart(3, '0')}`;
    this.data.addAset({
      kodeAset: kode,
      namaAlat: nama,
      satuan: this.formAset.satuan.trim() || 'unit',
      lokasiGudang: this.formAset.lokasiGudang.trim() || 'Gudang PPSU Kelurahan Rawajati',
      jumlahBaik: Number(this.formAset.jumlahBaik) || 0,
      jumlahRusakRingan: Number(this.formAset.jumlahRusakRingan) || 0,
      jumlahRusakBerat: Number(this.formAset.jumlahRusakBerat) || 0,
      jumlahHilang: Number(this.formAset.jumlahHilang) || 0,
      statusPinjam: 'TERSEDIA',
    });
    this.batalEdit();
  }

  simpanAset(id: string): void {
    this.data.updateAsetStok(id, {
      namaAlat: this.formAset.namaAlat.trim(),
      satuan: this.formAset.satuan.trim() || 'unit',
      jumlahBaik: Number(this.formAset.jumlahBaik) || 0,
      jumlahRusakRingan: Number(this.formAset.jumlahRusakRingan) || 0,
      jumlahRusakBerat: Number(this.formAset.jumlahRusakBerat) || 0,
      jumlahHilang: Number(this.formAset.jumlahHilang) || 0,
    });
    this.batalEdit();
  }

  onPilihTemplateDaop(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const uploader = this.auth.currentUser()?.name || 'Staf Kelurahan';
    this.data.uploadTemplateDaopKosong(file, uploader);
  }

  unduhTemplateDaop(): void {
    this.data.unduhTemplateDaopKosongJikaAda();
  }

  hapusTemplateDaop(): void {
    this.data.hapusTemplateDaopKosong();
  }

  formatWaktu(iso: string): string {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  batalEdit(): void {
    this.editRwId.set(null);
    this.editRtId.set(null);
    this.editLmkId.set(null);
    this.editAsetId.set(null);
    this.editAkunId.set(null);
    this.detailPpsuId.set(null);
    this.akunRwId.set('');
    this.tambahRwOpen.set(false);
    this.tambahRtOpen.set(false);
    this.tambahJumantikOpen.set(false);
    this.tambahPpsuOpen.set(false);
    this.tambahAsetOpen.set(false);
    this.errRw.set({});
    this.errRt.set({});
    this.errAkun.set({});
    this.formLmk = { rwId: '', nama: '', telepon: '', nomorSk: '' };
  }

  /** RW yang belum punya perwakilan LMK aktif. */
  rwsTanpaLmk(): Rw[] {
    const punya = new Set(
      this.data
        .anggotaLmks()
        .filter((a) => a.isActive)
        .map((a) => a.rwId),
    );
    return this.rws().filter((rw) => !punya.has(rw.id));
  }

  mulaiEditLmk(a: AnggotaLmk): void {
    this.batalEdit();
    this.editLmkId.set(a.id);
    this.formLmk = {
      rwId: a.rwId,
      nama: a.nama,
      telepon: a.telepon || '',
      nomorSk: a.nomorSk || '',
    };
  }

  simpanTambahLmk(): void {
    const ok = this.data.addAnggotaLmk({
      rwId: this.formLmk.rwId,
      nama: this.formLmk.nama,
      telepon: this.formLmk.telepon.trim() || undefined,
      nomorSk: this.formLmk.nomorSk.trim() || undefined,
    });
    if (ok) this.batalEdit();
  }

  simpanLmk(id: string): void {
    this.data.updateAnggotaLmk(id, {
      nama: this.formLmk.nama.trim(),
      telepon: this.formLmk.telepon.trim() || undefined,
      nomorSk: this.formLmk.nomorSk.trim() || undefined,
    });
    this.batalEdit();
  }
}
