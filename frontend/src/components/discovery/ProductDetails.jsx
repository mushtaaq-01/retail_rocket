import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingCart, 
  Star, 
  Tag, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Plus, 
  Minus,
  Check
} from 'lucide-react';
import { enrichProduct } from '../../utils/productCatalog';
import { trackProductView, trackAddToCart } from '../../services/tracker';

export default function ProductDetails({ 
  product: rawProduct, 
  onClose, 
  onAddToCart,
  cartQuantity = 0,
  theme 
}) {
  const [selectedQty, setSelectedQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  
  const product = rawProduct ? enrichProduct(rawProduct) : null;
  const isLight = theme === 'light';

  // Automatically track product_view event when details open
  useEffect(() => {
    if (product) {
      trackProductView(product, { trigger: 'modal_open' });
    }
  }, [product?.id]);

  if (!product) return null;

  const handleAdd = () => {
    trackAddToCart(product, selectedQty, { source: 'product_details_modal' });
    onAddToCart && onAddToCart(product, selectedQty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className={`relative w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl border overflow-hidden transition-colors ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#0a1630] border-purple-500/30 text-slate-100 shadow-purple-950/50'
          }`}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-5 right-5 w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Left: Product Image */}
            <div className="space-y-3">
              <div className="w-full h-72 md:h-84 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/20 relative shadow-inner">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono font-bold text-sm shadow-md">
                  {product.price}
                </div>
              </div>

              {/* Guarantees badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}>
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>100% Genuine</span>
                </div>
                <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}>
                  <Truck className="w-4 h-4 text-cyan-500" />
                  <span>Fast Delivery</span>
                </div>
                <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}>
                  <RotateCcw className="w-4 h-4 text-emerald-500" />
                  <span>7-Day Return</span>
                </div>
              </div>
            </div>

            {/* Right: Info & Controls */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    {product.brand}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-cyan-500" /> {product.category}
                  </span>
                </div>

                <h2 className={`text-xl font-bold font-['Outfit'] leading-snug ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {product.name}
                </h2>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="ml-1 text-sm font-bold font-mono">{product.rating}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    ({product.reviewsCount} verified reviews)
                  </span>
                  <span className="text-xs text-emerald-500 font-semibold">• In Stock</span>
                </div>
              </div>

              {/* Price Callout */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
              }`}>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Special Offer Price</p>
                  <h3 className={`text-2xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {product.price}
                  </h3>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                  Inclusive of all taxes
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Overview
                </h4>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {product.description}
                </p>
              </div>

              {/* Metadata Specs */}
              <div className={`text-xs p-3 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#020817] border-purple-500/20 text-slate-400'
              }`}>
                <div className="flex justify-between">
                  <span>Product SKU / ID:</span>
                  <strong className="font-mono text-purple-400">#{product.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Category Classification:</span>
                  <strong className="font-medium text-slate-200">{product.category}</strong>
                </div>
              </div>

              {/* Quantity Selector & Add Button */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Select Quantity:
                  </span>
                  <div className="flex items-center gap-2 border rounded-xl p-1 bg-slate-950/40">
                    <button
                      onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white text-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs">
                      {selectedQty}
                    </span>
                    <button
                      onClick={() => setSelectedQty((q) => q + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAdd}
                    className={`flex-1 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                      justAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4" /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" /> Add {selectedQty} to Cart
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className={`px-5 py-3 rounded-xl border text-xs font-semibold ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
