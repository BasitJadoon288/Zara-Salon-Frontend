import { Component, Input } from '@angular/core';
import { SalonService } from '../../core/models/models';

@Component({
  selector: 'app-service-card', standalone: true,
  template: `<div class="card">
    @if (showImage) {
      <img [src]="imageUrl" [alt]="service.title" (error)="showImage = false">
    } @else {
      <div class="ic">{{ service.icon }}</div>
    }
    <h3>{{ service.title }}</h3>
    <p>{{ service.description }}</p>
  </div>`,
  styles: [`
  .card{background:#fff;padding:26px;border-radius:14px;box-shadow:0 6px 22px #0001;transition:.3s;height:100%}
  .card:hover{transform:translateY(-6px)}
  .ic{font-size:44px}
  img{width:100%;height:180px;object-fit:cover;border-radius:10px;margin-bottom:12px}`]
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: SalonService;
  showImage = true;

  get imageUrl(): string {
    const slug = this.service.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `assets/images/services/${slug}.jpg`;
  }
}