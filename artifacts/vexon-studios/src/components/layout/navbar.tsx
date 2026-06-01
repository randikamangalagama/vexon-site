import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Camera, Package, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookingModal } from "@/context/booking-context";
import { useBranding } from "@/context/branding-context";

export default function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openModal } = useBookingModal();
  const { branding } = useBranding();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  const navLinks = [
    { href: "/", label: "STUDIO" },
    { href: "/photography", label: "PHOTOGRAPHY", icon: <Camera className="w-3.5 h-3.5" /> },
    { href: "/products", label: "PRODUCTS", icon: <Package className="w-3.5 h-3.5" /> },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
        isScrolled
          ? "bg-[#050505]/90 backdrop-blur-md border-b border-white/6 py-3 shadow-[0_1px_40px_rgba(0,0,0,0.5)]"
          : "bg-transparent py-5 border-b border-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.siteName ?? "Vexon Studios"}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <>
                <div className="w-8 h-8 bg-primary flex items-center justify-center font-serif font-bold text-black text-lg group-hover:bg-primary/80 transition-colors">
                  V
                </div>
                <span className="font-serif font-bold text-lg tracking-widest text-foreground">
                  VEXON <span className="text-primary">STUDIOS</span>
                </span>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-xs font-medium tracking-[0.2em] transition-colors duration-200 flex items-center gap-1.5 relative group",
                  location === href
                    ? "text-primary"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                {icon}
                {label}
                <span className={cn(
                  "absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300",
                  location === href ? "w-full" : "w-0 group-hover:w-full"
                )} />
              </Link>
            ))}
            <Button
              variant="outline"
              className="border-primary/60 text-primary hover:bg-primary hover:text-black hover:border-primary rounded-none font-medium tracking-[0.2em] px-7 py-2 text-xs transition-all duration-300"
              onClick={() => openModal()}
            >
              BOOK US
            </Button>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-foreground/70 hover:text-foreground p-2 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#070707]/97 backdrop-blur-xl border-b border-white/8 py-8 px-6 flex flex-col gap-6 shadow-2xl">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-base font-medium tracking-[0.15em] transition-colors flex items-center gap-2",
                location === href ? "text-primary" : "text-foreground/70 hover:text-foreground"
              )}
            >
              {icon}{label}
            </Link>
          ))}
          <Button
            className="w-full bg-primary text-black rounded-none font-medium tracking-[0.2em] py-3 mt-2"
            onClick={() => openModal()}
          >
            BOOK US
          </Button>
        </div>
      )}
    </header>
  );
}
