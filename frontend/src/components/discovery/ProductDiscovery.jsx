import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  getAllProducts, 
  getCategories, 
  getBrands, 
  getPriceBounds 
} from '../../utils/productCatalog';
import ProductFilters from './ProductFilters';
import ProductGrid from './ProductGrid';
import ProductDetails from './ProductDetails';
import CartDrawer from './CartDrawer';
import { ShoppingBag, Sparkles, Filter, SlidersHorizontal } from 'lucide-react';
import { 
  trackCategoryView, 
  trackBrandView, 
  trackSearch, 
  trackAddToCart 
} from '../../services/tracker';

export default function ProductDiscovery({ 
  theme, 
  visitorId = null,
  cartItems = [], 
  onAddToCart, 
  onSelectProduct, 
  onUpdateCartQuantity, 
  onRemoveCartItem, 
  onClearCart,
  isCartOpen,
  setIsCartOpen,
  onNavigateToRecommendations
}) {
  const isLight = theme === 'light';
  const allProducts = useMemo(() => getAllProducts(), []);
  const categories = useMemo(() => getCategories(), []);
  const brands = useMemo(() => getBrands(), []);
  const priceBounds = useMemo(() => getPriceBounds(), []);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [currentMaxPrice, setCurrentMaxPrice] = useState(priceBounds.max || 300000);
  const [sortBy, setSortBy] = useState('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounced search tracking
  const searchTimerRef = useRef(null);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name?.toLowerCase().includes(q);
          const matchCat = product.category?.toLowerCase().includes(q);
          const matchBrand = product.brand?.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchBrand && !matchDesc) return false;
        }

        // Category
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }

        // Brand
        if (selectedBrand !== 'all' && product.brand !== selectedBrand) {
          return false;
        }

        // Price
        if (product.numericPrice > currentMaxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return (a.numericPrice || 0) - (b.numericPrice || 0);
        if (sortBy === 'price_desc') return (b.numericPrice || 0) - (a.numericPrice || 0);
        if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        return 0; // featured default
      });
  }, [allProducts, searchQuery, selectedCategory, selectedBrand, currentMaxPrice, sortBy]);

  // Track search interactions with 600ms debounce
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        trackSearch(searchQuery, filteredProducts.length, {}, visitorId);
      }, 600);
    }
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, filteredProducts.length, visitorId]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat && cat !== 'all') {
      trackCategoryView(cat, {}, visitorId);
    }
  };

  const handleSelectBrand = (brand) => {
    setSelectedBrand(brand);
    if (brand && brand !== 'all') {
      trackBrandView(brand, {}, visitorId);
    }
  };

  const handleAddToCartWithTracking = (product, qty = 1) => {
    trackAddToCart(product, qty, { source: 'product_discovery_grid' }, visitorId);
    if (onAddToCart) {
      onAddToCart(product, qty);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setCurrentMaxPrice(priceBounds.max || 300000);
    setSortBy('featured');
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

  return (
    <div className="space-y-6">
      {/* Discovery Hero Banner */}
      <div className={`p-6 md:p-8 rounded-3xl border relative overflow-hidden transition-all ${
        isLight
          ? 'bg-gradient-to-r from-purple-100 via-indigo-50 to-cyan-50 border-purple-200 shadow-sm text-slate-900'
          : 'bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#0a1630] border-purple-500/20 shadow-xl text-white'
      }`}>
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-600 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Explore Full Catalog
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-['Outfit'] tracking-tight">
            Discover E-Commerce Products
          </h2>
          <p className={`text-xs md:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Browse premium electronics, wearables, accessories, and computing gear from the RetailRocket catalog with real-time smart filtering.
          </p>
        </div>

        {/* Quick AI Rec Switcher button */}
        {onNavigateToRecommendations && (
          <div className="mt-4 sm:mt-0 sm:absolute sm:top-8 sm:right-8 z-10">
            <button
              onClick={onNavigateToRecommendations}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Switch to AI Recommendations</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden flex items-center justify-between gap-3">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold ${
            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0a1630] border-purple-500/30 text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-purple-500" />
          <span>{mobileFiltersOpen ? 'Hide Filters' : 'Show Filters & Search'}</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cart ({totalCartCount})</span>
        </button>
      </div>

      {/* Main Discovery Layout: Filters Sidebar (4 cols) + Product Grid (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filters (Desktop permanent, Mobile collapsible) */}
        <div className={`lg:col-span-4 space-y-6 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            brands={brands}
            selectedBrand={selectedBrand}
            onSelectBrand={handleSelectBrand}
            minPrice={priceBounds.min || 0}
            maxPrice={priceBounds.max || 300000}
            currentMaxPrice={currentMaxPrice}
            onMaxPriceChange={setCurrentMaxPrice}
            onResetFilters={handleResetFilters}
            totalResults={filteredProducts.length}
            theme={theme}
          />
        </div>

        {/* Right Column: Products Grid */}
        <div className="lg:col-span-8">
          <ProductGrid
            products={filteredProducts}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onSelectProduct={(p) => onSelectProduct ? onSelectProduct(p) : null}
            onAddToCart={handleAddToCartWithTracking}
            cartItems={cartItems}
            onResetFilters={handleResetFilters}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}

