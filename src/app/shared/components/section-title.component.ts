import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-section-title', standalone: true,
  template: `<p class="eyebrow">{{ eyebrow }}</p><h2>{{ title }}</h2>`,
  styles: [`h2{font-size:36px;margin-top:4px}`]
})
export class SectionTitleComponent { @Input() eyebrow = ''; @Input() title = ''; }
