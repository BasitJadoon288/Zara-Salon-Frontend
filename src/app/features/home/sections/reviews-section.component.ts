import {
  Component,
  inject,
  signal,
  OnDestroy,
  OnInit,
  HostListener
} from '@angular/core';

import { SalonApiService } from '../../../core/services/salon-api.service';
import { SectionTitleComponent } from '../../../shared/components/section-title.component';
import { Review } from '../../../core/models/models';
import { REVIEWS } from '../home.data';

@Component({
  selector: 'app-reviews-section',
  standalone: true,
  imports: [SectionTitleComponent],

  template: `
    <section class="soft center">
      <div class="container">
        <app-section-title
          eyebrow="Feedback"
          title="Customer Reviews"
        />

        <div class="slider">
          <div
            class="track"
            [style.transform]="
              'translateX(-' + currentIndex() * (100 / itemsPerPage()) + '%)'
            "
            [style.transition]="transitionEnabled()
              ? 'transform 0.6s ease-in-out'
              : 'none'"
            (transitionend)="onTransitionEnd()"
          >
            @for (r of displayReviews(); track $index) {
              <div
                class="slide"
                [style.flex]="'0 0 ' + (100 / itemsPerPage()) + '%'"
              >
                <div class="card">
                  <div class="stars">
                    {{ '★'.repeat(r.rating) }}
                  </div>

                  <p><em>"{{ r.text }}"</em></p>

                  <h4>{{ r.name }}</h4>
                </div>
              </div>
            }
          </div>
        </div>

        @if (reviews().length > itemsPerPage()) {
          <div class="dots">
            @for (dot of pageDots(); track $index) {
              <button
                type="button"
                class="dot"
                [class.active]="activeDot() === dot"
                [attr.aria-label]="'Show reviews starting at ' + (dot + 1)"
                (click)="goToSlide(dot)"
              ></button>
            }
          </div>
        }
      </div>
    </section>
  `,

  styles: [`
    .soft {
      background: var(--soft);
      padding: 60px 0;
    }

    .slider {
      overflow: hidden;
      margin-top: 25px;
      width: 100%;
    }

    .track {
      display: flex;
      align-items: stretch;
      will-change: transform;
    }

    .slide {
      min-width: 0;
      box-sizing: border-box;
      padding: 0 12px;
    }

    .card {
      height: 100%;
      box-sizing: border-box;
      background: #fff;
      padding: 26px;
      border-radius: 14px;
      box-shadow: 0 6px 22px #0001;
      overflow-wrap: anywhere;
    }

    .stars {
      color: #e0a21b;
      letter-spacing: 3px;
      margin-bottom: 8px;
    }

    p {
      line-height: 1.7;
    }

    h4 {
      margin-top: 10px;
    }

    .dots {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 9px;
      margin-top: 25px;
    }

    .dot {
      width: 10px;
      height: 10px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: #c8c8c8;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .dot.active {
      background: #e0a21b;
      transform: scale(1.25);
    }

    @media (max-width: 1024px) {
      .card {
        padding: 20px;
      }
    }

    @media (max-width: 520px) {
      .soft {
        padding: 40px 0;
      }

      .slide {
        padding: 0 6px;
      }

      .card {
        padding: 16px 12px;
      }

      .stars {
        letter-spacing: 1px;
        font-size: 14px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .track {
        transition: none !important;
      }
    }
  `]
})
export class ReviewsSectionComponent implements OnInit, OnDestroy {
  private api = inject(SalonApiService);

  reviews = signal<Review[]>(
    REVIEWS.map(r => ({
      ...r,
      rating: 5,
      visible: true
    }))
  );

  displayReviews = signal<Review[]>([]);
  currentIndex = signal(0);
  itemsPerPage = signal(4);
  pageDots = signal<number[]>([]);
  transitionEnabled = signal(true);

  private timer?: ReturnType<typeof setInterval>;
  private resetTimer?: ReturnType<typeof setTimeout>;
  private readonly intervalMs = 2000;

  activeDot = signal(0);

  ngOnInit(): void {
    this.updateItemsPerPage();
    this.api.getReviews().subscribe({
      next: list => {
        if (list.length) {
          this.reviews.set(list);
        }
        this.prepareSlider();
        this.startSlider();
      },
      error: () => {
        this.prepareSlider();
        this.startSlider();
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateItemsPerPage();
    this.prepareSlider();
    this.startSlider();
  }

  private updateItemsPerPage(): void {
    this.itemsPerPage.set(
      typeof window !== 'undefined' && window.innerWidth <= 520
        ? 2
        : 4
    );
  }

  private prepareSlider(): void {
    const list = this.reviews();
    const count = list.length;
    const perPage = this.itemsPerPage();

    this.stopSlider();

    this.transitionEnabled.set(false);
    this.currentIndex.set(0);
    this.activeDot.set(0);

    if (count > perPage) {
      this.displayReviews.set([
        ...list,
        ...list.slice(0, perPage)
      ]);
    } else {
      this.displayReviews.set([...list]);
    }

    const maxIndex = Math.max(0, count - 1);

    this.pageDots.set(
      Array.from({ length: maxIndex + 1 }, (_, i) => i)
    );

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.transitionEnabled.set(true);
      });
    });
  }

  private startSlider(): void {
    this.stopSlider();

    if (this.reviews().length <= this.itemsPerPage()) {
      return;
    }

    this.timer = setInterval(() => {
      this.currentIndex.update(index => index + 1);

      const nextIndex = this.currentIndex();
      this.activeDot.set(
        nextIndex >= this.reviews().length ? 0 : nextIndex
      );
    }, this.intervalMs);
  }

  onTransitionEnd(): void {
    const count = this.reviews().length;

    if (count <= this.itemsPerPage()) return;

    if (this.currentIndex() >= count) {
      this.transitionEnabled.set(false);
      this.currentIndex.set(0);

      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }

      this.resetTimer = setTimeout(() => {
        this.transitionEnabled.set(true);
        this.resetTimer = undefined;
      }, 50);
    }
  }

  goToSlide(index: number): void {
    const count = this.reviews().length;

    if (index < 0 || index >= count) return;

    this.transitionEnabled.set(true);
    this.currentIndex.set(index);
    this.activeDot.set(index);
    this.startSlider();
  }

  private stopSlider(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopSlider();
  }
}