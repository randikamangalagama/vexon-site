import { useState } from "react";
import { X, Star, CheckCircle, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const services = ["Photography", "Videography", "Both"];

export function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  const [form, setForm] = useState({ name: "", email: "", service: "", text: "" });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const reset = () => {
    setForm({ name: "", email: "", service: "", text: "" });
    setRating(0);
    setStatus("idle");
    setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || rating === 0 || !form.text) {
      setError("Please fill in all fields and select a rating.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      await addDoc(collection(db, "reviews"), {
        name: form.name,
        email: form.email,
        service: form.service || "General",
        rating,
        text: form.text,
        approved: false,
        createdAt: serverTimestamp(),
      });
      await fetch("https://formsubmit.co/ajax/vexonstudiosmain@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          service: form.service,
          rating: `${rating}/5`,
          review: form.text,
          _subject: `New Client Review (${rating}★) – ${form.name}`,
        }),
      });
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100]" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-lg bg-[#0c0c0c] border border-white/8 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/8">
                <div>
                  <h2 className="font-serif text-xl font-bold">Share Your Experience</h2>
                  <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest">Client Review</p>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-8 py-8">
                {status === "success" ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
                    <CheckCircle className="w-14 h-14 text-primary mx-auto mb-5" />
                    <h3 className="font-serif text-2xl font-bold mb-3">Thank You</h3>
                    <p className="text-muted-foreground mb-6">Your review has been received and will be published after approval.</p>
                    <Button onClick={handleClose} className="rounded-none bg-primary text-primary-foreground tracking-widest px-8">CLOSE</Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Rating *</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} type="button"
                            onClick={() => setRating(s)}
                            onMouseEnter={() => setHover(s)}
                            onMouseLeave={() => setHover(0)}
                            className="transition-transform hover:scale-110">
                            <Star className={`w-8 h-8 transition-colors ${s <= (hover || rating) ? "text-primary fill-primary" : "text-border"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Your Name *</label>
                        <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required
                          className="w-full bg-transparent border-b border-border focus:border-primary py-2 outline-none text-foreground placeholder:text-muted-foreground/30 text-sm"
                          placeholder="Jane Doe" />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Email *</label>
                        <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required
                          className="w-full bg-transparent border-b border-border focus:border-primary py-2 outline-none text-foreground placeholder:text-muted-foreground/30 text-sm"
                          placeholder="you@example.com" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Service</label>
                      <select value={form.service} onChange={(e) => setForm(f => ({ ...f, service: e.target.value }))}
                        className="w-full bg-[#0c0c0c] border-b border-border focus:border-primary py-2 outline-none text-foreground text-sm appearance-none">
                        <option value="">Select service</option>
                        {services.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Your Review *</label>
                      <textarea value={form.text} onChange={(e) => setForm(f => ({ ...f, text: e.target.value }))} required rows={4}
                        className="w-full bg-transparent border-b border-border focus:border-primary py-2 outline-none text-foreground placeholder:text-muted-foreground/30 text-sm resize-none"
                        placeholder="Tell others about your experience working with Vexon Studios..." />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <Button type="submit" disabled={status === "loading"}
                      className="w-full rounded-none bg-primary text-primary-foreground tracking-widest h-12 flex items-center justify-center gap-2">
                      {status === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" />SUBMITTING...</> : <><Send className="w-4 h-4" />SUBMIT REVIEW</>}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
