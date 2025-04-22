import { toast } from 'react-hot-toast';

// Cart notifications
export const cartNotifications = {
  itemAdded: (productName: string) => {
    return toast.success(`${productName} added to cart`, {
      duration: 3000,
      position: 'bottom-right',
      style: {
        background: '#333',
        color: '#fff',
      },
      icon: '🛒',
    });
  },
  
  itemRemoved: (productName: string = 'Item') => {
    return toast.success(`${productName} removed from cart`, {
      duration: 3000,
      position: 'bottom-right',
    });
  },
  
  clearCart: () => {
    return toast.success('Cart has been cleared', {
      duration: 3000,
      position: 'bottom-right',
    });
  }
};

// Wishlist notifications
export const wishlistNotifications = {
  itemAdded: () => {
    return toast.success('Item added to wishlist', {
      duration: 3000,
      position: 'bottom-right',
      icon: '❤️',
    });
  },
  
  itemRemoved: () => {
    return toast.success('Item removed from wishlist', {
      duration: 3000,
      position: 'bottom-right',
    });
  }
};

// Authentication notifications
export const authNotifications = {
  loginSuccess: () => {
    return toast.success('Logged in successfully', {
      duration: 3000,
      position: 'bottom-right',
    });
  },
  
  loginError: (message: string = 'Invalid credentials') => {
    return toast.error(message, {
      duration: 4000,
      position: 'bottom-right',
    });
  },
  
  logoutSuccess: () => {
    return toast.success('Logged out successfully', {
      duration: 3000,
      position: 'bottom-right',
    });
  },
  
  signupSuccess: () => {
    return toast.success('Account created successfully', {
      duration: 3000,
      position: 'bottom-right',
    });
  },
  
  signupError: (message: string = 'Error creating account') => {
    return toast.error(message, {
      duration: 4000,
      position: 'bottom-right',
    });
  }
};
