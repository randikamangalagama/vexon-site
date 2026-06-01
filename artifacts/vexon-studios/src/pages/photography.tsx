import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Mail, Phone, Instagram, Loader2, CheckCircle, X, ChevronLeft, ChevronRight, FolderOpen, Check, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/fade-in";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useBranding } from "@/context/branding-context";

const SYNCOPATE: React.CSSProperties = { fontFamily: "'Syncopate', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" };
const PLAYFAIR: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const OUTFIT: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

interface PhotoItem { url: string; caption?: string; }
interface Shoot { id: string; title: string; description?: string; coverUrl?: string; photos: PhotoItem[]; visible: boolean; createdAt?: any; }
interface Package { id: string; name: string; price: string; description: string; features: string[]; popular?: boolean; visible: boolean; category: string; }

export default function Photography() {
  const { contact } = useBranding();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedShoot, setSelectedShoot] = useState<Shoot | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [form, setForm] = useState({ name: "", email: "", package: "", date: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "shoots"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setShoots(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Shoot, "id">) })).filter(s => s.visible !== false));
    }, () => {});
  }, []);

  useEffect(() => {
    getDoc(doc(db, "site_content", "packages")).then(snap => {
      if (!snap.exists()) return;
      setPackages((snap.data().items ?? []).filter((p: Package) => p.visible !== false));
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { setFormError("Please fill in your name and email."); return; }
    setStatus("loading"); setFormError("");
    try {
      await addDoc(collection(db, "inquiries"), {
        name: form.name, email: form.email,
        service: form.package ? `Photography – ${form.package}` : "Photography Inquiry",
        message: form.message || "No message", date: form.date || "",
        source: "photography_page", createdAt: serverTimestamp(), status: "new",
      });
      await fetch("https://formsubmit.co/ajax/vexonstudiosmain@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, package: form.package || "Not specified", date: form.date || "Not specified", message: form.message || "No message", _subject: `Photography Inquiry – ${form.name}` }),
      });
      setStatus("success"); setForm({ name: "", email: "", package: "", date: "", message: "" });
    } catch { setStatus("error"); setFormError("Something went wrong. Please try again."); }
  };

  const lightboxPhotos = selectedShoot?.photos ?? [];
  const inp = "w-full bg-black/40 border border-white/8 focus:border-primary/60 px-4 py-3 outline-none text-sm text-white transition-colors placeholder:text-white/20";

  return (
    <div className="bg-[#060606] min-h-screen">

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative h-screen min-h-[620px] flex items-center justify-center overflow-hidden">

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }} />

        {/* Warm ambient blobs — romantic gold/rose */}
        <motion.div className="absolute top-[-20%] right-[-5%] w-[50%] h-[50%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)", filter: "blur(80px)" }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[-20%] left-[-5%] w-[55%] h-[55%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 65%)", filter: "blur(80px)" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-4">

          {/* Decorative lines + label */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-5 mb-10">
            <div className="w-16 md:w-24 h-px bg-primary/30" />
            <Heart className="w-3 h-3 text-primary/40" />
            <div className="w-16 md:w-24 h-px bg-primary/30" />
          </motion.div>

          {/* Main romantic heading */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9 }}>
            <h1 style={{ ...PLAYFAIR, fontSize: "clamp(3.2rem, 11vw, 8.5rem)", lineHeight: 0.93 }}
              className="font-bold tracking-tight mb-6 text-white italic">
              <span style={{ display: "block" }}>Your Love Story.</span>
              <span style={{ display: "block", color: "rgba(255,255,255,0.25)" }}>Beautifully Told.</span>
            </h1>
          </motion.div>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.45, duration: 0.5 }}
            className="w-12 h-px bg-primary mx-auto mb-6" />

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={OUTFIT} className="text-white/30 text-sm md:text-base tracking-[0.2em] mb-12">
            Bespoke photography for couples who believe their story deserves to be told beautifully.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#stories" style={SYNCOPATE}
              className="flex items-center gap-3 border border-white/10 text-white/40 hover:border-primary/50 hover:text-primary px-8 py-3.5 text-[10px] font-bold tracking-[0.2em] transition-all duration-300">
              VIEW OUR STORIES
            </a>
            <a href="#booking" style={SYNCOPATE}
              className="bg-primary text-black text-[10px] font-bold tracking-[0.2em] px-8 py-3.5 hover:bg-primary/90 transition-colors">
              BEGIN YOUR STORY
            </a>
          </motion.div>
        </motion.div>

        {/* Back link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="absolute top-24 left-6 md:left-10 z-20">
          <Link href="/" className="flex items-center gap-2 text-white/25 hover:text-primary text-xs tracking-widest transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span style={SYNCOPATE} className="text-[9px]">MAIN STUDIO</span>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-px h-12 bg-gradient-to-b from-primary/30 to-transparent" />
        </motion.div>
      </section>

      {/* ── ROMANTIC QUOTE BANNER ──────────────────────── */}
      <section className="py-16 border-t border-b border-white/5 relative z-10">
        <div className="container px-4 md:px-8 max-w-4xl mx-auto text-center">
          <FadeIn>
            <p style={PLAYFAIR} className="text-xl md:text-2xl text-white/30 italic leading-relaxed">
              "In photographs, we find the past preserved, the present captured, and the future promised."
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── OUR STORIES (Gallery) ─────────────────────── */}
      <section id="stories" className="py-24 relative z-10 border-t border-white/5">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <FadeIn className="mb-14 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <span style={SYNCOPATE} className="text-[9px] text-primary/70 tracking-[0.3em] mb-4 block">Our Work</span>
              <h2 style={PLAYFAIR} className="text-4xl md:text-5xl font-bold text-white italic">Our Stories</h2>
              <p style={OUTFIT} className="text-white/30 text-sm mt-3 max-w-md">A collection of moments we've had the honour of capturing.</p>
            </div>
            <a href="#booking" style={SYNCOPATE}
              className="text-[9px] font-bold border border-white/10 text-white/30 hover:border-primary/50 hover:text-primary px-6 py-3 tracking-widest transition-all duration-200">
              BOOK A SHOOT
            </a>
          </FadeIn>

          {selectedShoot ? (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setSelectedShoot(null)} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-primary transition-colors tracking-wider">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span style={SYNCOPATE} className="text-[9px]">ALL STORIES</span>
                </button>
                <span className="text-white/15">/</span>
                <span style={PLAYFAIR} className="text-sm text-white/60 italic">{selectedShoot.title}</span>
              </div>
              {selectedShoot.photos.length === 0 ? (
                <div className="text-center py-20 border border-white/5 text-white/25 text-sm">No photos in this story yet.</div>
              ) : (
                <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3">
                  {selectedShoot.photos.map((photo, idx) => (
                    <div key={idx} onClick={() => setLightboxIndex(idx)}
                      className="group cursor-zoom-in break-inside-avoid mb-3 overflow-hidden relative"
                      style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                      <img src={photo.url} alt={photo.caption || `Photo ${idx + 1}`}
                        className="w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        {photo.caption && <span style={OUTFIT} className="text-xs text-white/70">{photo.caption}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : shoots.length === 0 ? (
            <div className="py-28 border border-white/5 text-center">
              <FolderOpen className="w-10 h-10 mx-auto mb-4 text-primary/15" />
              <p style={OUTFIT} className="text-white/25 text-sm">Stories coming soon — check back shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {shoots.map((shoot, i) => (
                <FadeIn key={shoot.id} delay={i * 0.08}>
                  <button onClick={() => setSelectedShoot(shoot)}
                    className="group w-full text-left overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", background: "rgba(15,15,15,0.4)" }}>
                    <div className="aspect-[4/3] overflow-hidden relative bg-black/30">
                      {shoot.coverUrl ? (
                        <img src={shoot.coverUrl} alt={shoot.title}
                          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><FolderOpen className="w-8 h-8 text-white/10" /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {shoot.photos?.length > 0 && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm border border-white/10 px-2.5 py-1 text-[10px] text-white/50"
                          style={SYNCOPATE}>{shoot.photos.length}</div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 style={PLAYFAIR} className="font-bold text-lg text-white italic mb-1 group-hover:text-primary transition-colors">{shoot.title}</h3>
                      {shoot.description && <p style={OUTFIT} className="text-white/25 text-xs leading-relaxed line-clamp-2">{shoot.description}</p>}
                    </div>
                  </button>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WEDDING PACKAGES ──────────────────────────── */}
      <section className="py-24 border-t border-white/5 relative z-10">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <FadeIn className="mb-14 text-center max-w-xl mx-auto">
            <span style={SYNCOPATE} className="text-[9px] text-primary/70 tracking-[0.3em] mb-5 block">Packages & Pricing</span>
            <h2 style={PLAYFAIR} className="text-4xl md:text-5xl font-bold mb-4 text-white italic">Wedding Collections</h2>
            <p style={OUTFIT} className="text-white/30 text-sm leading-relaxed">
              Each package is crafted to suit your unique story. Contact us to create something entirely bespoke.
            </p>
          </FadeIn>

          {packages.length === 0 ? (
            <FadeIn>
              <div className="max-w-md mx-auto text-center p-12" style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", background: "rgba(15,15,15,0.4)" }}>
                <Heart className="w-10 h-10 text-primary/20 mx-auto mb-4" />
                <p style={OUTFIT} className="text-white/30 text-sm mb-6">We craft personalised packages for every love story. Let's talk about yours.</p>
                <a href="#booking" style={SYNCOPATE}
                  className="inline-flex items-center gap-2 border border-primary text-primary hover:bg-primary hover:text-black transition-all duration-300 px-8 py-3 text-[10px] font-bold tracking-widest">
                  REQUEST A QUOTE
                </a>
              </div>
            </FadeIn>
          ) : (
            <div className={`grid gap-5 mx-auto ${packages.length === 1 ? "max-w-sm" : packages.length === 2 ? "max-w-2xl grid-cols-1 md:grid-cols-2" : packages.length === 3 ? "max-w-4xl grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}>
              {packages.map((pkg, i) => (
                <FadeIn key={pkg.id} delay={i * 0.1}>
                  <div className={`relative flex flex-col h-full p-8 transition-all duration-300 hover:-translate-y-1 ${pkg.popular ? "border-primary/50" : "border-white/8"}`}
                    style={{ border: `1px solid ${pkg.popular ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.06)"}`, borderRadius: "16px", background: pkg.popular ? "rgba(212,175,55,0.04)" : "rgba(15,15,15,0.4)" }}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-[9px] px-4 py-1 font-bold flex items-center gap-1"
                        style={SYNCOPATE}>
                        <Star className="w-2.5 h-2.5 fill-black" /> MOST POPULAR
                      </div>
                    )}
                    <div className="mb-6">
                      {pkg.category && <span style={SYNCOPATE} className="text-[9px] text-primary/60 mb-2 block">{pkg.category}</span>}
                      <h3 style={PLAYFAIR} className="text-2xl font-bold text-white italic mb-2">{pkg.name}</h3>
                      <div style={SYNCOPATE} className="text-xl font-bold text-primary mb-3">{pkg.price}</div>
                      <p style={OUTFIT} className="text-white/30 text-sm leading-relaxed">{pkg.description}</p>
                    </div>
                    {pkg.features?.length > 0 && (
                      <ul className="space-y-2.5 mb-8 flex-1">
                        {pkg.features.map((f, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm text-white/30" style={OUTFIT}>
                            <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />{f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <a href="#booking" style={SYNCOPATE}
                      className={`block text-center text-[9px] font-bold tracking-widest py-3 transition-all duration-200 ${pkg.popular ? "bg-primary text-black hover:bg-primary/90" : "border border-white/10 text-white/30 hover:border-primary/50 hover:text-primary"}`}>
                      GET STARTED
                    </a>
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BOOKING FORM ──────────────────────────────── */}
      <section id="booking" className="py-24 border-t border-white/5 relative z-10">
        <div className="container px-4 md:px-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

            <div className="lg:col-span-2">
              <FadeIn>
                {/* Romantic heading */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-px bg-primary/40" />
                  <Heart className="w-3 h-3 text-primary/40" />
                  <div className="w-8 h-px bg-primary/40" />
                </div>
                <span style={SYNCOPATE} className="text-[9px] text-primary/70 tracking-[0.3em] mb-5 block">Begin Your Story</span>
                <h2 style={PLAYFAIR} className="text-3xl md:text-4xl font-bold text-white italic mb-6 leading-tight">
                  Let's create something beautiful together.
                </h2>
                <div className="w-10 h-px bg-primary mb-8" />
                <p style={OUTFIT} className="text-white/30 text-sm leading-relaxed mb-10">
                  Fill in your details and we'll be in touch within 24 hours to begin planning your session.
                </p>
                <div className="space-y-5">
                  {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-4 text-white/25 hover:text-primary transition-colors group">
                    <span className="w-10 h-10 border border-white/8 flex items-center justify-center group-hover:border-primary/40 transition-colors shrink-0"><Mail className="w-4 h-4" /></span>
                    <span style={OUTFIT} className="text-sm">{contact.email}</span>
                  </a>}
                  {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-4 text-white/25 hover:text-primary transition-colors group">
                    <span className="w-10 h-10 border border-white/8 flex items-center justify-center group-hover:border-primary/40 transition-colors shrink-0"><Phone className="w-4 h-4" /></span>
                    <span style={OUTFIT} className="text-sm">{contact.phone}</span>
                  </a>}
                  {contact.instagram && <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-white/25 hover:text-primary transition-colors group">
                    <span className="w-10 h-10 border border-white/8 flex items-center justify-center group-hover:border-primary/40 transition-colors shrink-0"><Instagram className="w-4 h-4" /></span>
                    <span style={OUTFIT} className="text-sm">Instagram</span>
                  </a>}
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.2} className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
                    { name: "email", label: "Email Address", type: "email", placeholder: "your@email.com", required: true },
                  ].map(field => (
                    <div key={field.name}>
                      <label style={SYNCOPATE} className="text-[9px] text-white/25 block mb-2">{field.label} {field.required && "*"}</label>
                      <input name={field.name} type={field.type} placeholder={field.placeholder} required={field.required}
                        value={form[field.name as keyof typeof form]} onChange={handleChange} className={inp} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={SYNCOPATE} className="text-[9px] text-white/25 block mb-2">Package</label>
                    <select name="package" value={form.package} onChange={handleChange} className={`${inp} bg-black/40`}>
                      <option value="">Select a package</option>
                      {packages.length > 0
                        ? packages.map(p => <option key={p.id} value={p.name}>{p.name} — {p.price}</option>)
                        : ["Essential", "Standard", "Premium", "Custom"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={SYNCOPATE} className="text-[9px] text-white/25 block mb-2">Preferred Date</label>
                    <input name="date" type="date" value={form.date} onChange={handleChange} className={`${inp} bg-black/40`} />
                  </div>
                </div>
                <div>
                  <label style={SYNCOPATE} className="text-[9px] text-white/25 block mb-2">Your Story</label>
                  <textarea name="message" rows={4} value={form.message} onChange={handleChange}
                    placeholder="Tell us about your day — the venue, the theme, your vision…"
                    className={`${inp} resize-none`} />
                </div>
                {formError && <p style={OUTFIT} className="text-red-400 text-sm border border-red-500/20 bg-red-500/5 px-4 py-3">{formError}</p>}
                {status === "success" && (
                  <div className="flex items-center gap-2 border border-green-500/30 bg-green-500/5 px-4 py-3 text-green-400 text-sm" style={OUTFIT}>
                    <CheckCircle className="w-4 h-4" /> Your story begins — we'll be in touch within 24 hours!
                  </div>
                )}
                <button type="submit" disabled={status === "loading"} style={SYNCOPATE}
                  className="w-full bg-primary text-black text-[10px] font-bold tracking-[0.2em] py-4 hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {status === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" />SENDING…</> : "SEND BOOKING REQUEST"}
                </button>
              </form>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── LIGHTBOX ──────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIndex >= 0 && lightboxPhotos.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/97 z-[100] flex items-center justify-center p-4" onClick={() => setLightboxIndex(-1)}>
            <button onClick={() => setLightboxIndex(-1)} className="absolute top-5 right-5 text-white/30 hover:text-white z-10 p-2"><X className="w-6 h-6" /></button>
            {lightboxPhotos.length > 1 && <>
              <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + lightboxPhotos.length) % lightboxPhotos.length); }}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-3 z-10"><ChevronLeft className="w-8 h-8" /></button>
              <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % lightboxPhotos.length); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-3 z-10"><ChevronRight className="w-8 h-8" /></button>
            </>}
            <motion.img key={lightboxIndex} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              src={lightboxPhotos[lightboxIndex].url} alt="" className="max-w-full max-h-full object-contain select-none" onClick={e => e.stopPropagation()} />
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/25 text-xs tracking-wider" style={SYNCOPATE}>
              {lightboxIndex + 1} / {lightboxPhotos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
