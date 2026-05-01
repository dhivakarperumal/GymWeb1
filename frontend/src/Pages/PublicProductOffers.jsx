import React, { useEffect, useState } from "react";
import api from "../api";
import PageHeader from "../Components/PageHeader";
import PageContainer from "../Components/PageContainer";
import ProductCard from "../Components/ProductsCard";
import toast from "react-hot-toast";

export default function PublicProductOffers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get("/products?status=active");
        const data = Array.isArray(res.data) ? res.data : [];
        
        // Filter products that actually have an offer/discount
        const discounted = data.filter(product => {
          // Check product level offer
          if (product.offer > 0) return true;
          
          // Check if offer price is less than MRP
          const mrp = Number(product.mrp || 0);
          const offerPrice = Number(product.offer_price || product.offerPrice || 0);
          if (offerPrice > 0 && offerPrice < mrp) return true;

          // Check variants (stock)
          if (product.stock && typeof product.stock === 'object') {
            return Object.values(product.stock).some(variant => {
              const vMrp = Number(variant.mrp || 0);
              const vOffer = Number(variant.offer_price || variant.offerPrice || 0);
              return (variant.offer > 0) || (vOffer > 0 && vOffer < vMrp);
            });
          }

          return false;
        });

        setProducts(discounted);
      } catch (err) {
        console.error("Failed to load active products:", err);
        toast.error("Unable to load active products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <PageHeader
        title="Hot Product Offers"
        subtitle="Exclusive discounts on premium gear and supplements."
        bgImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80"
      />

      <PageContainer>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.6em] animate-pulse">
              Hunting for the best deals...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
            <div className="text-7xl opacity-10 grayscale">🏷️</div>
            <h3 className="text-2xl font-bold text-white/30 tracking-tight">No active offers today</h3>
            <p className="text-white/20 max-w-sm text-sm">
              All items are currently at their standard price. Check back later for flash sales and seasonal discounts!
            </p>
            <button 
              onClick={() => window.location.href = '/products'}
              className="mt-6 px-8 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-semibold hover:bg-white/10 transition"
            >
              BROWSE ALL PRODUCTS
            </button>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 py-20">
            {products.map((product, index) => (
              <ProductCard 
                key={product.id || product.product_id} 
                product={product} 
                index={index} 
              />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
