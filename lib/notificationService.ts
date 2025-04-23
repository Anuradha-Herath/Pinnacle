import toast from 'react-hot-toast';

// Common toast configuration
const toastConfig = {
  position: 'bottom-center' as const,
  duration: 5000
};

export const authNotifications = {
  loginSuccess: (message = 'Login successful!') => 
    toast.success(message, toastConfig),
  
  loginError: (message = 'Login failed. Please check your credentials.') => 
    toast.error(message, toastConfig),
  
  signupSuccess: (message = 'Account created successfully!') => 
    toast.success(message, toastConfig),
  
  signupError: (message = 'Failed to create account.') => 
    toast.error(message, toastConfig),
  
  logoutSuccess: (message = 'Logged out successfully!') => 
    toast.success(message, toastConfig),
};

export const cartNotifications = {
  itemAdded: (message = 'Item added to cart!') => 
    toast.success(message, toastConfig),
  
  itemRemoved: (message = 'Item removed from cart.') => 
    toast(message, { ...toastConfig, icon: '🛒' }),
  
  cartUpdated: (message = 'Cart updated successfully.') => 
    toast.success(message, toastConfig),
    
  cartError: (message = 'Failed to update cart.') => 
    toast.error(message, toastConfig),
};

export const wishlistNotifications = {
  itemAdded: (message = 'Item added to wishlist!') => 
    toast.success(message, toastConfig),
  
  itemRemoved: (message = 'Item removed from wishlist.') => 
    toast(message, { ...toastConfig, icon: '❤️' }),
  
  wishlistError: (message = 'Failed to update wishlist.') => 
    toast.error(message, toastConfig),
};

export const generalNotifications = {
  success: (message: string) => 
    toast.success(message, toastConfig),
  
  error: (message: string) => 
    toast.error(message, toastConfig),
  
  info: (message: string) => 
    toast(message, toastConfig),
};
