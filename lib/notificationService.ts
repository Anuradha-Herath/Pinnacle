import { toast, ToastOptions } from 'react-hot-toast';

// Default toast options
const defaultOptions: ToastOptions = {
  duration: 3000, // 3 seconds
  position: 'bottom-center',
};

// Authentication notifications
export const authNotifications = {
  loginSuccess: () => toast.success('Successfully logged in', defaultOptions),
  loginError: (message?: string) => toast.error(message || 'Login failed', defaultOptions),
  logoutSuccess: () => toast.success('Successfully logged out', defaultOptions),
  logoutError: () => toast.error('Error during logout', defaultOptions),
  signupSuccess: () => toast.success('Account created successfully', defaultOptions),
  signupError: (message?: string) => toast.error(message || 'Signup failed', defaultOptions),
};

// Cart notifications
export const cartNotifications = {
  itemAdded: (productName?: string) => toast.success(
    productName ? `${productName} added to cart` : 'Item added to cart',
    defaultOptions
  ),
  itemRemoved: () => toast.success('Item removed from cart', defaultOptions),
  itemUpdated: () => toast.success('Cart updated', defaultOptions),
  cartCleared: () => toast.success('Cart cleared', defaultOptions),
};

// Wishlist notifications
export const wishlistNotifications = {
  itemAdded: () => toast.success('Item added to wishlist', defaultOptions),
  itemRemoved: () => toast.success('Item removed from wishlist', defaultOptions),
  wishlistCleared: () => toast.success('Wishlist cleared', defaultOptions),
};

// Generic notifications
export const generalNotifications = {
  success: (message: string) => toast.success(message, defaultOptions),
  error: (message: string) => toast.error(message, defaultOptions),
  info: (message: string) => toast.success(message, { ...defaultOptions, icon: '📢' }),
};
