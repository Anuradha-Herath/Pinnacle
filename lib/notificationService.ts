import { toast } from 'react-hot-toast';

// User authentication notifications
export const authNotifications = {
  loginSuccess: () => toast.success('Welcome back!'),
  loginError: (error: string) => toast.error(`Login failed: ${error}`),
  signupSuccess: () => toast.success('Account created successfully!'),
  signupError: (error: string) => toast.error(`Registration failed: ${error}`),
  logoutSuccess: () => toast.success('Logged out successfully'),
  passwordResetSent: () => toast.success('Password reset instructions sent to your email'),
  passwordResetSuccess: () => toast.success('Password updated successfully'),
  accessDenied: () => toast.error('Access denied. Please log in.'),
};

// Shopping cart notifications
export const cartNotifications = {
  addedToCart: (productName: string) => toast.success(`${productName} added to cart`),
  removedFromCart: (productName: string) => toast.success(`${productName} removed from cart`),
  cartUpdated: () => toast.success('Cart updated'),
  cartError: (error: string) => toast.error(`Cart error: ${error}`),
};

// Wishlist notifications
export const wishlistNotifications = {
  addedToWishlist: (productName: string) => toast.success(`${productName} added to wishlist`),
  removedFromWishlist: (productName: string) => toast.success(`${productName} removed from wishlist`),
  wishlistError: (error: string) => toast.error(`Wishlist error: ${error}`),
};

// Order notifications
export const orderNotifications = {
  orderPlaced: (orderNumber: string) => toast.success(`Order #${orderNumber} placed successfully`),
  orderError: (error: string) => toast.error(`Order error: ${error}`),
  paymentSuccess: () => toast.success('Payment processed successfully'),
  paymentError: (error: string) => toast.error(`Payment failed: ${error}`),
};

// Admin notifications
export const adminNotifications = {
  productAdded: () => toast.success('Product added successfully'),
  productUpdated: () => toast.success('Product updated successfully'),
  productDeleted: () => toast.success('Product deleted'),
  categoryAdded: () => toast.success('Category added successfully'),
  categoryUpdated: () => toast.success('Category updated successfully'),
  categoryDeleted: () => toast.success('Category deleted'),
  userUpdated: () => toast.success('User information updated'),
};
