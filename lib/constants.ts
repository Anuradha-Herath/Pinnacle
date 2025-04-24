export const API_ENDPOINTS = {
  PRODUCTS: '/api/customer/products',
  TRENDING: '/api/customer/trending',
  CATEGORY: (category: string) => `/api/customer/products?category=${category}`
};

export const CATEGORIES = {
  MEN: {
    id: 'men',
    name: 'Men',
    apiName: 'Men',
    stateKey: 'mens'
  },
  WOMEN: {
    id: 'women',
    name: 'Women',
    apiName: 'Women',
    stateKey: 'womens'
  },
  ACCESSORIES: {
    id: 'accessories',
    name: 'Accessories',
    apiName: 'Accessories',
    stateKey: 'accessories'
  }
};

export const IMAGES = {
  BANNER: '/banner2.jpg',
  MEN: '/shopmen.webp',
  WOMEN: '/shopwomen.webp',
  ACCESSORIES: '/cap.jpg'
};

export const UI_TEXT = {
  TRENDING_TITLE: 'Trending Products',
  BEST_SELLERS: 'Best Sellers',
  SHOP_MEN: 'SHOP MEN',
  SHOP_WOMEN: 'SHOP WOMEN',
  SHOP_ACCESSORIES: 'SHOP ACCESSORIES',
  NO_PRODUCTS_FOUND: 'No products found.',
  NO_PRODUCTS_FOR_GENDER: (gender: string) => `No products found for ${gender}.`,
  NO_ACCESSORIES_FOUND: 'No accessories products found.'
};
