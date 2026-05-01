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
        bgImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80"
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

              return (
                <div
                  key={id}
                  className="bg-black/80 border border-red-500/60 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_25px_rgba(255,0,0,0.12)] hover:shadow-red-600/40 transition group"
                >
                  {/* IMAGE */}
                  <div className="relative h-48 overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-red-900/20 flex items-center justify-center text-5xl opacity-30">
                        📦
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                    {/* 🔥 OFFER BADGE */}
                    {product.offer > 0 && (
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-red-600 text-white text-xl font-extrabold px-4 py-1.5 rounded-xl shadow-[0_0_18px_rgba(255,0,0,0.6)]">
                          {product.offer}% OFF
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-red-500 mb-2">
                      {product.name}
                    </h3>

                    <p className="text-white/60 text-sm mb-4 flex-1">
                      {product.description}
                    </p>

                    {/* PRICE */}
                    <div className="mb-5">
                      {product.offer > 0 ? (
                        <>
                          <p className="text-white/40 line-through text-sm">
                            ₹{product.mrp}
                          </p>
                          <p className="text-2xl font-bold text-red-500">
                            ₹{product.offer_price}
                          </p>
                        </>
                      ) : (
                        <p className="text-2xl font-bold text-white">
                          ₹{product.mrp}
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <button className="mt-auto py-3 rounded-full text-sm font-semibold tracking-widest bg-red-600 hover:bg-red-700 transition">
                      BUY NOW
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
