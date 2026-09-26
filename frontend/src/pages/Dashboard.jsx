import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import VisitorSearch from '../components/VisitorSearch';
import StatsCards from '../components/StatsCards';
import RecommendationSection from '../components/RecommendationSection';
import BehaviorChart from '../components/BehaviorChart';
import TopProducts from '../components/TopProducts';
import AIInsight from '../components/AIInsight';
import VoiceAssistant from '../components/VoiceAssistant';
import BehaviorPreferenceCard from '../components/BehaviorPreferenceCard';
import PredictionAnalysis from '../components/PredictionAnalysis';
import DatabaseSettingsModal from '../components/DatabaseSettingsModal';
import UserSwitchModal from '../components/UserSwitchModal';
import ProductDiscovery from '../components/discovery/ProductDiscovery';
import CartDrawer from '../components/discovery/CartDrawer';
import ProductDetails from '../components/discovery/ProductDetails';
import { useRecommendations } from '../hooks/useRecommendations';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useCart } from '../hooks/useCart';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { enrichProduct } from '../utils/productCatalog';



export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState('light');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);


  const {
    visitorId,
    setVisitorId,
    selectedVisitor,
    recommendations,
    userStats,
    userHistory,
    loading,
    error,
    apiConnected,
    datasetHealth,
    handleFetchRecommendations,
    generateSampleVisitor
  } = useRecommendations('1000294');

  // Unified persistent cart management (Supabase + Backend API + LocalStorage)
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    cartCount,
    subtotal,
    addItem: handleAddToCart,
    updateQuantity: handleUpdateCartQuantity,
    removeItem: handleRemoveCartItem,
    clearCart: handleClearCart
  } = useCart(visitorId);

  // Behavioral preferences aggregation hook (weights + time-decay)
  const {
    preferences,
    loading: prefLoading,
    recomputePreferences
  } = useUserPreferences(selectedVisitor || visitorId);

  // Synchronize active visitor ID with behavior tracker
  React.useEffect(() => {
    if (visitorId) {
      try {
        localStorage.setItem('rr_active_visitor_id', String(visitorId));
      } catch {

        // ignore
      }
    }
  }, [visitorId]);

  const {
    voiceState,
    transcript,
    spokenResponse,
    startListening,
    stopListening,
    playResponse,
    askQuestion
  } = useVoiceAssistant(selectedVisitor || visitorId, preferences, recommendations, cartItems);

  const isLight = theme === 'light';



  return (
    <div className={`flex min-h-screen font-['Inter',sans-serif] transition-colors ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#020817] text-slate-100'
    }`}>
      {/* Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetHealth={datasetHealth}
        theme={theme}
        cartCount={cartCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto">
        <Header
          apiConnected={apiConnected}
          theme={theme}
          setTheme={setTheme}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenDbModal={() => setIsDbModalOpen(true)}
          onOpenUserModal={() => setIsUserModalOpen(true)}
          visitorId={selectedVisitor || visitorId}
          cartCount={cartCount}
        />


        {/* Tab Switcher: Discovery Screen vs Prediction Analysis vs Home Dashboard Screen */}
        {activeTab === 'discovery' ? (
          <div className="my-6">
            <ProductDiscovery
              theme={theme}
              visitorId={selectedVisitor || visitorId}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onSelectProduct={(p) => setSelectedProduct(enrichProduct(p))}
              onUpdateCartQuantity={handleUpdateCartQuantity}
              onRemoveCartItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              onNavigateToRecommendations={() => setActiveTab('recommendations')}
            />
          </div>
        ) : activeTab === 'recommendations' || activeTab === 'analytics' ? (
          <div className="my-6">
            <PredictionAnalysis
              visitorId={selectedVisitor || visitorId}
              preferences={preferences}
              recommendations={recommendations}
              userStats={userStats}
              cartItems={cartItems}
              loading={loading || prefLoading}
              onSelectProduct={(item) => setSelectedProduct(enrichProduct(item))}
              onAddToCart={handleAddToCart}
              onRefresh={() => {
                handleFetchRecommendations(visitorId);
                recomputePreferences();
              }}
              theme={theme}
            />
          </div>
        ) : (
          <>
            {/* Visitor Search Input Bar */}
            <VisitorSearch
              visitorId={visitorId}
              setVisitorId={setVisitorId}
              onSearch={(id) => handleFetchRecommendations(id)}
              onVoiceClick={startListening}
              onGenerateNew={generateSampleVisitor}
              loading={loading}
              theme={theme}
            />

            {/* Dashboard Grid: Left Content + Right Voice Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Main Dashboard Column (8 cols on XL) */}
              <div className="xl:col-span-8 space-y-6">
                {/* Top 4 Stats Cards */}
                <StatsCards userStats={userStats} theme={theme} />

                {/* Dynamic Behavioral Preference Aggregation Layer */}
                <BehaviorPreferenceCard
                  preferences={preferences}
                  loading={prefLoading}
                  onRecompute={recomputePreferences}
                  theme={theme}
                />

                {/* Recommended Products Carousel/Grid */}
                <RecommendationSection
                  recommendations={recommendations}
                  loading={loading}
                  error={error}
                  onRetry={() => handleFetchRecommendations(visitorId)}
                  onGenerateNew={generateSampleVisitor}
                  onSelectProduct={(item) => setSelectedProduct(enrichProduct(item))}
                  onAddToCart={handleAddToCart}
                  theme={theme}
                />

                {/* Bottom Row: Behavior Chart, Top Products, AI Insight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <BehaviorChart userHistory={userHistory} theme={theme} />
                  <TopProducts recommendations={recommendations} onSelectProduct={(item) => setSelectedProduct(enrichProduct(item))} theme={theme} />
                  <AIInsight visitorId={selectedVisitor || visitorId} userStats={userStats} theme={theme} />
                </div>
              </div>

              {/* Right Voice Assistant Panel (4 cols on XL) */}
              <div className="xl:col-span-4">
                <VoiceAssistant
                  voiceState={voiceState}
                  transcript={transcript}
                  spokenResponse={spokenResponse}
                  startListening={startListening}
                  stopListening={stopListening}
                  playResponse={playResponse}
                  askQuestion={askQuestion}
                  theme={theme}
                />
              </div>

            </div>
          </>
        )}
      </main>


      {/* Global Product Detail Modal */}
      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          cartQuantity={cartItems.find((i) => i.id === selectedProduct?.id)?.quantity || 0}
          theme={theme}
        />
      )}

      {/* Global Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        theme={theme}
      />

      {/* Database Connection & Schema Management Modal */}
      <DatabaseSettingsModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        theme={theme}
      />

      {/* User Identity, Authentication & Switcher Modal */}
      <UserSwitchModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentVisitorId={selectedVisitor || visitorId}
        onSwitchVisitor={(newId) => {
          setVisitorId(newId);
          handleFetchRecommendations(newId);
          recomputePreferences(newId);
        }}
        theme={theme}
      />
    </div>
  );
}


