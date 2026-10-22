import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingModalService } from '../../../core/services/booking-modal.service';
import { HERO_SLIDES } from '../home.data';

@Component({
  selector: 'app-hero-section', standalone: true, imports: [RouterLink],
  template: `<section class="hero" [style.background]="slides[index].bg"><div class="container">
    <p class="eyebrow" style="color:#fff">Ultimate Experience</p>
    <h1>{{ slides[index].title }}</h1><p>{{ slides[index].text }}</p>
    <a routerLink="/about" class="btn outline">Learn More</a>&nbsp;
    <button class="btn" (click)="modal.open()">Appointment</button>
    <div class="dots">@for (s of slides; track s.title; let i = $index) { <span [class.on]="i === index" (click)="index = i"></span> }</div>
  </div></section>`,
  styles: [`.hero{color:#fff;padding:140px 0;transition:background .6s}.hero h1{color:#fff;font-size:56px;margin:8px 0 14px;text-transform:uppercase}
  .hero p{max-width:620px;margin-bottom:24px}.dots{margin-top:30px}
  .dots span{display:inline-block;width:12px;height:12px;border-radius:50%;background:#fff6;margin-right:8px;cursor:pointer}.dots .on{background:#fff}
  @media(max-width:760px){.hero h1{font-size:36px}}`]
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  modal = inject(BookingModalService); slides = HERO_SLIDES; index = 0; private timer?: ReturnType<typeof setInterval>;
  ngOnInit() { this.timer = setInterval(() => (this.index = (this.index + 1) % this.slides.length), 5000); }
  ngOnDestroy() { clearInterval(this.timer); }
}
