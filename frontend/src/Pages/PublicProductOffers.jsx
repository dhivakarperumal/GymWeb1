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
        setProducts(data);
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
        title="Product Offers"
        subtitle="Browse all active products available now."
        bgImage="https://images.unsplash.com/photo-1518203161762-50a724d1cd44?auto=format&fit=crop&w=1600&q=80"
      />

      <PageContainer>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">
              Loading active products...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="text-6xl opacity-20">📦</div>
            <h3 className="text-2xl font-bold text-white/40">No active products found</h3>
            <p className="text-white/30 max-w-md">
              There are no active products available at the moment. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:py-25">
            {products.map((product, index) => {
              const id = product.id ?? product.product_id;
              if (!id) return null;
              return <ProductCard key={id} product={product} index={index} />;
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
