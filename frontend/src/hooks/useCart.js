import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getCartItems, 
  addProductToCart, 
  updateProductQuantity, 
  removeProductFromCart, 
  clearUserCart,
  calculateSubtotal,
  calculateCartCount
} from '../services/cartService';

export function useCart(userId = '1000294') {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load cart whenever active user changes
  useEffect(() => {
    let isMounted = true;
    const loadCart = async () => {
      setLoading(true);
      try {
        const items = await getCartItems(userId);
        if (isMounted) {
          setCartItems(items || []);
        }
      } catch (err) {
        console.warn('Error loading user cart:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCart();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Optimistic Add Item
  const addItem = useCallback((product, quantity = 1, metadata = {}) => {
    // 1. Optimistic UI update immediately
    setCartItems((prev) => {
      const pid = String(product.id || product.item_id);
      const existingIdx = prev.findIndex((i) => String(i.id) === pid);
      if (existingIdx >= 0) {
        return prev.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: (item.quantity || 1) + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });

    // 2. Async persistent sync
    addProductToCart(userId, product, quantity, metadata).catch((err) => {
      console.warn('Background cart add sync error:', err);
    });
  }, [userId]);

  // Optimistic Quantity Update
  const updateQuantity = useCallback((product, newQty) => {
    const pid = String(product.id || product.item_id || product);
    if (newQty <= 0) {
      removeItem(product);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        String(item.id) === pid ? { ...item, quantity: newQty } : item
      )
    );

    updateProductQuantity(userId, product, newQty).catch((err) => {
      console.warn('Background cart qty update error:', err);
    });
  }, [userId]);

  // Optimistic Remove Item
  const removeItem = useCallback((product, metadata = {}) => {
    const pid = String(product.id || product.item_id || product);
    setCartItems((prev) => prev.filter((item) => String(item.id) !== pid));

    removeProductFromCart(userId, product, metadata).catch((err) => {
      console.warn('Background cart remove error:', err);
    });
  }, [userId]);

  // Optimistic Clear Cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    clearUserCart(userId).catch((err) => {
      console.warn('Background clear cart error:', err);
    });
  }, [userId]);

  // Computed subtotal & item counts
  const subtotal = useMemo(() => calculateSubtotal(cartItems), [cartItems]);
  const cartCount = useMemo(() => calculateCartCount(cartItems), [cartItems]);

  return {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    cartCount,
    subtotal,
    loading,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  };
}
