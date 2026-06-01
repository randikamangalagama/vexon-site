import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Photography from "@/pages/photography";
import Admin from "@/pages/admin";
import Products from "@/pages/products";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { BookingProvider } from "@/context/booking-context";
import { AuthProvider } from "@/context/auth-context";
import { BrandingProvider } from "@/context/branding-context";
import { BookingModal } from "@/components/ui/booking-modal";

const queryClient = new QueryClient();
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

function Layout() {
  const [location] = useLocation();
  const isAdmin = location === "/dilshanpage";

  if (isAdmin) return <Admin />;

  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/photography" component={Photography} />
        <Route path="/products" component={Products} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrandingProvider>
            <BookingProvider>
              <WouterRouter base={base}>
                <Layout />
              </WouterRouter>
              <BookingModal />
              <Toaster />
            </BookingProvider>
          </BrandingProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
