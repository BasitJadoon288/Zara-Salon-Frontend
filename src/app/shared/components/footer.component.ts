import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SALON } from '../../core/config/salon.config';
@Component({
  selector: 'app-footer', standalone: true, imports: [RouterLink],
  template: `<footer><div class="container grid">
    <div><h3>{{ s.name }}</h3><p>Makeup, hair, skin, mehndi and bridal services by skilled professionals.</p></div>
    <div><h4>Contact</h4><p>📞 {{ s.phone }}<br>✉ {{ s.email }}<br>📍 {{ s.address }}</p></div>
    <div><h4>Links</h4><p><a routerLink="/about">Our Story</a><br><a routerLink="/contact">Contact</a><br><a routerLink="/admin">Admin</a></p></div>
  </div><p class="copy">© 2026 Developed by Codex Software House. All rights reserved.</p></footer>`,
  styles: [`footer{background:var(--dark);color:#d9c3cc;padding-top:50px}footer h3,footer h4{color:#fff;margin-bottom:10px}
  .copy{text-align:center;border-top:1px solid #ffffff22;margin-top:30px;padding:16px;font-size:13px}`]
})
export class FooterComponent { s = SALON; }
