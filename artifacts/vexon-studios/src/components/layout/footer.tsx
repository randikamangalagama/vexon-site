import { Link } from "wouter";
import { Instagram, Facebook, Mail, Phone, MapPin, MessageCircle, Twitter } from "lucide-react";
import { useBranding } from "@/context/branding-context";
import { useBookingModal } from "@/context/booking-context";

const SYN: React.CSSProperties = { fontFamily: "'Syncopate', sans-serif", textTransform: "uppercase" as const, letterSpacing: "0.12em" };
const OTF: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.88a8.28 8.28 0 0 0 4.83 1.54V6.97a4.83 4.83 0 0 1-1.07-.28z" />
    </svg>
  );
}

export default function Footer() {
  const { branding, contact } = useBranding();
  const { openModal } = useBookingModal();

  const socials = [
    { key: "instagram", icon: <Instagram className="w-4 h-4" />, href: contact.instagram, label: "Instagram" },
    { key: "facebook", icon: <Facebook className="w-4 h-4" />, href: contact.facebook, label: "Facebook" },
    { key: "tiktok", icon: <TikTokIcon />, href: contact.tiktok, label: "TikTok" },
    { key: "twitter", icon: <Twitter className="w-4 h-4" />, href: contact.twitter, label: "Twitter" },
    { key: "whatsapp", icon: <MessageCircle className="w-4 h-4" />, href: contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : undefined, label: "WhatsApp" },
  ].filter(s => s.href);

  const contactItems = [
    contact.address && { icon: <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />, content: <span style={OTF}>{contact.address}</span> },
    contact.phone && { icon: <Phone className="w-4 h-4 text-primary shrink-0" />, content: <a href={`tel:${contact.phone}`} className="hover:text-primary transition-colors" style={OTF}>{contact.phone}</a> },
    contact.email && { icon: <Mail className="w-4 h-4 text-primary shrink-0" />, content: <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors" style={OTF}>{contact.email}</a> },
  ].filter(Boolean) as { icon: React.ReactNode; content: React.ReactNode }[];

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-48 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.03) 0%, transparent 70%)" }} />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.siteName ?? "Vexon Studios"} className="h-8 w-auto object-contain" />
              ) : (
                <span style={SYN} className="font-bold text-lg text-white">
                  VEXON <span className="text-primary">STUDIOS</span>
                </span>
              )}
            </Link>
            <p style={OTF} className="text-white/25 text-sm leading-relaxed mb-6 max-w-xs">
              A premium creative studio offering photography, videography, graphic design, and digital services.
            </p>
            {socials.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                {socials.map(s => (
                  <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="w-9 h-9 border border-white/8 flex items-center justify-center text-white/25 hover:text-primary hover:border-primary/40 transition-all duration-200">
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <h4 style={SYN} className="font-bold text-[9px] text-white/20 tracking-widest mb-6">Services</h4>
            <ul className="space-y-3">
              {[
                { label: "Photography", href: "/photography" },
                { label: "Videography", href: "/" },
                { label: "Graphic Design", href: "/" },
                { label: "Printing", badge: "Soon" },
                { label: "Web Development", href: "/products" },
              ].map(item => (
                <li key={item.label}>
                  {item.href && !item.badge ? (
                    <Link href={item.href} className="text-white/25 hover:text-primary transition-colors text-sm" style={OTF}>{item.label}</Link>
                  ) : (
                    <span className="text-white/12 text-sm flex items-center gap-2" style={OTF}>
                      {item.label}
                      {item.badge && <span style={SYN} className="text-[8px] border border-white/8 px-2 py-0.5">{item.badge}</span>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={SYN} className="font-bold text-[9px] text-white/20 tracking-widest mb-6">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-white/25 hover:text-primary transition-colors text-sm" style={OTF}>About Us</Link></li>
              <li><Link href="/photography" className="text-white/25 hover:text-primary transition-colors text-sm" style={OTF}>Photography</Link></li>
              <li><Link href="/products" className="text-white/25 hover:text-primary transition-colors text-sm" style={OTF}>Our Products</Link></li>
              <li><button onClick={() => openModal()} className="text-white/25 hover:text-primary transition-colors text-sm text-left" style={OTF}>Book a Session</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={SYN} className="font-bold text-[9px] text-white/20 tracking-widest mb-6">Contact</h4>
            {contactItems.length > 0 ? (
              <ul className="space-y-4">
                {contactItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/25">{item.icon}{item.content}</li>
                ))}
              </ul>
            ) : (
              <button onClick={() => openModal()} style={SYN}
                className="text-[9px] border border-primary/40 text-primary hover:bg-primary hover:text-black transition-all duration-200 px-6 py-2 tracking-wider">
                GET IN TOUCH
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p style={OTF} className="text-xs text-white/15">
            &copy; {new Date().getFullYear()} {branding.siteName ?? "Vexon Studios"}. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-white/15" style={OTF}>
            <span className="cursor-default hover:text-white/25 transition-colors">Privacy Policy</span>
            <span className="cursor-default hover:text-white/25 transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
