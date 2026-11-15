import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/** Modal webcam (laptop/HP) via getUserMedia — untuk demo develop di browser. */
@Component({
  selector: 'app-camera-capture',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-3 sm:items-center" role="dialog">
      <div class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 class="text-base font-bold text-slate-900">Ambil foto dari kamera</h2>
          <button type="button" class="btn-secondary !min-h-9 !px-3 !py-1.5 text-sm" (click)="tutup()">
            Tutup
          </button>
        </div>

        <div class="space-y-3 p-4">
          @if (error()) {
            <p class="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{{ error() }}</p>
            <p class="text-xs text-slate-500">
              Izinkan akses kamera di browser, atau pakai tombol <strong>Pilih dari Galeri</strong>.
            </p>
          } @else {
            <div class="aspect-[4/3] overflow-hidden rounded-xl bg-slate-900">
              <video #video autoplay playsinline muted class="h-full w-full object-cover"></video>
            </div>
            <canvas #canvas class="hidden"></canvas>
            <p class="text-xs text-slate-500">
              Preview kamera laptop/HP. Klik <strong>Ambil Foto</strong> lalu izinkan akses jika diminta browser.
            </p>
          }

          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="btn-secondary" (click)="tutup()">Batal</button>
            <button type="button" class="btn-primary" [disabled]="!!error() || !ready()" (click)="ambil()">
              Ambil Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CameraCaptureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  @Output() captured = new EventEmitter<File>();
  @Output() closed = new EventEmitter<void>();

  readonly error = signal('');
  readonly ready = signal(false);

  private stream: MediaStream | null = null;

  async ngAfterViewInit(): Promise<void> {
    await this.mulaiKamera();
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  private async mulaiKamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set('Browser ini tidak mendukung kamera langsung. Pakai Galeri saja.');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      const video = this.videoRef?.nativeElement;
      if (video) {
        video.srcObject = this.stream;
        await video.play();
      }
      this.ready.set(true);
    } catch {
      this.error.set(
        'Kamera tidak bisa dibuka. Cek izin browser (ikon gembok di address bar) lalu refresh.',
      );
    }
  }

  ambil(): void {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas || !this.ready()) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const file = new File([blob], `kamera-${stamp}.jpg`, { type: 'image/jpeg' });
        this.stopStream();
        this.captured.emit(file);
      },
      'image/jpeg',
      0.9,
    );
  }

  tutup(): void {
    this.stopStream();
    this.closed.emit();
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.ready.set(false);
  }
}
