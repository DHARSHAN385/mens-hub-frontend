// Centralized config for URLs and fallback images
export const CONFIG = {
  FALLBACK_BANNER: import.meta.env.VITE_FALLBACK_BANNER || '',
  FALLBACK_CATEGORY: import.meta.env.VITE_FALLBACK_CATEGORY || '',
  FALLBACK_PRODUCT: import.meta.env.VITE_FALLBACK_PRODUCT || '',
  FALLBACK_IMG: import.meta.env.VITE_FALLBACK_IMG || '',
  API_URL: import.meta.env.VITE_API_URL || '',
  WHATSAPP_ADMIN: import.meta.env.VITE_WHATSAPP_ADMIN || '',
  WHATSAPP_TEMPLATE: import.meta.env.VITE_WHATSAPP_TEMPLATE || '',
  INSTAGRAM_URL: import.meta.env.VITE_INSTAGRAM_URL || '',
  MAPS_URL: import.meta.env.VITE_MAPS_URL || '',
  PLACEHOLDER_IMG: import.meta.env.VITE_PLACEHOLDER_IMG || '',
};
