import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import AOS from "aos";
import "aos/dist/aos.css";
import { PacmanLoader } from "react-spinners";
import { AnimatePresence, motion } from "framer-motion";

import ScrollNavigator from "./Components/ScrollNavigator";
import ScrollToTop from "./Components/ScrollToTop";
import { useAuth } from "./PrivateRouter/AuthContext";
import PercentageSpinner from "./Components/PercentageSpinner";

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const [initialLoading, setInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 🔄 Initial App Setup Logic
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    
    const hasLoaded = sessionStorage.getItem("app_loaded");
    if (hasLoaded) {
      setInitialLoading(false);
      sessionStorage.removeItem("chunk_reload_attempted"); // Clear any pending reload flag
      return;
    }

    const timer = setTimeout(() => {
      setInitialLoading(false);
      sessionStorage.setItem("app_loaded", "true");
      sessionStorage.removeItem("chunk_reload_attempted"); // Clear on first load too
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // 🚀 Route Change Indicator Logic
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 180); // Match transition speed

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center">
        <div className="relative">
          <PacmanLoader color="#ef4444" size={35} speedMultiplier={1.5} />
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-600 to-orange-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </div>
        </div>
        <p className="mt-20 text-white/40 text-xs uppercase tracking-[0.3em] animate-pulse">
          Starting LifeStyle Pro
        </p>
      </div>
    );
  }

  // 🔐 Hide layout on auth pages
  const hideLayout = ["/login", "/register"].includes(location.pathname);

  return (
    <section className="min-h-screen bg-black overflow-x-hidden relative">
      {/* ⚡ ROUTE PROGRESS BAR */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ width: "0%", opacity: 1 }}
            animate={{ width: "100%", opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-red-600 to-orange-500 z-[99999] shadow-[0_0_10px_rgba(239,68,68,0.5)]"
          />
        )}
      </AnimatePresence>

      {!hideLayout && <Navbar />}
      <ScrollToTop />
      <ScrollNavigator />

      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <PacmanLoader color="#ef4444" size={25} />
                <p className="text-white/30 text-[10px] tracking-widest uppercase">Loading Components...</p>
              </div>
            }>
              <Outlet />
            </React.Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {!hideLayout && <Footer />}
    </section>
  );
}

export default App;
