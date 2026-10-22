import { SalonService } from '../models/models';

export const SALON = {
  name: 'Zara Beauty Studio',
  phone: '+92-300-0000000',
  email: 'info@sabikasalon.com',
  address: 'Karachi, Pakistan'
};

export const SOCIAL = {
  facebook: 'https://www.facebook.com/yourpage',
  instagram: 'https://www.instagram.com/yourpage',
  youtube: 'https://www.youtube.com/@yourpage',
  tiktok: 'https://www.tiktok.com/@yourpage',
  whatsapp: '923001234567'
};

export const BRANCHES = ['Gulshan Branch', 'North Nazimabad Branch', 'Tariq Road Branch'];

export const FALLBACK_SERVICES: SalonService[] = [
  { title: 'Bridal Makeup', description: 'Classic, traditional or modern bridal looks.', icon: '👰' },
  { title: 'Hair Styling', description: 'Cuts, colour and trendy styles.', icon: '💇‍♀️' },
  { title: 'Facial & Therapy', description: 'Deep-cleansing facials.', icon: '✨' }
];