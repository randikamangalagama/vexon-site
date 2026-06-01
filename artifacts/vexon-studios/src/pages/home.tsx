import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Camera, Code, Printer, Video, Star, Quote,
  MessageSquarePlus, Palette, Mail, Instagram, MapPin, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { ReviewModal } from "@/components/ui/review-modal";
import { useBookingModal } from "@/context/booking-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useBranding } from "@/context/branding-context";

// ── Font style constants ─────────────────────────────────────────────
const SYN: React.CSSProperties = { fontFamily: "'Syncopate', sans-serif", textTransform: "uppercase" as const, letterSpacing: "0.1em" };
const SYN_SM: React.CSSProperties = { fontFamily: "'Syncopate', sans-serif", textTransform: "uppercase" as const, letterSpacing: "0.3em" };
const OTF: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

// ── Grid background ──────────────────────────────────────────────────
const GRID: React.CSSProperties = {
  backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
  backgroundSize: "50px 50px",
};

// ── Helpers ─────────────────────────────────────────────────────────
function getEmbedUrl(url: string): string | null {
  const regexps = [/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/, /youtu\.be\/([a-zA-Z0-9_-]{11})/, /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, /vimeo\.com\/(\d+)/];
  for (const re of regexps) { const m = url.match(re); if (m) { if (url.includes("vimeo")) return `https://player.vimeo.com/video/${m[1]}?autoplay=0&title=0&byline=0`; return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`; } }
  return null;
}
function isDirectVideo(url: string) { return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url); }

// ── Glass Card with liquid shine effect ──────────────────────────────
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden ${className}`}
      style={{ background: "rgba(12,12,12,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)", transform: "skewX(-15deg) scaleX(1.5)", zIndex: 1 }}
        initial={{ x: "-150%" }}
        animate={hovered ? { x: "200%" } : { x: "-150%" }}
        transition={{ duration: 0.65, ease: "easeInOut" }}
      />
      {children}
    </motion.div>
  );
}

// ── Service card ─────────────────────────────────────────────────────
function ServiceCard({ number, name, description, icon, href }: { number: string; name: string; description: string; icon: React.ReactNode; href?: string }) {
  const inner = (
    <GlassCard className="p-7 h-full group cursor-pointer">
      <span className="text-4xl font-bold text-primary/15 block mb-5 group-hover:text-primary/40 transition-colors" style={SYN}>{number}</span>
      <div className="text-primary/40 mb-4 group-hover:text-primary transition-colors">{icon}</div>
      <h3 className="text-sm font-bold text-white mb-3 group-hover:text-primary transition-colors" style={SYN}>{name}</h3>
      <p className="text-white/25 text-sm leading-relaxed" style={OTF}>{description}</p>
    </GlassCard>
  );
  return href ? <Link href={href}><div>{inner}</div></Link> : inner;
}

