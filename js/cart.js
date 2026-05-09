// Sever Gallery Cart System
const SeverCart = {
  // Get cart from localStorage
  getCart() {
    const cart = localStorage.getItem('severCart');
    return cart ? JSON.parse(cart) : [];
  },

  // Save cart to localStorage
  saveCart(cart) {
    localStorage.setItem('severCart', JSON.stringify(cart));
    this.updateCartCount();
  },

  // Add item to cart
  addItem(item) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(
      i => i.priceId === item.priceId && (i.size || '') === (item.size || '')
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += item.quantity;
    } else {
      cart.push(item);
    }

    this.saveCart(cart);
    this.showNotification(`${item.name} added to cart!`);
  },

  // Remove item from cart
  removeItem(priceId, size) {
    let cart = this.getCart();
    cart = cart.filter(i => !(i.priceId === priceId && (i.size || '') === (size || '')));
    this.saveCart(cart);
  },

  // Update quantity
  updateQuantity(priceId, size, quantity) {
    const cart = this.getCart();
    const item = cart.find(i => i.priceId === priceId && (i.size || '') === (size || ''));
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        this.removeItem(priceId, size);
      } else {
        this.saveCart(cart);
      }
    }
  },

  // Get cart total
  getTotal() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  // Get cart count
  getCount() {
    const cart = this.getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
  },

  // Update cart count in header
  updateCartCount() {
    const count = this.getCount();
    const cartIcons = document.querySelectorAll('.header__icon[aria-label="Cart"]');
    cartIcons.forEach(icon => {
      let badge = icon.querySelector('.cart-badge');
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'cart-badge';
          icon.style.position = 'relative';
          icon.appendChild(badge);
        }
        badge.textContent = count;
      } else if (badge) {
        badge.remove();
      }
    });
  },

  // Show notification
  showNotification(message) {
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'cart-notification';
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 300);
    }, 2000);
  },

  // Clear cart
  clearCart() {
    localStorage.removeItem('severCart');
    this.updateCartCount();
  },

  // Checkout
  async checkout() {
    const cart = this.getCart();
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error creating checkout: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
};

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
  SeverCart.updateCartCount();
});
