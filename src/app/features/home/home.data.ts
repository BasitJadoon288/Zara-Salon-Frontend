export interface HeroSlide { title: string; text: string; bg: string; }
export interface Review { name: string; text: string; }

// Har slide ke bg mein 3 layers hain: andhera overlay (text padhne ke liye),
// picture, aur picture na mile to gradient rang.
export const HERO_SLIDES: HeroSlide[] = [
  {
    title: 'In Beauty',
    text: 'We help clients look and feel their best, from everyday care to unforgettable wedding days.',
    bg: "linear-gradient(#0008,#0008), url('assets/images/slide1.jpg') center/cover no-repeat, linear-gradient(135deg,#b0285a,#3d0f24)"
  },
  {
    title: 'Bridal Glow',
    text: 'Signature bridal makeovers designed around your style, outfit and story.',
    bg: "linear-gradient(#0008,#0008), url('assets/images/slide2.jpg') center/cover no-repeat, linear-gradient(135deg,#7b2d8e,#2b1620)"
  },
  {
    title: 'Hair & Skin',
    text: 'Trendy styles, colour, facials and treatments by trained professionals.',
    bg: "linear-gradient(#0008,#0008), url('assets/images/slide3.jpg') center/cover no-repeat, linear-gradient(135deg,#c9a24b,#7a2b4a)"
  }
];

export const REVIEWS: Review[] = [
  { name: 'Ayesha K.', text: 'Beautiful bridal makeup, everyone loved my look.' },
  { name: 'Hina R.', text: 'Friendly staff, clean salon and great hair styling.' },
  { name: 'Mariam S.', text: 'My facial was amazing, my skin feels fresh and glowing.' },
  { name: 'Sana A.', text: 'Very professional team. Highly recommended!' }
];