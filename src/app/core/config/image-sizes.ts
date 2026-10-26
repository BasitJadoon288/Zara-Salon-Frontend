// Admin ko dikhane ke liye: har jagah ki picture kitni badi honi chahiye.
// minWidth se chhoti picture website par dhundhli (blurry) lag sakti hai.
export const IMAGE_SIZES = {
  slider:  { label: '1920 × 800 px', shape: 'wide landscape',  minWidth: 1200 },
  service: { label: '800 × 600 px',  shape: 'landscape (4:3)', minWidth: 600 },
  about:   { label: '1200 × 850 px', shape: 'landscape',       minWidth: 800 }
} as const;
