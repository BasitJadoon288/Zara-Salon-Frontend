import { Component, Input, OnChanges } from '@angular/core';
import { SalonService } from '../../core/models/models';

@Component({
  selector: 'app-service-card',
  standalone: true,
  template: `
    <div class="card">
      @if (imageSrc) {
        <img [src]="imageSrc" [alt]="service.title" (error)="onImageError()">
      } @else {
        <div class="ic">{{ service.icon }}</div>
      }
      <h3>{{ service.title }}</h3>
      <p>{{ service.description }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .card {
      background: #fff;
      padding: 20px;
      border-radius: 14px;
      box-shadow: 0 6px 22px #0001;
      transition: .3s;
      height: 100%;
      box-sizing: border-box;
    }
    .card:hover { transform: translateY(-6px); }

    .ic { font-size: 44px; }

    img {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      object-position: center top;
      border-radius: 10px;
      margin-bottom: 12px;
    }

    h3 { margin: 0 0 6px; font-size: 17px; }
    p  { margin: 0; font-size: 14px; line-height: 1.5; }

    @media (max-width: 768px) {
      .card { padding: 12px; }
      h3 { font-size: 15px; }
      p  { font-size: 12.5px; }
      .card:hover { transform: none; }
    }
  `]
})
export class ServiceCardComponent implements OnChanges {
  @Input({ required: true }) service!: SalonService;

  // 0 = admin ki upload ki hui picture, 1 = assets/images/services/ wali purani picture, 2 = emoji
  private stage = 1;

  ngOnChanges() { this.stage = this.service.imageUrl ? 0 : 1; }

  get imageSrc(): string | null {
    if (this.stage === 0) return this.service.imageUrl ?? null;
    if (this.stage === 1) return this.staticUrl;
    return null;
  }

  onImageError() { this.stage++; }

  private get staticUrl(): string {
    const slug = this.service.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `assets/images/services/${slug}.jpg`;
  }
}
