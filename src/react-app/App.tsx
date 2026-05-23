import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import HomePage from "@/react-app/pages/Home";
import ClientPortal from "@/react-app/pages/ClientPortal";
import { ToastProvider } from "@/react-app/components/ToastContainer";
import { ConfirmProvider } from "@/react-app/components/ConfirmDialog";

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/portal/:token" element={<ClientPortal />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  // Apply Inter font globally
  useEffect(() => {
    document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";
  }, []);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </ConfirmProvider>
    </ToastProvider>
  );
}
