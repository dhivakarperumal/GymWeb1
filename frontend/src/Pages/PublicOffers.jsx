import React, { useEffect, useState } from "react";
import PageHeader from "../Components/PageHeader";
import PageContainer from "../Components/PageContainer";
import api from "../api";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import AOS from "aos";

const PublicOffers = ({ offerType }) => {
  const [offers, setOffers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const isPlan = offerType === "plan";

  useEffect(() => {
    AOS.init({ duration: 900, easing: "ease-out-cubic", once: true, offset: 120 });
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [offersRes, plansRes, productsRes] = await Promise.all([
          api.get("/offers"),
          api.get("/plans"),
          api.get("/products?status=active"),
        ]);
        setOffers(offersRes.data);
        setPlans(plansRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error("Failed to load offers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = offers.filter((o) => o.offer_type === offerType && o.active);

  const getTarget = (o) => {
    const list = o.offer_type === "plan" ? plans : products;
    return list.find((t) => t.id == o.target_id);
  };

  const displayedOffers = filtered.filter((o) => {
    if (o.offer_type !== "product") return true;
    return Boolean(getTarget(o));
  });

  return (
    <div className="bg-black text-white">
      {/* PAGE HEADER -- same as Pricing, Services, etc. */}
      <PageHeader
        title={isPlan ? "Plan Offers" : "Product Offers"}
        subtitle={
          isPlan
            ? "Save big on membership plans -- handpicked seasonal promotions just for you."
            : "Grab the best deals on supplements & gym gear before they expire."
        }
        bgImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80"
      />

      <PageContainer>
        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-t-2 border-red-500 rounded-full animate-spin" />
            <p className="text-white/40 text-xs tracking-widest uppercase animate-pulse">
              Loading Offers…
            </p>
          </div>
        ) : displayedOffers.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="text-6xl opacity-20">🏷️</div>
            <h3 className="text-2xl font-bold text-white/40">No Active Offers Right Now</h3>
            <p className="text-white/30 text-sm">Check back soon for new promotions!</p>
            <Link
              to={isPlan ? "/pricing" : "/products"}
              className="mt-4 px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 transition text-sm font-semibold tracking-widest"
            >
              {isPlan ? "VIEW PLANS" : "SHOP PRODUCTS"}
            </Link>
          </div>
        ) : (
          /* OFFERS GRID */
          <section className="py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedOffers.map((o, index) => {
              const target = getTarget(o);
              const daysLeft = o.end_date ? dayjs(o.end_date).diff(dayjs(), "day") : null;
              const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
              const isExpired = o.end_date && dayjs(o.end_date).isBefore(dayjs(), "day");

              return (
                <div
                  key={o.id}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  className="bg-black/80 border border-red-500/60 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_25px_rgba(255,0,0,0.12)] hover:shadow-red-600/40 transition group"
                >
                  {/* IMAGE */}
                  <div className="relative h-48 overflow-hidden">
                    {o.offer_image ? (
                      <img
                        src={o.offer_image}
                        alt={o.offer_name}
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-red-900/20 flex items-center justify-center text-5xl opacity-30">
                        🏷️
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                    {/* DISCOUNT BADGE */}
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-red-600 text-white text-2xl font-extrabold px-4 py-1.5 rounded-xl shadow-[0_0_18px_rgba(255,0,0,0.6)] tracking-tight">
                        {o.discount_percentage}% OFF
                      </span>
                    </div>

                    {/* EXPIRY TAG */}
                    {isExpiringSoon && !isExpired && (
                      <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
                        ⏰ {daysLeft}d left
                      </div>
                    )}
                    {isExpired && (
                      <div className="absolute top-3 right-3 bg-white/10 border border-white/20 text-white/40 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        Expired
                      </div>
                    )}

                    {/* PROMO TYPE */}
                    {o.promo_type && (
                      <div className="absolute top-3 left-3 bg-black/70 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        {o.promo_type}
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-red-500 mb-1 group-hover:text-red-400 transition">
                      {o.offer_name}
                    </h3>

                    {target && (
                      <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
                        {isPlan ? "📋" : "📦"} {target.name}
                      </p>
                    )}

                    {o.description && (
                      <p
                        className="text-white/60 text-sm mb-4 leading-relaxed overflow-hidden flex-1"
                        style={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 3,
                        }}
                      >
                        {o.description}
                      </p>
                    )}

                    {/* META */}
                    <ul className="text-sm text-white/75 mb-5 space-y-2">
                      {o.start_date && o.end_date && (
                        <li className="flex items-center gap-3 border-b border-red-500/10 pb-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.9)] flex-shrink-0" />
                          Valid: {dayjs(o.start_date).format("MMM DD")} -{" "}
                          {dayjs(o.end_date).format("MMM DD, YYYY")}
                        </li>
                      )}
                      {o.contact && (
                        <li className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.9)] flex-shrink-0" />
                          Contact:{" "}
                          <a href={`tel:${o.contact}`} className="text-red-400 hover:text-red-300 transition">
                            {o.contact}
                          </a>
                        </li>
                      )}
                    </ul>

                    {/* CTA */}
                    <Link
                      to={isPlan ? "/pricing" : "/products"}
                      className="mt-auto py-3 rounded-full text-sm font-semibold tracking-widest text-center transition-all duration-300 bg-red-600 hover:bg-red-700 shadow-[0_0_18px_rgba(255,0,0,0.4)]"
                    >
                      {isPlan ? "CHOOSE PLAN" : "SHOP NOW"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* BOTTOM CTA -- same pattern as Pricing.jsx */}
        {!loading && displayedOffers.length > 0 && (
          <section className="py-20 text-center border-t border-red-500/20">
            <h2 className="text-3xl font-bold mb-6">
              {isPlan ? "Ready to Start Your Fitness Journey?" : "Upgrade Your Workout Gear Today"}
            </h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              {isPlan
                ? "Pick the plan that fits your goals. Our team is ready to help."
                : "Quality products for serious athletes at unbeatable offer prices."}
            </p>
            <Link
              to="/contact"
              className="inline-block bg-red-600 hover:bg-red-700 transition px-12 py-4 rounded-full tracking-widest font-semibold"
            >
              CONTACT US
            </Link>
          </section>
        )}
      </PageContainer>
    </div>
  );
};

export default PublicOffers;
