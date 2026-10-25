import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingModalService } from '../../../core/services/booking-modal.service';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { Slide } from '../../../core/models/models';
import { HERO_SLIDES, HeroSlide } from '../home.data';

// Har slide ke bg mein 3 layers: andhera overlay (text padhne ke liye), picture, aur picture na mile to gulabi rang
const OVERLAY = 'linear-gradient(#0008,#0008)';
const BACKUP = 'linear-gradient(135deg,#b0285a,#3d0f24)';
const EMPTY: HeroSlide = { title: '', text: '', bg: BACKUP }; // slides aane tak

@Component({
  selector: 'app-hero-section', standalone: true, imports: [RouterLink],
  template: `<section class="hero" [style.background]="current.bg"><div class="container">
    <p class="eyebrow" style="color:#fff">Ultimate Experience</p>
    @if (current.title) { <h1>{{ current.title }}</h1> }
    @if (current.text) { <p>{{ current.text }}</p> }
    <a routerLink="/about" class="btn outline">Learn More</a>&nbsp;
    <button class="btn" (click)="modal.open()">Appointment</button>
    @if (slides.length > 1) {
      <div class="dots">@for (s of slides; track $index) { <span [class.on]="$index === index" (click)="index = $index"></span> }</div>
    }
  </div></section>`,
  styles: [`.hero{color:#fff;padding:140px 0;transition:background .6s}.hero h1{color:#fff;font-size:56px;margin:8px 0 14px;text-transform:uppercase}
  .hero p{max-width:620px;margin-bottom:24px}.dots{margin-top:30px}
  .dots span{display:inline-block;width:12px;height:12px;border-radius:50%;background:#fff6;margin-right:8px;cursor:pointer}.dots .on{background:#fff}
  @media(max-width:760px){.hero h1{font-size:36px}}`]
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  modal = inject(BookingModalService);
  private api = inject(SalonApiService);
  slides: HeroSlide[] = [];
  index = 0;
  private timer?: ReturnType<typeof setInterval>;

  get current(): HeroSlide { return this.slides[this.index] ?? EMPTY; }

  ngOnInit() {
    // Admin ki upload ki hui slides; koi na ho (ya API na chale) to purani assets/images/slide1-3.jpg wali slides
    this.api.getSlides().subscribe({
      next: list => this.setSlides(list.length ? list.map(s => this.toHero(s)) : HERO_SLIDES),
      error: () => this.setSlides(HERO_SLIDES)
    });
    this.timer = setInterval(() => { if (this.slides.length > 1) this.index = (this.index + 1) % this.slides.length; }, 5000);
  }
  ngOnDestroy() { clearInterval(this.timer); }

  private setSlides(list: HeroSlide[]) { this.slides = list; this.index = 0; }
  private toHero(s: Slide): HeroSlide {
    return { title: s.title, text: s.text, bg: `${OVERLAY}, url('${s.imageUrl}') center/cover no-repeat, ${BACKUP}` };
  }
}
