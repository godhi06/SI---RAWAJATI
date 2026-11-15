import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import {
  AgendaRapat,
  JenisKegiatanAgenda,
  JenisPesertaAgenda,
  KerjaBaktiRw,
  PesertaAgenda,
  Rw,
  StatusAgendaRapat,
  StatusKerjaBakti,
} from '../../core/models';

type TabAgenda = 'RAPAT' | 'KERJA_BAKTI';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="page-title">Agenda Kelurahan</h1>
          <p class="mt-1 text-sm font-semibold text-blue-700">Rapat &amp; kerja bakti RW bergilir</p>
          <p class="page-sub">
            @if (isAdmin()) {
              Biasanya Sekkel yang buat agenda; Lurah/Kasi juga bisa. Absensi dicentang di ruang rapat.
            } @else {
              Lihat undangan &amp; giliran kerja bakti wilayah Anda.
            }
          </p>
        </div>
      </header>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-xl border-2 px-4 py-2 text-sm font-bold"
          [class]="tab() === 'RAPAT' ? tabOn : tabOff"
          (click)="tab.set('RAPAT')"
        >
          Agenda Kegiatan ({{ daftarRapat().length }})
        </button>
        <button
          type="button"
          class="rounded-xl border-2 px-4 py-2 text-sm font-bold"
          [class]="tab() === 'KERJA_BAKTI' ? tabOn : tabOff"
          (click)="tab.set('KERJA_BAKTI')"
        >
          Kerja Bakti RW ({{ daftarKerjaBakti().length }})
        </button>
      </div>

      @if (tab() === 'RAPAT') {
        @if (isAdmin()) {
          <section class="card !p-5">
            <h2 class="text-lg font-bold text-slate-900">Buat agenda kegiatan</h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label class="field-label" for="jenis-keg">Jenis kegiatan</label>
                <select id="jenis-keg" class="field-input" [(ngModel)]="formRapat.jenisKegiatan">
                  <option value="RAPAT">Rapat</option>
                  <option value="PENYULUHAN">Penyuluhan</option>
                  <option value="SOSIALISASI">Sosialisasi</option>
                  <option value="POSYANDU">Posyandu</option>
                  <option value="LAIN">Lainnya</option>
                </select>
              </div>
              <div>
                <label class="field-label" for="judul">Judul</label>
                <input id="judul" class="field-input" [(ngModel)]="formRapat.judul" placeholder="Contoh: Penyuluhan DBD / Posyandu RW 07" />
              </div>
              <div>
                <label class="field-label" for="tgl">Tanggal</label>
                <input id="tgl" class="field-input" type="date" [(ngModel)]="formRapat.tanggal" />
              </div>
              <div>
                <label class="field-label" for="jam">Jam mulai</label>
                <input id="jam" class="field-input" type="time" [(ngModel)]="formRapat.jamMulai" />
              </div>
              <div class="sm:col-span-2">
                <label class="field-label" for="tempat">Tempat</label>
                <input
                  id="tempat"
                  class="field-input"
                  [(ngModel)]="formRapat.tempat"
                  placeholder="Ruang Rapat Lt. 2"
                />
              </div>
              <div class="sm:col-span-2">
                <label class="field-label" for="ringkas">Ringkasan agenda</label>
                <textarea
                  id="ringkas"
                  class="field-input min-h-[4.5rem]"
                  [(ngModel)]="formRapat.ringkasanAgenda"
                  placeholder="Poin pembahasan singkat"
                ></textarea>
              </div>
            </div>

            <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm font-bold text-slate-800">Undangan</p>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="btn-secondary text-xs" (click)="tambahSemuaStaf()">
                    + Semua staf kelurahan
                  </button>
                  <button type="button" class="btn-secondary text-xs" (click)="tambahSemuaRw()">
                    + Semua Ketua RW
                  </button>
                  <button type="button" class="btn-secondary text-xs" (click)="tambahSemuaRt()">
                    + Semua Ketua RT
                  </button>
                  <button type="button" class="btn-secondary text-xs" (click)="tambahSemuaLmk()">
                    + Semua perwakilan LMK
                  </button>
                </div>
              </div>
              <div class="mt-3 grid gap-2 sm:grid-cols-3">
                <div>
                  <label class="field-label" for="jenis-p">Jenis</label>
                  <select id="jenis-p" class="field-input" [(ngModel)]="draftPeserta.jenis">
                    <option value="STAF">Staf kelurahan (internal)</option>
                    <option value="RW">Ketua RW</option>
                    <option value="RT">Ketua RT</option>
                    <option value="LMK">Perwakilan LMK (1 orang / RW)</option>
                    <option value="TAMU">Tamu luar</option>
                  </select>
                </div>
                @if (draftPeserta.jenis === 'RW') {
                  <div>
                    <label class="field-label" for="pilih-rw">Pilih RW</label>
                    <select id="pilih-rw" class="field-input" [(ngModel)]="draftPeserta.rwId">
                      <option value="">— pilih —</option>
                      @for (rw of data.rws(); track rw.id) {
                        <option [value]="rw.id">RW {{ rw.nomor }} — {{ rw.namaKetua }}</option>
                      }
                    </select>
                  </div>
                }
                @if (draftPeserta.jenis === 'RT') {
                  <div>
                    <label class="field-label" for="pilih-rt">Pilih RT</label>
                    <select id="pilih-rt" class="field-input" [(ngModel)]="draftPeserta.rtId">
                      <option value="">— pilih —</option>
                      @for (rt of data.rts(); track rt.id) {
                        <option [value]="rt.id">{{ data.labelWilayah(rt.id) }} — {{ rt.namaKetua }}</option>
                      }
                    </select>
                  </div>
                }
                @if (draftPeserta.jenis === 'LMK') {
                  <div class="sm:col-span-2">
                    <label class="field-label" for="pilih-lmk">Pilih perwakilan LMK (dari Master)</label>
                    <select id="pilih-lmk" class="field-input" [(ngModel)]="draftPeserta.lmkId">
                      <option value="">— 1 tokoh per RW —</option>
                      @for (a of data.anggotaLmksSorted(); track a.id) {
                        <option [value]="a.id">{{ data.labelAnggotaLmk(a) }}</option>
                      }
                    </select>
                    <p class="mt-1 text-[11px] text-slate-500">
                      LMK = satu lembaga di kelurahan; anggota = perwakilan tiap RW (bukan Ketua/Sekretaris LMK).
                    </p>
                  </div>
                }
                @if (draftPeserta.jenis === 'STAF') {
                  <div class="sm:col-span-2">
                    <label class="field-label" for="pilih-staf">Pilih staf (dari Master akun)</label>
                    <select id="pilih-staf" class="field-input" [(ngModel)]="draftPeserta.userId">
                      <option value="">— pilih Lurah / Sekkel / Kasi —</option>
                      @for (u of stafKelurahan(); track u.id) {
                        <option [value]="u.id">{{ u.name }} — {{ u.jabatan }}</option>
                      }
                    </select>
                  </div>
                }
                @if (draftPeserta.jenis === 'TAMU') {
                  <div>
                    <label class="field-label" for="nama-p">Nama</label>
                    <input id="nama-p" class="field-input" [(ngModel)]="draftPeserta.nama" />
                  </div>
                  <div>
                    <label class="field-label" for="instansi-p">Instansi / jabatan</label>
                    <input
                      id="instansi-p"
                      class="field-input"
                      [(ngModel)]="draftPeserta.instansi"
                      placeholder="Camat / Babinsa / Dewan…"
                    />
                  </div>
                }
                <div class="flex items-end">
                  <button type="button" class="btn-secondary w-full" (click)="tambahDraftPeserta()">Tambah undangan</button>
                </div>
              </div>
              @if (formPeserta().length) {
                <ul class="mt-3 space-y-1">
                  @for (p of formPeserta(); track $index) {
                    <li class="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                      <span>
                        <span class="font-semibold">{{ p.nama }}</span>
                        <span class="text-slate-500"> · {{ labelJenis(p.jenis) }}</span>
                        @if (p.instansi) {
                          <span class="text-slate-500"> · {{ p.instansi }}</span>
                        }
                      </span>
                      <button type="button" class="text-xs font-bold text-rose-600" (click)="hapusDraftPeserta($index)">
                        Hapus
                      </button>
                    </li>
                  }
                </ul>
              }
              <p class="mt-2 text-xs text-slate-500">
                Internal: undang staf. Eksternal: boleh undang &amp; blast RW / RT / LMK (perlu No. WA di Master).
              </p>
            </div>

            <div class="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
              <label class="field-label" for="ag-pdf">PDF undangan (opsional)</label>
              <input
                id="ag-pdf"
                class="field-input mt-1"
                type="file"
                accept="application/pdf,.pdf"
                (change)="onFormPdfRapat($event)"
              />
              @if (formRapatPdfName()) {
                <p class="mt-1 text-sm font-semibold text-slate-800">Siap diunggah: {{ formRapatPdfName() }}</p>
              } @else {
                <p class="mt-1 text-xs text-slate-500">
                  Biasanya diunggah Sekkel. Boleh kosong dulu — bisa di kartu agenda bawah.
                </p>
              }
            </div>

            <div class="mt-4 flex justify-end">
              <button type="button" class="btn-primary" (click)="simpanRapat()">Simpan agenda</button>
            </div>
          </section>
        }

        <section class="space-y-3">
          @for (row of daftarRapat(); track row.id) {
            <article class="card !p-4">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {{ data.labelJenisKegiatanAgenda(row.jenisKegiatan) }} · {{ row.tanggal }} · {{ row.jamMulai }} ·
                    {{ row.tempat }}
                  </p>
                  <h3 class="mt-1 text-lg font-bold text-slate-900">{{ row.judul }}</h3>
                  <p class="mt-1 text-sm text-slate-600">{{ row.ringkasanAgenda }}</p>
                </div>
                <span class="rounded-full px-2.5 py-1 text-xs font-bold" [class]="badgeAgenda(row.status)">
                  {{ labelStatusAgenda(row.status) }}
                </span>
              </div>

              @if (isAdmin()) {
                <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">
                    PDF undangan · blast Ketua RW / RT / LMK
                  </p>
                  @if (row.undanganPdfName) {
                    <p class="mt-1 text-sm font-semibold text-slate-900">{{ row.undanganPdfName }}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      @if (row.undanganPdfUrl) {
                        <a class="btn-secondary text-sm" [href]="row.undanganPdfUrl" target="_blank" rel="noopener">
                          Buka PDF
                        </a>
                      }
                      <label class="btn-secondary cursor-pointer text-sm">
                        Ganti PDF
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          class="sr-only"
                          (change)="onPdfRapat(row.id, $event)"
                        />
                      </label>
                      <button type="button" class="text-sm font-bold text-rose-600" (click)="hapusPdfRapat(row.id)">
                        Hapus PDF
                      </button>
                    </div>
                  } @else {
                    <p class="mt-1 text-sm text-slate-600">Belum ada PDF — unggah dari sekretaris.</p>
                    <label class="btn-secondary mt-2 inline-flex cursor-pointer text-sm">
                      Upload PDF undangan
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        class="sr-only"
                        (change)="onPdfRapat(row.id, $event)"
                      />
                    </label>
                  }

                  <div class="mt-3 border-t border-slate-200 pt-3">
                    <p class="text-xs text-slate-500">
                      Target blast: Ketua RW, Ketua RT, dan LMK yang punya No. WA.
                    </p>
                    <ul class="mt-2 space-y-2">
                      @for (rw of data.targetBlastRwAgenda(row); track rw.id) {
                        <li class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                          <span class="text-sm">
                            <strong>{{ data.labelRw(rw.nomor) }}</strong> · {{ rw.namaKetua }}
                            @if (sudahBlastRw(row, rw.id)) {
                              <span class="ml-1 text-xs font-bold text-emerald-700">· sudah blast</span>
                            }
                          </span>
                          @if (waBlastRapat(row, rw); as wa) {
                            <a
                              class="btn-primary text-sm"
                              [href]="wa"
                              target="_blank"
                              rel="noopener"
                              (click)="catatBlastRapat(row.id, rw.id)"
                            >
                              Blast WA
                            </a>
                          } @else {
                            <span class="text-xs text-amber-700">No. WA kosong</span>
                          }
                        </li>
                      }
                      @for (p of data.targetBlastRtAgenda(row); track p.id) {
                        <li class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                          <span class="text-sm">
                            <strong>{{ p.rtId ? data.labelWilayah(p.rtId) : 'RT' }}</strong> · {{ p.nama }}
                            @if (sudahBlastPeserta(row, p.id)) {
                              <span class="ml-1 text-xs font-bold text-emerald-700">· sudah blast</span>
                            }
                          </span>
                          @if (waBlastRt(row, p); as wa) {
                            <a
                              class="btn-primary text-sm"
                              [href]="wa"
                              target="_blank"
                              rel="noopener"
                              (click)="catatBlastLmk(row.id, p.id)"
                            >
                              Blast WA
                            </a>
                          } @else {
                            <span class="text-xs text-amber-700">No. WA kosong</span>
                          }
                        </li>
                      }
                      @for (p of data.targetBlastLmkAgenda(row); track p.id) {
                        <li class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                          <span class="text-sm">
                            <strong>LMK</strong> · {{ p.nama }}
                            @if (p.instansi) {
                              <span class="text-slate-500"> · {{ p.instansi }}</span>
                            }
                            @if (sudahBlastPeserta(row, p.id)) {
                              <span class="ml-1 text-xs font-bold text-emerald-700">· sudah blast</span>
                            }
                          </span>
                          @if (waBlastLmk(row, p); as wa) {
                            <a
                              class="btn-primary text-sm"
                              [href]="wa"
                              target="_blank"
                              rel="noopener"
                              (click)="catatBlastLmk(row.id, p.id)"
                            >
                              Blast WA
                            </a>
                          }
                        </li>
                      }
                      @if (
                        !data.targetBlastRwAgenda(row).length &&
                        !data.targetBlastRtAgenda(row).length &&
                        !data.targetBlastLmkAgenda(row).length
                      ) {
                        <li class="text-sm text-slate-500">Belum ada RW / RT / LMK ber-WA di undangan.</li>
                      }
                    </ul>
                  </div>
                </div>
              }

              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="btn-secondary text-sm" (click)="pilihRapat(row)">
                  {{ selectedRapatId() === row.id ? 'Tutup detail' : 'Daftar hadir / detail' }}
                </button>
                @if (isAdmin()) {
                  @if (row.status === 'DIJADWALKAN') {
                    <button type="button" class="btn-secondary text-sm" (click)="setStatusRapat(row.id, 'BERLANGSUNG')">
                      Mulai rapat
                    </button>
                  }
                  @if (row.status === 'BERLANGSUNG' || row.status === 'DIJADWALKAN') {
                    <button type="button" class="btn-secondary text-sm" (click)="setStatusRapat(row.id, 'SELESAI')">
                      Selesai
                    </button>
                  }
                  <button type="button" class="text-sm font-bold text-rose-600" (click)="hapusRapat(row.id)">Hapus</button>
                }
              </div>

              @if (selectedRapatId() === row.id) {
                <div class="mt-4 border-t border-slate-100 pt-4">
                  <h4 class="text-sm font-bold text-slate-800">
                    Daftar hadir ({{ hitungHadir(row) }}/{{ row.peserta.length }})
                  </h4>
                  <p class="mt-1 text-xs text-slate-500">
                    Dicentang staf di dalam ruang rapat — tidak perlu QR / HP peserta.
                  </p>
                  <ul class="mt-3 space-y-2">
                    @for (p of row.peserta; track p.id) {
                      <li class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <div>
                          <p class="text-sm font-semibold text-slate-900">{{ p.nama }}</p>
                          <p class="text-xs text-slate-500">
                            {{ labelJenis(p.jenis) }}
                            @if (p.instansi) {
                              · {{ p.instansi }}
                            }
                            @if (p.rwId && !p.rtId) {
                              · {{ data.labelRw(data.getRw(p.rwId)?.nomor || '') }}
                            }
                            @if (p.rtId) {
                              · {{ data.labelWilayah(p.rtId) }}
                            }
                          </p>
                        </div>
                        @if (isAdmin()) {
                          <label class="flex cursor-pointer items-center gap-2 text-sm font-bold">
                            <input
                              type="checkbox"
                              class="h-4 w-4"
                              [checked]="p.hadir"
                              (change)="toggleHadir(row.id, p.id, $event)"
                            />
                            Hadir
                          </label>
                        } @else {
                          <span
                            class="rounded-full px-2 py-0.5 text-xs font-bold"
                            [class]="p.hadir ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
                          >
                            {{ p.hadir ? 'Hadir' : 'Belum' }}
                          </span>
                        }
                      </li>
                    }
                  </ul>

                  <div class="mt-4">
                    <label class="field-label" [attr.for]="'notulen-' + row.id">Notulen singkat</label>
                    <textarea
                      [id]="'notulen-' + row.id"
                      class="field-input min-h-[5rem]"
                      [ngModel]="notulenDraft()[row.id] ?? row.notulen ?? ''"
                      (ngModelChange)="setNotulenDraft(row.id, $event)"
                      [disabled]="!isAdmin()"
                      placeholder="Keputusan / tindak lanjut…"
                    ></textarea>
                    @if (isAdmin()) {
                      <button type="button" class="btn-primary mt-2" (click)="simpanNotulen(row.id)">Simpan notulen</button>
                    }
                  </div>
                </div>
              }
            </article>
          } @empty {
            <p class="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              Belum ada agenda rapat.
            </p>
          }
        </section>
      }

      @if (tab() === 'KERJA_BAKTI') {
        @if (isAdmin()) {
          <section class="card !p-5">
            <h2 class="text-lg font-bold text-slate-900">Jadwalkan kerja bakti RW</h2>
            <p class="mt-1 text-sm text-slate-500">
              Giliran muter per RW — PIC biasanya Ketua RW. Setelah jadwal tersimpan, unggah PDF undangan
              sekretaris lalu blast WA ke Ketua RW setempat.
            </p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label class="field-label" for="kb-rw">RW</label>
                <select id="kb-rw" class="field-input" [(ngModel)]="formKb.rwId" (ngModelChange)="onPilihRwKb($event)">
                  <option value="">— pilih RW —</option>
                  @for (rw of data.rws(); track rw.id) {
                    <option [value]="rw.id">RW {{ rw.nomor }} — {{ rw.namaKetua }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="field-label" for="kb-tgl">Tanggal</label>
                <input id="kb-tgl" class="field-input" type="date" [(ngModel)]="formKb.tanggal" />
              </div>
              <div>
                <label class="field-label" for="kb-pic">PIC</label>
                <input id="kb-pic" class="field-input" [(ngModel)]="formKb.picNama" />
              </div>
              <div>
                <label class="field-label" for="kb-lok">Lokasi</label>
                <input id="kb-lok" class="field-input" [(ngModel)]="formKb.lokasi" placeholder="Area wilayah RW…" />
              </div>
              <div class="sm:col-span-2">
                <label class="field-label" for="kb-desk">Deskripsi</label>
                <input
                  id="kb-desk"
                  class="field-input"
                  [(ngModel)]="formKb.deskripsi"
                  placeholder="Bersih saluran, sapu jalan, …"
                />
              </div>
              <div class="sm:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                <label class="field-label" for="kb-pdf">PDF undangan sekretaris (opsional)</label>
                <input
                  id="kb-pdf"
                  class="field-input mt-1"
                  type="file"
                  accept="application/pdf,.pdf"
                  (change)="onFormPdf($event)"
                />
                @if (formKbPdfName()) {
                  <p class="mt-1 text-sm font-semibold text-slate-800">Siap diunggah: {{ formKbPdfName() }}</p>
                } @else {
                  <p class="mt-1 text-xs text-slate-500">Boleh dikosongkan dulu — bisa diunggah lagi di kartu jadwal bawah.</p>
                }
                <p class="mt-2 text-xs text-slate-500">
                  Dukungan PPSU (personil/alat/kendaraan) diisi di kartu jadwal bila perlu — bukan di form ini.
                </p>
              </div>
            </div>
            <div class="mt-4 flex justify-end">
              <button type="button" class="btn-primary" (click)="simpanKerjaBakti()">Simpan jadwal</button>
            </div>
          </section>
        }

        <p class="text-sm font-semibold text-slate-600">
          Jadwal tersimpan ({{ daftarKerjaBakti().length }}) — PDF/blast WA &amp; dukungan PPSU ada di tiap kartu di bawah.
        </p>

        <section class="space-y-3">
          @for (row of daftarKerjaBakti(); track row.id) {
            <article class="card !p-4">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {{ row.tanggal }} · {{ data.labelRw(data.getRw(row.rwId)?.nomor || '') }}
                  </p>
                  <h3 class="mt-1 text-base font-bold text-slate-900">{{ row.lokasi }}</h3>
                  <p class="mt-1 text-sm text-slate-600">{{ row.deskripsi }}</p>
                  <p class="mt-1 text-sm text-slate-500">PIC: {{ row.picNama }}</p>
                </div>
                <span class="rounded-full px-2.5 py-1 text-xs font-bold" [class]="badgeKb(row.status)">
                  {{ labelStatusKb(row.status) }}
                </span>
              </div>

              <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500">PDF undangan (sekretaris)</p>
                @if (row.undanganPdfName) {
                  <p class="mt-1 text-sm font-semibold text-slate-900">{{ row.undanganPdfName }}</p>
                  <p class="text-xs text-slate-500">
                    Diunggah {{ row.undanganPdfUploadedBy || '—' }}
                    @if (row.undanganPdfUploadedAt) {
                      · {{ row.undanganPdfUploadedAt.slice(0, 10) }}
                    }
                  </p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    @if (row.undanganPdfUrl) {
                      <a class="btn-secondary text-sm" [href]="row.undanganPdfUrl" target="_blank" rel="noopener">
                        Buka PDF
                      </a>
                    }
                    @if (isAdmin()) {
                      <label class="btn-secondary cursor-pointer text-sm">
                        Ganti PDF
                        <input type="file" accept="application/pdf,.pdf" class="sr-only" (change)="onPdfUndangan(row.id, $event)" />
                      </label>
                      <button type="button" class="text-sm font-bold text-rose-600" (click)="hapusPdfUndangan(row.id)">
                        Hapus PDF
                      </button>
                    }
                  </div>
                } @else if (isAdmin()) {
                  <p class="mt-1 text-sm text-slate-600">Belum ada PDF — unggah surat undangan dari sekretaris.</p>
                  <label class="btn-secondary mt-2 inline-flex cursor-pointer text-sm">
                    Upload PDF undangan
                    <input type="file" accept="application/pdf,.pdf" class="sr-only" (change)="onPdfUndangan(row.id, $event)" />
                  </label>
                } @else {
                  <p class="mt-1 text-sm text-slate-600">PDF undangan belum diunggah kelurahan.</p>
                }

                @if (isAdmin()) {
                  <div class="mt-3 border-t border-slate-200 pt-3">
                    @if (waBlastKb(row); as wa) {
                      <a
                        class="btn-primary inline-flex text-sm"
                        [href]="wa"
                        target="_blank"
                        rel="noopener"
                        (click)="catatBlastKb(row.id)"
                      >
                        Blast WA ke Ketua RW
                      </a>
                      <p class="mt-1 text-xs text-slate-500">
                        Buka WhatsApp ke PIC wilayah ini. Lampirkan PDF di chat (demo wa.me = teks dulu).
                      </p>
                    } @else {
                      <p class="text-sm text-amber-700">Nomor WA Ketua RW belum ada di Master — isi telepon dulu.</p>
                    }
                    @if (row.undanganBlastAt) {
                      <p class="mt-1 text-xs font-semibold text-emerald-700">
                        Terakhir blast: {{ row.undanganBlastAt.slice(0, 16).replace('T', ' ') }}
                      </p>
                    }
                  </div>
                }
              </div>

              <div class="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-3">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Dukungan PPSU · opsional
                    </p>
                    <p class="mt-0.5 text-xs text-slate-500">
                      Isi kalau PPSU ikut — bukan syarat menandai selesai.
                    </p>
                  </div>
                  @if (bisaKelolaKb(row)) {
                    <button type="button" class="text-sm font-bold text-blue-700" (click)="togglePpsuForm(row)">
                      {{ ppsuFormOpen() === row.id ? 'Tutup' : data.punyaDukunganPpsu(row) ? 'Ubah' : 'Isi rekap' }}
                    </button>
                  }
                </div>

                @if (data.punyaDukunganPpsu(row) && ppsuFormOpen() !== row.id) {
                  <ul class="mt-2 space-y-0.5 text-sm text-slate-700">
                    <li>
                      Personil:
                      <strong>{{ row.ppsuJumlahPersonil || '—' }}</strong>
                      @if (row.ppsuReguLabel) {
                        · {{ row.ppsuReguLabel }}
                      }
                    </li>
                    <li>Alat: {{ data.labelAlatPpsu(row.ppsuAlatIds) }}</li>
                    <li>Kendaraan: {{ row.ppsuKendaraan || '—' }}</li>
                  </ul>
                }

                @if (ppsuFormOpen() === row.id) {
                  <div class="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="field-label" [attr.for]="'ppsu-jml-' + row.id">Jumlah personil</label>
                      <input
                        [id]="'ppsu-jml-' + row.id"
                        class="field-input"
                        type="number"
                        min="0"
                        [(ngModel)]="draftPpsu.jumlah"
                      />
                    </div>
                    <div>
                      <label class="field-label" [attr.for]="'ppsu-regu-' + row.id">Regu / zona</label>
                      <input
                        [id]="'ppsu-regu-' + row.id"
                        class="field-input"
                        [(ngModel)]="draftPpsu.regu"
                        placeholder="Contoh: Regu Zona A"
                      />
                    </div>
                    <div class="sm:col-span-2">
                      <p class="field-label">Alat dibawa (centang)</p>
                      <div class="mt-1 flex flex-wrap gap-2">
                        @for (alat of data.asetPpsus(); track alat.id) {
                          <label class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
                            <input
                              type="checkbox"
                              [checked]="draftPpsu.alatIds.includes(alat.id)"
                              (change)="toggleAlatDraft(alat.id, $event)"
                            />
                            {{ alat.namaAlat }}
                          </label>
                        }
                      </div>
                    </div>
                    <div class="sm:col-span-2">
                      <label class="field-label" [attr.for]="'ppsu-kend-' + row.id">Kendaraan</label>
                      <input
                        [id]="'ppsu-kend-' + row.id"
                        class="field-input"
                        [(ngModel)]="draftPpsu.kendaraan"
                        placeholder="Contoh: 1 unit pick-up dinas"
                      />
                    </div>
                  </div>
                  <div class="mt-3 flex justify-end gap-2">
                    <button type="button" class="btn-secondary text-sm" (click)="ppsuFormOpen.set(null)">Batal</button>
                    <button type="button" class="btn-primary text-sm" (click)="simpanPpsu(row.id)">Simpan rekap PPSU</button>
                  </div>
                }
              </div>

              @if (row.fotoUrl) {
                <img [src]="row.fotoUrl" [alt]="row.fotoName || 'Foto kerja bakti'" class="mt-3 max-h-40 rounded-xl object-cover" />
              }
              @if (row.catatan) {
                <p class="mt-2 text-sm text-slate-600">{{ row.catatan }}</p>
              }

              <div class="mt-3 flex flex-wrap items-center gap-2">
                @if (bisaKelolaKb(row)) {
                  @if (row.status !== 'SELESAI') {
                    <button type="button" class="btn-secondary text-sm" (click)="setStatusKb(row.id, 'BERLANGSUNG')">
                      Berlangsung
                    </button>
                    <button type="button" class="btn-primary text-sm" (click)="setStatusKb(row.id, 'SELESAI')">
                      Tandai selesai
                    </button>
                  }
                  <label class="btn-secondary cursor-pointer text-sm">
                    Upload foto
                    <input type="file" accept="image/*" class="sr-only" (change)="onFotoKb(row.id, $event)" />
                  </label>
                }
                @if (isAdmin()) {
                  <button type="button" class="text-sm font-bold text-rose-600" (click)="hapusKb(row.id)">Hapus</button>
                }
              </div>
            </article>
          } @empty {
            <p class="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              Belum ada jadwal kerja bakti.
            </p>
          }
        </section>
      }
    </div>
  `,
})
export class AgendaComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);

  readonly tab = signal<TabAgenda>('RAPAT');
  readonly selectedRapatId = signal<string | null>(null);
  readonly formPeserta = signal<Omit<PesertaAgenda, 'id' | 'hadir' | 'hadirAt'>[]>([]);
  readonly notulenDraft = signal<Record<string, string>>({});
  readonly ppsuFormOpen = signal<string | null>(null);

  draftPpsu = {
    jumlah: 0 as number | null,
    regu: '',
    alatIds: [] as string[],
    kendaraan: '',
  };

  readonly tabOn = 'border-blue-600 bg-blue-50 text-blue-800';
  readonly tabOff = 'border-slate-200 bg-white text-slate-600';

  formRapat = {
    jenisKegiatan: 'RAPAT' as JenisKegiatanAgenda,
    judul: '',
    tanggal: '',
    jamMulai: '09:00',
    tempat: 'Ruang Rapat Lt. 2 Kelurahan Rawajati',
    ringkasanAgenda: '',
  };

  draftPeserta: {
    jenis: JenisPesertaAgenda;
    nama: string;
    instansi: string;
    telepon: string;
    rwId: string;
    rtId: string;
    userId: string;
    lmkId: string;
  } = { jenis: 'STAF', nama: '', instansi: '', telepon: '', rwId: '', rtId: '', userId: '', lmkId: '' };

  formKb = {
    rwId: '',
    tanggal: '',
    lokasi: '',
    picNama: '',
    deskripsi: 'Kerja bakti bergilir: bersih lingkungan wilayah RW.',
  };
  formKbPdfFile: File | null = null;
  readonly formKbPdfName = signal<string | null>(null);
  formRapatPdfFile: File | null = null;
  readonly formRapatPdfName = signal<string | null>(null);

  readonly isAdmin = computed(() => this.auth.hasRole('ADMIN_KEL'));

  readonly stafKelurahan = computed(() =>
    this.data.users().filter((u) => u.role === 'ADMIN_KEL'),
  );

  readonly daftarRapat = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    if (user.role === 'ADMIN_KEL') return this.data.agendaRapatsSorted();
    if (user.role === 'KOORD_RW' && user.rwId) return this.data.agendaUntukRw(user.rwId);
    return [];
  });

  readonly daftarKerjaBakti = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    if (user.role === 'ADMIN_KEL') return this.data.kerjaBaktiSorted();
    if (user.role === 'KOORD_RW' && user.rwId) return this.data.kerjaBaktiUntukRw(user.rwId);
    return [];
  });

  labelJenis(j: JenisPesertaAgenda): string {
    const map: Record<JenisPesertaAgenda, string> = {
      RT: 'Ketua RT',
      RW: 'Ketua RW',
      STAF: 'Staf',
      TAMU: 'Tamu',
      LMK: 'Perwakilan LMK',
    };
    return map[j];
  }

  labelStatusAgenda(s: StatusAgendaRapat): string {
    const map: Record<StatusAgendaRapat, string> = {
      DIJADWALKAN: 'Dijadwalkan',
      BERLANGSUNG: 'Berlangsung',
      SELESAI: 'Selesai',
      DIBATALKAN: 'Dibatalkan',
    };
    return map[s];
  }

  labelStatusKb(s: StatusKerjaBakti): string {
    const map: Record<StatusKerjaBakti, string> = {
      DIJADWALKAN: 'Dijadwalkan',
      BERLANGSUNG: 'Berlangsung',
      SELESAI: 'Selesai',
      DITUNDA: 'Ditunda',
    };
    return map[s];
  }

  badgeAgenda(s: StatusAgendaRapat): string {
    if (s === 'SELESAI') return 'bg-emerald-100 text-emerald-800';
    if (s === 'BERLANGSUNG') return 'bg-blue-100 text-blue-800';
    if (s === 'DIBATALKAN') return 'bg-slate-100 text-slate-600';
    return 'bg-amber-100 text-amber-900';
  }

  badgeKb(s: StatusKerjaBakti): string {
    if (s === 'SELESAI') return 'bg-emerald-100 text-emerald-800';
    if (s === 'BERLANGSUNG') return 'bg-blue-100 text-blue-800';
    if (s === 'DITUNDA') return 'bg-slate-100 text-slate-600';
    return 'bg-amber-100 text-amber-900';
  }

  hitungHadir(row: AgendaRapat): number {
    return row.peserta.filter((p) => p.hadir).length;
  }

  pilihRapat(row: AgendaRapat): void {
    this.selectedRapatId.update((id) => (id === row.id ? null : row.id));
  }

  tambahSemuaRw(): void {
    const existing = new Set(this.formPeserta().map((p) => p.rwId).filter(Boolean));
    const add = this.data.buildPesertaSemuaRw().filter((p) => p.rwId && !existing.has(p.rwId));
    this.formPeserta.update((list) => [...list, ...add]);
  }

  tambahSemuaRt(): void {
    const existing = new Set(
      this.formPeserta()
        .filter((p) => p.jenis === 'RT')
        .map((p) => p.rtId)
        .filter(Boolean),
    );
    const add = this.data.buildPesertaSemuaRt().filter((p) => p.rtId && !existing.has(p.rtId));
    if (!add.length) {
      this.data.showToast('Semua Ketua RT sudah di undangan.');
      return;
    }
    this.formPeserta.update((list) => [...list, ...add]);
  }

  tambahSemuaStaf(): void {
    const existingNames = new Set(
      this.formPeserta()
        .filter((p) => p.jenis === 'STAF')
        .map((p) => p.nama.toLowerCase()),
    );
    const add = this.stafKelurahan()
      .filter((u) => !existingNames.has(u.name.toLowerCase()))
      .map((u) => ({
        jenis: 'STAF' as const,
        nama: u.name,
        instansi: u.jabatan,
        telepon: u.telepon,
      }));
    if (!add.length) {
      this.data.showToast('Semua staf sudah di undangan.');
      return;
    }
    this.formPeserta.update((list) => [...list, ...add]);
  }

  tambahDraftPeserta(): void {
    const d = this.draftPeserta;
    if (d.jenis === 'STAF') {
      const u = this.data.getUser(d.userId);
      if (!u) {
        this.data.showToast('Pilih staf kelurahan dulu.');
        return;
      }
      if (this.formPeserta().some((p) => p.jenis === 'STAF' && p.nama === u.name)) {
        this.data.showToast('Staf sudah di undangan.');
        return;
      }
      this.formPeserta.update((list) => [
        ...list,
        { jenis: 'STAF', nama: u.name, instansi: u.jabatan, telepon: u.telepon },
      ]);
      d.userId = '';
      return;
    }
    if (d.jenis === 'RW') {
      const rw = this.data.getRw(d.rwId);
      if (!rw) {
        this.data.showToast('Pilih RW dulu.');
        return;
      }
      if (this.formPeserta().some((p) => p.rwId === rw.id && p.jenis === 'RW')) {
        this.data.showToast('RW sudah di undangan.');
        return;
      }
      this.formPeserta.update((list) => [
        ...list,
        { jenis: 'RW', nama: rw.namaKetua, rwId: rw.id, telepon: rw.telepon },
      ]);
      d.rwId = '';
      return;
    }
    if (d.jenis === 'RT') {
      const rt = this.data.getRt(d.rtId);
      if (!rt) {
        this.data.showToast('Pilih RT dulu.');
        return;
      }
      if (this.formPeserta().some((p) => p.rtId === rt.id)) {
        this.data.showToast('RT sudah di undangan.');
        return;
      }
      this.formPeserta.update((list) => [
        ...list,
        {
          jenis: 'RT',
          nama: rt.namaKetua,
          rtId: rt.id,
          rwId: rt.rwId,
          telepon: rt.telepon,
        },
      ]);
      d.rtId = '';
      return;
    }
    if (d.jenis === 'LMK') {
      const a = this.data.anggotaLmks().find((x) => x.id === d.lmkId);
      if (!a) {
        this.data.showToast('Pilih perwakilan LMK dulu (Master Data).');
        return;
      }
      if (this.formPeserta().some((p) => p.jenis === 'LMK' && p.rwId === a.rwId)) {
        this.data.showToast('Perwakilan LMK RW itu sudah di undangan.');
        return;
      }
      const rw = this.data.getRw(a.rwId);
      this.formPeserta.update((list) => [
        ...list,
        {
          jenis: 'LMK',
          nama: a.nama,
          rwId: a.rwId,
          instansi: `Perwakilan LMK · ${rw ? this.data.labelRw(rw.nomor) : 'RW'}`,
          telepon: a.telepon,
        },
      ]);
      d.lmkId = '';
      return;
    }
    if (!d.nama.trim()) {
      this.data.showToast('Nama wajib diisi.');
      return;
    }
    this.formPeserta.update((list) => [
      ...list,
      {
        jenis: d.jenis,
        nama: d.nama.trim(),
        instansi: d.instansi.trim() || undefined,
        telepon: d.telepon.trim() || undefined,
      },
    ]);
    d.nama = '';
    d.instansi = '';
    d.telepon = '';
  }

  tambahSemuaLmk(): void {
    const existing = new Set(
      this.formPeserta()
        .filter((p) => p.jenis === 'LMK')
        .map((p) => p.rwId)
        .filter(Boolean),
    );
    const add = this.data
      .anggotaLmksSorted()
      .filter((a) => a.isActive && !existing.has(a.rwId))
      .map((a) => {
        const rw = this.data.getRw(a.rwId);
        return {
          jenis: 'LMK' as const,
          nama: a.nama,
          rwId: a.rwId,
          instansi: `Perwakilan LMK · ${rw ? this.data.labelRw(rw.nomor) : 'RW'}`,
          telepon: a.telepon,
        };
      });
    if (!add.length) {
      this.data.showToast('Semua perwakilan LMK sudah di undangan.');
      return;
    }
    this.formPeserta.update((list) => [...list, ...add]);
  }

  hapusDraftPeserta(index: number): void {
    this.formPeserta.update((list) => list.filter((_, i) => i !== index));
  }

  onFormPdfRapat(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.formRapatPdfFile = file;
    this.formRapatPdfName.set(file?.name ?? null);
  }

  simpanRapat(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const row = this.data.addAgendaRapat({
      ...this.formRapat,
      dibuatOleh: user.name,
      peserta: this.formPeserta(),
      undanganPdf: this.formRapatPdfFile,
    });
    if (!row) return;
    this.formRapat = {
      jenisKegiatan: 'RAPAT',
      judul: '',
      tanggal: '',
      jamMulai: '09:00',
      tempat: 'Ruang Rapat Lt. 2 Kelurahan Rawajati',
      ringkasanAgenda: '',
    };
    this.formPeserta.set([]);
    this.formRapatPdfFile = null;
    this.formRapatPdfName.set(null);
    this.selectedRapatId.set(row.id);
  }

  onPdfRapat(id: string, ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    const user = this.auth.currentUser();
    if (!file || !user) return;
    this.data.uploadUndanganAgendaPdf(id, file, user.name);
    (ev.target as HTMLInputElement).value = '';
  }

  hapusPdfRapat(id: string): void {
    this.data.hapusUndanganAgendaPdf(id);
  }

  waBlastRapat(row: AgendaRapat, rw: Rw): string | null {
    return this.data.buildWaBlastAgendaRw(row, rw);
  }

  catatBlastRapat(agendaId: string, rwId: string): void {
    this.data.catatBlastUndanganAgendaRw(agendaId, rwId);
  }

  sudahBlastRw(row: AgendaRapat, rwId: string): boolean {
    return !!row.undanganBlastRwIds?.includes(rwId);
  }

  waBlastLmk(row: AgendaRapat, p: PesertaAgenda): string | null {
    return this.data.buildWaBlastAgendaLmk(row, p);
  }

  waBlastRt(row: AgendaRapat, p: PesertaAgenda): string | null {
    return this.data.buildWaBlastAgendaRt(row, p);
  }

  catatBlastLmk(agendaId: string, pesertaId: string): void {
    this.data.catatBlastUndanganAgendaPeserta(agendaId, pesertaId);
  }

  sudahBlastPeserta(row: AgendaRapat, pesertaId: string): boolean {
    return !!row.undanganBlastPesertaIds?.includes(pesertaId);
  }

  setStatusRapat(id: string, status: StatusAgendaRapat): void {
    this.data.updateStatusAgenda(id, status);
  }

  hapusRapat(id: string): void {
    this.data.hapusAgendaRapat(id);
    if (this.selectedRapatId() === id) this.selectedRapatId.set(null);
  }

  toggleHadir(agendaId: string, pesertaId: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.data.setKehadiranPeserta(agendaId, pesertaId, checked);
  }

  setNotulenDraft(id: string, value: string): void {
    this.notulenDraft.update((m) => ({ ...m, [id]: value }));
  }

  simpanNotulen(id: string): void {
    const text = this.notulenDraft()[id] ?? this.data.getAgendaRapat(id)?.notulen ?? '';
    this.data.simpanNotulenAgenda(id, text);
  }

  onPilihRwKb(rwId: string): void {
    const rw = this.data.getRw(rwId);
    if (!rw) return;
    this.formKb.picNama = rw.namaKetua;
    if (!this.formKb.lokasi) {
      this.formKb.lokasi = `Area ${this.data.labelRw(rw.nomor)}`;
    }
  }

  onFormPdf(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.formKbPdfFile = file;
    this.formKbPdfName.set(file?.name ?? null);
  }

  simpanKerjaBakti(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const row = this.data.addKerjaBakti({
      ...this.formKb,
      dibuatOleh: user.name,
      undanganPdf: this.formKbPdfFile,
    });
    if (!row) return;
    this.formKb = {
      rwId: '',
      tanggal: '',
      lokasi: '',
      picNama: '',
      deskripsi: 'Kerja bakti bergilir: bersih lingkungan wilayah RW.',
    };
    this.formKbPdfFile = null;
    this.formKbPdfName.set(null);
  }

  bisaKelolaKb(row: KerjaBaktiRw): boolean {
    if (this.isAdmin()) return true;
    const user = this.auth.currentUser();
    return !!user && user.role === 'KOORD_RW' && user.rwId === row.rwId;
  }

  setStatusKb(id: string, status: StatusKerjaBakti): void {
    this.data.updateStatusKerjaBakti(id, status);
  }

  togglePpsuForm(row: KerjaBaktiRw): void {
    if (this.ppsuFormOpen() === row.id) {
      this.ppsuFormOpen.set(null);
      return;
    }
    this.draftPpsu = {
      jumlah: row.ppsuJumlahPersonil ?? 0,
      regu: row.ppsuReguLabel ?? '',
      alatIds: [...(row.ppsuAlatIds ?? [])],
      kendaraan: row.ppsuKendaraan ?? '',
    };
    this.ppsuFormOpen.set(row.id);
  }

  toggleAlatDraft(alatId: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.draftPpsu.alatIds.includes(alatId)) {
        this.draftPpsu.alatIds = [...this.draftPpsu.alatIds, alatId];
      }
    } else {
      this.draftPpsu.alatIds = this.draftPpsu.alatIds.filter((id) => id !== alatId);
    }
  }

  simpanPpsu(id: string): void {
    this.data.simpanDukunganPpsuKerjaBakti(id, {
      ppsuJumlahPersonil: Number(this.draftPpsu.jumlah) || undefined,
      ppsuReguLabel: this.draftPpsu.regu,
      ppsuAlatIds: this.draftPpsu.alatIds,
      ppsuKendaraan: this.draftPpsu.kendaraan,
    });
    this.ppsuFormOpen.set(null);
  }

  onFotoKb(id: string, ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.data.uploadFotoKerjaBakti(id, file);
  }

  onPdfUndangan(id: string, ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    const user = this.auth.currentUser();
    if (!file || !user) return;
    this.data.uploadUndanganKerjaBaktiPdf(id, file, user.name);
    (ev.target as HTMLInputElement).value = '';
  }

  hapusPdfUndangan(id: string): void {
    this.data.hapusUndanganKerjaBaktiPdf(id);
  }

  waBlastKb(row: KerjaBaktiRw): string | null {
    return this.data.buildWaBlastKerjaBakti(row);
  }

  catatBlastKb(id: string): void {
    this.data.catatBlastUndanganKerjaBakti(id);
  }

  hapusKb(id: string): void {
    this.data.hapusKerjaBakti(id);
  }
}
