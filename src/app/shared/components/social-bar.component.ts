import { Component } from '@angular/core';
import { SOCIAL } from '../../core/config/salon.config';

const WA_TEXT = 'Assalam o Alaikum, I would like to book an appointment at Zara Beauty Studio.';

@Component({
  selector: 'app-social-bar', standalone: true,
  template: `<aside class="bar">
    @for (l of links; track l.name) {
      <a [href]="l.url" target="_blank" rel="noopener" [attr.aria-label]="l.name" [style.background]="l.color">
        <i [class]="l.icon"></i>
      </a>
    }
  </aside>`,
  styles: [`
  .bar{position:fixed;right:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px;z-index:60}
  a{width:46px;height:46px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;border-radius:8px 0 0 8px;transition:width .25s}
  a:hover{width:58px}`]
})
export class SocialBarComponent {
  links = [
    { name: 'WhatsApp', url: SOCIAL.whatsapp ? `https://wa.me/${SOCIAL.whatsapp}?text=${encodeURIComponent(WA_TEXT)}` : '', icon: 'fa-brands fa-whatsapp', color: '#25d366' },
    { name: 'Facebook', url: SOCIAL.facebook, icon: 'fa-brands fa-facebook-f', color: '#b0285a' },
    { name: 'Instagram', url: SOCIAL.instagram, icon: 'fa-brands fa-instagram', color: '#b0285a' },
    { name: 'YouTube', url: SOCIAL.youtube, icon: 'fa-brands fa-youtube', color: '#b0285a' },
    { name: 'TikTok', url: SOCIAL.tiktok, icon: 'fa-brands fa-tiktok', color: '#b0285a' }
  ].filter(l => l.url);
}