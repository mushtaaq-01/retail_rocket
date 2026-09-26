import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Eye, Tag, Check, Heart } from 'lucide-react';
import { enrichProduct } from '../../utils/productCatalog';
import { trackProductClick, trackWishlist } from '../../services/tracker';

export default function ProductCard({ 
  product: rawProduct, 
  onSelectProduct, 
  onAddToCart, 
  isInCart = false, 
  cartQuantity = 0,
  theme 
}) {
  const product = enrichProduct(rawProduct);
  const isLight = theme === 'light';
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleCardClick = () => {
    trackProductClick(product);
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    trackWishlist(product, nextState);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25 }}
      className={`border rounded-2xl p-4 flex flex-col justify-between group relative overflow-hidden transition-all duration-300 ${
        isLight
          ? 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xl shadow-sm'
          : 'bg-[#0a1630]/90 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/60 hover:shadow-2xl hover:shadow-purple-950/40'
      }`}
    >
      {/* Brand & Category badges + Wishlist */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
            isLight
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-purple-950/60 text-purple-300 border-purple-500/30'
          }`}>
            {product.brand || 'Retail'}
          </span>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium flex items-center gap-1 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <Tag className="w-3 h-3 text-cyan-600" /> {product.category}
            </span>

            {/* Wishlist Button */}
            <button
              onClick={handleToggleWishlist}
              className={`p-1.5 rounded-lg border transition-all ${
                isWishlisted
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-rose-500 border-slate-200'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border-slate-700/50'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Image Container with hover overlay */}
        <div 
          onClick={handleCardClick}
          className={`w-full h-48 rounded-xl border relative overflow-hidden mb-4 bg-slate-950 cursor-pointer group-hover:scale-[1.01] transition-all duration-300 ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80";
            }}
          />

          {/* Quick View Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow-lg">
              <Eye className="w-3.5 h-3.5 text-purple-600" /> Quick View
            </span>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono font-bold text-xs shadow-md">
            {product.price}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1.5 mb-3">
          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="ml-1 font-bold text-xs font-mono">{product.rating || '4.8'}</span>
            </div>
            <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              ({product.reviewsCount || '120'} reviews)
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelectProduct && onSelectProduct(product)}
            className={`text-sm font-bold font-['Outfit'] line-clamp-2 leading-snug cursor-pointer transition-colors ${
              isLight ? 'text-slate-900 hover:text-purple-700' : 'text-white hover:text-purple-300'
            }`}
            title={product.name}
          >
            {product.name}
          </h3>

          <p className={`text-xs line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {product.description}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t space-y-2">
        <div className={`flex items-center justify-between text-xs pb-1 ${
          isLight ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <span>Item ID: <strong className="font-mono">#{product.id}</strong></span>
          <span className="text-emerald-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In Stock
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart && onAddToCart(product);
          }}
          className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${
            isInCart
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
          }`}
        >
          {isInCart ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added ({cartQuantity})</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