// ── Contact form ─────────────────────────────────────────────────────
function ContactForm({ contact }: { contact: { email?: string; phone?: string; address?: string; instagram?: string } }) {
  const [form, setForm] = useState({ name: "", email: "", service: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const inp = "w-full bg-black/30 border border-white/8 focus:border-primary/50 px-4 py-3 outline-none text-sm text-white transition-colors placeholder:text-white/15";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setStatus("loading");
    try {
      await addDoc(collection(db, "inquiries"), { ...form, source: "homepage", createdAt: serverTimestamp(), status: "new" });
      await fetch("https://formsubmit.co/ajax/vexonstudiosmain@gmail.com", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...form, _subject: `New Inquiry – ${form.name}` }) });
      setStatus("success"); setForm({ name: "", email: "", service: "", message: "" });
    } catch { setStatus("error"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
      <FadeIn>
        <span style={SYN_SM} className="text-[9px] text-primary/70 mb-5 block">Let's Talk</span>
        <h2 style={SYN} className="text-3xl md:text-4xl font-bold text-white mb-6">Start a conversation.</h2>
        <div className="w-10 h-px bg-primary mb-8" />
        <p style={OTF} className="text-white/30 text-base leading-relaxed mb-10">Whether you have a project in mind or just want to explore, we'd love to hear from you.</p>
        <div className="space-y-4">
          {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-4 text-white/25 hover:text-primary transition-colors group"><span className="w-10 h-10 border border-white/8 flex items-center justify-center group-hover:border-primary/50 transition-colors"><Mail className="w-4 h-4" /></span><span style={OTF} className="text-sm">{contact.email}</span></a>}
          {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-4 text-white/25 hover:text-primary transition-colors group"><span className="w-10 h-10 border border-white/8 flex items-center justify-center group-hover:border-primary/50 transition-colors"><Phone className="w-4 h-4" /></span><span style={OTF} className="text-sm">{contact.phone}</span></a>}
          {contact.address && <div className="flex items-center gap-4 text-white/20"><span className="w-10 h-10 border border-white/8 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></span><span style={OTF} className="text-sm">{contact.address}</span></div>}
          {contact.instagram && <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-white/25 hover:text-primary transition-colors group"><span className="w-10 h-10 border border-white/8 flex items-center justify-center group-hover:border-primary/50 transition-colors"><Instagram className="w-4 h-4" /></span><span style={OTF} className="text-sm">Instagram</span></a>}
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label style={SYN_SM} className="text-[9px] text-white/20 block mb-2">Name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} placeholder="Full name" /></div>
            <div><label style={SYN_SM} className="text-[9px] text-white/20 block mb-2">Email *</label><input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} placeholder="your@email.com" /></div>
          </div>
          <div>
            <label style={SYN_SM} className="text-[9px] text-white/20 block mb-2">Service</label>
            <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} className={`${inp} bg-black/30`}>
              <option value="">Select a service</option>
              <option>Photography</option><option>Videography</option><option>Graphic Design</option><option>Web Development</option><option>Other</option>
            </select>
          </div>
          <div><label style={SYN_SM} className="text-[9px] text-white/20 block mb-2">Message</label><textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className={`${inp} resize-none`} placeholder="Tell us about your project…" /></div>
          {status === "success" && <div className="border border-green-500/30 bg-green-500/5 px-4 py-3 text-green-400 text-sm" style={OTF}>Message sent! We'll be in touch shortly.</div>}
          {status === "error" && <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 text-red-400 text-sm" style={OTF}>Something went wrong. Please email us directly.</div>}
          <button type="submit" disabled={status === "loading"} style={SYN}
            className="w-full bg-primary text-black font-bold tracking-[0.2em] py-4 hover:bg-primary/90 transition-colors text-[10px]">
            {status === "loading" ? "SENDING…" : "SEND MESSAGE"}
          </button>
        </form>
      </FadeIn>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────
export default function Home() {
  const { openModal } = useBookingModal();
  const { contact } = useBranding();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 110]);
  const heroOpacity = useTransform(scrollY, [0, 380], [1, 0]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "reviews"), where("approved", "==", true));
    return onSnapshot(q, snap => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...(d.data()) })).sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)).slice(0, 6));
    }, () => {});
  }, []);

  useEffect(() => {
    getDoc(doc(db, "site_content", "homepage")).then(snap => { if (snap.exists()) setVideoUrl(snap.data().showreelUrl ?? null); }).catch(() => {});
  }, []);

  useEffect(() => {
    getDoc(doc(db, "site_content", "team")).then(snap => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.members?.length > 0) setTeamMembers(d.members);
      else {
        const l: any[] = [];
        if (d.member1?.name) l.push({ id: "m1", ...d.member1 });
        if (d.member2?.name) l.push({ id: "m2", ...d.member2 });
        setTeamMembers(l);
      }
    }).catch(() => {});
  }, []);

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  const directVideo = videoUrl && isDirectVideo(videoUrl) ? videoUrl : null;

  const services = [
    { number: "01", name: "Photography", description: "Studio and location sessions, events, portraits, brand campaigns, and weddings.", icon: <Camera className="w-5 h-5" />, href: "/photography" },
    { number: "02", name: "Videography", description: "Cinematic video production for brands, weddings, events, and social content.", icon: <Video className="w-5 h-5" /> },
    { number: "03", name: "Graphic Design", description: "Brand identity, print design, packaging, social media, and marketing collateral.", icon: <Palette className="w-5 h-5" /> },
    { number: "04", name: "Printing", description: "Premium print production for banners, brochures, business cards, and large-format.", icon: <Printer className="w-5 h-5" /> },
    { number: "05", name: "Web Development", description: "Custom websites, web apps, and digital systems built to perform and impress.", icon: <Code className="w-5 h-5" />, href: "/products" },
  ];

  return (
    <div className="relative bg-[#050505]">

      {/* ── FIXED GRID BACKGROUND ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{ ...GRID, zIndex: 0, opacity: 0.8 }} />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[680px] flex flex-col items-center justify-center overflow-hidden" style={{ zIndex: 1 }}>

        {/* Dark animated blobs (not gold) */}
        <motion.div className="absolute top-[-20%] left-[-10%] w-[65%] h-[65%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(22,22,22,1) 0%, transparent 70%)", filter: "blur(80px)" }}
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,16,16,1) 0%, transparent 70%)", filter: "blur(80px)" }}
          animate={{ x: [0, -15, 0], y: [0, 25, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: -5 }} />
        {/* One subtle gold accent */}
        <motion.div className="absolute top-[35%] left-[35%] w-[35%] h-[35%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.035) 0%, transparent 70%)", filter: "blur(60px)" }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: -3 }} />

        {/* Parallax content */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-4 pt-20 w-full max-w-5xl mx-auto">

          {/* Est. badge */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="mb-10">
            <span style={SYN_SM} className="text-[9px] font-bold text-white/15 border-b border-white/8 pb-2 inline-block">
              Est. 2022 · Colombo, Sri Lanka
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}
            style={{ ...SYN, fontSize: "clamp(2.8rem, 9vw, 7.5rem)", lineHeight: 0.95 }}
            className="font-bold text-white mb-6"
          >
            We Create.<br />
            <span style={{ color: "rgba(255,255,255,0.2)" }}>Visual Excellence.</span>
          </motion.h1>

          {/* Gold divider */}
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.55, duration: 0.5 }}
            className="w-12 h-px bg-primary mx-auto mb-6" />

          {/* Service tags */}
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            style={SYN_SM} className="text-white/15 text-[9px] mb-12">
            Photography · Videography · Design · Web
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/photography">
              <button style={SYN} className="group flex items-center gap-3 border border-white/10 text-white/30 hover:border-primary/60 hover:text-primary px-8 py-3.5 text-[9px] font-bold tracking-[0.2em] transition-all duration-300">
                EXPLORE OUR WORK <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button onClick={() => openModal()} style={SYN}
              className="bg-primary text-black text-[9px] font-bold tracking-[0.2em] px-8 py-3.5 hover:bg-primary/90 transition-colors">
              BOOK A SESSION
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator only — NO glassmorphism bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          className="absolute bottom-8 right-8 md:right-12 flex flex-col items-center gap-2 z-10">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-px h-10 bg-gradient-to-b from-primary/50 to-transparent" />
        </motion.div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative border-t border-white/5" style={{ zIndex: 1 }}>
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
            <FadeIn>
              <span style={SYN_SM} className="text-[9px] text-primary/70 mb-5 block">What We Do</span>
              <h2 style={SYN} className="text-4xl md:text-5xl font-bold text-white">Our<br />Services</h2>
              <div className="w-10 h-px bg-primary mt-6" />
            </FadeIn>
            <FadeIn delay={0.1} className="lg:col-span-2">
              <p style={OTF} className="text-white/30 text-base md:text-lg leading-relaxed">
                Vexon Studios is a full-service creative studio. We combine cinematic technique with strategic thinking to deliver work that performs and endures — across photography, video, design, print, and digital.
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(s => <ServiceCard key={s.number} {...s} />)}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SHOWREEL — no adjacent CTA ───────────────────── */}
      {(embedUrl || directVideo) && (
        <section className="py-24 relative border-t border-white/5" style={{ zIndex: 1 }}>
          <div className="container px-4 md:px-8 max-w-7xl mx-auto">
            <FadeIn className="mb-10 text-center">
              <span style={SYN_SM} className="text-[9px] text-primary/70 mb-3 block">Showreel</span>
              <h2 style={SYN} className="text-3xl md:text-4xl font-bold text-white">Our Work</h2>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="relative aspect-video overflow-hidden"
                style={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.06)" }}>
                {embedUrl
                  ? <iframe src={embedUrl} className="w-full h-full" title="Showreel" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  : <video src={directVideo!} controls className="w-full h-full object-cover" />}
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ── ABOUT ─────────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative border-t border-white/5" style={{ zIndex: 1 }}>
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <span style={SYN_SM} className="text-[9px] text-primary/70 mb-5 block">Who We Are</span>
              <h2 style={SYN} className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Born from passion.<br />
                <span style={{ color: "rgba(255,255,255,0.2)" }}>Built on quality.</span>
              </h2>
              <p style={OTF} className="text-white/30 text-base mb-6 leading-relaxed">
                Vexon Studios is a full-service creative studio founded by passionate creatives who believe that great visuals should be accessible to every ambitious brand.
              </p>
              <p style={OTF} className="text-white/25 text-base mb-10 leading-relaxed">
                From photography and videography to graphic design and digital experiences, we are a one-stop creative partner for businesses ready to stand out.
              </p>
              <button onClick={() => openModal()} style={SYN}
                className="border border-primary/50 text-primary hover:bg-primary hover:text-black font-bold tracking-[0.2em] px-8 py-3 transition-all duration-300 text-[10px]">
                GET IN TOUCH
              </button>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-full h-full border border-primary/8 pointer-events-none" />
                <div className="relative grid grid-cols-2 gap-3">
                  {[
                    { icon: <Camera className="w-6 h-6 text-primary mb-4" />, label: "Professional Photography" },
                    { icon: <Video className="w-6 h-6 text-primary mb-4" />, label: "Cinematic Videography" },
                    { icon: <Palette className="w-6 h-6 text-primary mb-4" />, label: "Graphic Design" },
                    { icon: <Code className="w-6 h-6 text-primary mb-4" />, label: "Web Development" },
                  ].map((item, i) => (
                    <GlassCard key={i} className={`p-6 flex flex-col ${i % 2 === 1 ? "mt-6" : ""}`}>
                      {item.icon}
                      <p style={OTF} className="text-sm text-white/25">{item.label}</p>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────── */}
      {teamMembers.length > 0 && (
        <section className="py-20 relative border-t border-white/5" style={{ zIndex: 1 }}>
          <div className="container px-4 md:px-8 max-w-7xl mx-auto">
            <FadeIn className="mb-14">
              <span style={SYN_SM} className="text-[9px] text-primary/70 mb-5 block">Behind The Studio</span>
              <h2 style={SYN} className="text-4xl md:text-5xl font-bold text-white">Our Team</h2>
            </FadeIn>
            <div className={`grid gap-8 ${teamMembers.length === 1 ? "max-w-xs" : teamMembers.length === 2 ? "max-w-xl grid-cols-1 md:grid-cols-2" : teamMembers.length === 3 ? "max-w-3xl grid-cols-1 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
              {teamMembers.map((member, i) => (
                <FadeIn key={member.id ?? i} delay={i * 0.1}>
                  <div className="group text-center">
                    <div className="relative overflow-hidden aspect-[3/4] mb-5 max-w-xs mx-auto" style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", background: "rgba(15,15,15,0.4)" }}>
                      {member.imageUrl ? (
                        <>
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" style={{ background: "rgba(212,175,55,0.08)", mixBlendMode: "overlay" }} />
                          <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span style={SYN} className="text-6xl font-bold text-primary/10">{member.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <h3 style={SYN} className="text-sm font-bold text-white mb-1">{member.name}</h3>
                    {member.role && <p style={OTF} className="text-primary text-xs">{member.role}</p>}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── REVIEWS ──────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="py-24 relative border-t border-white/5" style={{ zIndex: 1 }}>
          <div className="container px-4 md:px-8 max-w-7xl mx-auto">
            <FadeIn className="flex flex-col md:flex-row items-start md:items-end justify-between mb-14 gap-6">
              <div>
                <span style={SYN_SM} className="text-[9px] text-primary/70 mb-5 block">Client Voices</span>
                <h2 style={SYN} className="text-4xl md:text-5xl font-bold text-white">What They Say</h2>
              </div>
              <button onClick={() => setReviewModalOpen(true)} style={SYN}
                className="border border-white/10 text-white/25 hover:border-primary hover:text-primary font-bold tracking-[0.15em] px-6 py-3 flex items-center gap-2 text-[9px] transition-all">
                <MessageSquarePlus className="w-4 h-4" /> WRITE A REVIEW
              </button>
            </FadeIn>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((r: any) => (
                <StaggerItem key={r.id}>
                  <GlassCard className="p-7 flex flex-col h-full">
                    <Quote className="w-6 h-6 text-primary/20 mb-4 shrink-0" />
                    <p style={OTF} className="text-white/25 text-sm leading-relaxed flex-1 mb-5 italic">"{r.text}"</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div>
                        <p style={SYN} className="font-bold text-xs text-white">{r.name}</p>
                        {r.service && <p style={OTF} className="text-white/20 text-xs mt-0.5">{r.service}</p>}
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-primary fill-primary" : "text-white/8"}`} />)}
                      </div>
                    </div>
                  </GlassCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ── CONTACT ──────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative border-t border-white/5" style={{ zIndex: 1 }}>
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <ContactForm contact={contact} />
        </div>
      </section>

      <ReviewModal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} />
    </div>
  );
}
