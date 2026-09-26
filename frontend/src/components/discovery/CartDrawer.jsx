import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { trackRemoveFromCart } from '../../services/tracker';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  theme
}) {
  const isLight = theme === 'light';

  const handleRemove = (item) => {
    trackRemoveFromCart(item, { source: 'cart_drawer' });
    if (onRemoveItem) {
      onRemoveItem(item.id);
    }
  };


  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.numericPrice || 0;
    const qty = item.quantity || 1;
    return acc + price * qty;
  }, 0);

  const totalItemCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={onClose} />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl border-l overflow-hidden ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#061126] border-purple-500/30 text-slate-100'
            }`}
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Your Shopping Cart
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} selected
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body: Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 my-2">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-6">
                  <div className="w-16 h-16 rounded-full bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-sm font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Your Cart is Empty
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Explore our catalog or personalized AI recommendations to add items.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold shadow-md"
                  >
                    Start Browsing Products
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex gap-3 items-center justify-between transition-colors ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a1630] border-purple-500/20'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700/30">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-purple-400 font-medium">{item.category}</p>
                      <p className="text-xs font-mono font-bold text-emerald-500 mt-0.5">{item.price}</p>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5 border rounded-lg p-0.5 bg-slate-950/40">
                        <button
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white text-[10px]"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-5 text-center font-mono font-bold text-xs">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white text-[10px]"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer: Totals & Checkout */}
            {cartItems.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({totalItemCount} items)</span>
                    <span className="font-mono font-bold text-slate-200">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Shipping & Taxes</span>
                    <span className="text-emerald-500 font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className={isLight ? 'text-slate-900' : 'text-white'}>Total</span>
                    <span className="font-mono text-emerald-500 text-base">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => alert("Checkout flow simulated! Order placed successfully.")}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={onClose}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      Continue Browsing
                    </button>
                    {onClearCart && (
                      <button
                        onClick={onClearCart}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 border border-rose-900/30 transition-all"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
