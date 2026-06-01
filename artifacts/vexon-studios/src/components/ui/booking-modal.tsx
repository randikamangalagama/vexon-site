import { useState, useEffect } from "react";
import { X, CheckCircle, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useBookingModal } from "@/context/booking-context";
import { Button } from "@/components/ui/button";

const services = [
  "Photography – Wedding",
  "Photography – Portrait Session",
  "Photography – Corporate Event",
  "Photography – Commercial",
  "Videography – Wedding Film",
  "Videography – Brand Campaign",
  "Videography – Corporate",
  "General Inquiry",
];

export function BookingModal() {
  const { isOpen, closeModal, initialService } = useBookingModal();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && initialService) {
      setForm((f) => ({ ...f, service: initialService }));
    }
    if (isOpen) {
      setStatus("idle");
      setError("");
    }
  }, [isOpen, initialService]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.service) {
      setError("Please fill in your name, email and service type.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      await addDoc(collection(db, "inquiries"), {
        ...form,
        createdAt: serverTimestamp(),
        status: "new",
      });

      await fetch("https://formsubmit.co/ajax/vexonstudiosmain@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || "Not provided",
          service: form.service,
          date: form.date || "Not specified",
          message: form.message || "No message",
          _subject: `New Booking Inquiry – ${form.service} – ${form.name}`,
        }),
      });

      setStatus("success");
      setForm({ name: "", email: "", phone: "", service: "", date: "", message: "" });
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again or email us directly.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            onClick={closeModal}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f0f0f] border border-border/60 shadow-2xl">
              <div className="sticky top-0 bg-[#0f0f0f] border-b border-border/40 px-8 py-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="font-serif text-2xl font-bold">Book a Session</h2>
                  <p className="text-muted-foreground text-sm mt-1">We respond within 24 hours</p>
                </div>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1" data-testid="button-close-modal">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-8 py-8">
                {status === "success" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
                    <h3 className="font-serif text-3xl font-bold mb-4">Inquiry Received</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto mb-2">
                      Thank you. We've received your inquiry and will be in touch within 24 hours.
                    </p>
                    <p className="text-muted-foreground/60 text-sm mb-8">A confirmation has been sent to our studio inbox.</p>
                    <Button
                      onClick={closeModal}
                      className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-widest px-10 h-12"
                    >
                      CLOSE
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Jane Doe"
                          className="w-full bg-transparent border-b border-border focus:border-primary py-3 outline-none transition-colors text-foreground placeholder:text-muted-foreground/30"
                          data-testid="input-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="jane@example.com"
                          className="w-full bg-transparent border-b border-border focus:border-primary py-3 outline-none transition-colors text-foreground placeholder:text-muted-foreground/30"
                          data-testid="input-email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full bg-transparent border-b border-border focus:border-primary py-3 outline-none transition-colors text-foreground placeholder:text-muted-foreground/30"
                          data-testid="input-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Event / Project Date</label>
                        <input
                          type="date"
                          name="date"
                          value={form.date}
                          onChange={handleChange}
                          className="w-full bg-transparent border-b border-border focus:border-primary py-3 outline-none transition-colors text-foreground"
                          data-testid="input-date"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Service Required *</label>
                      <select
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#0f0f0f] border-b border-border focus:border-primary py-3 outline-none transition-colors text-foreground appearance-none"
                        data-testid="select-service"
                      >
                        <option value="" disabled>Select a service</option>
                        {services.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Tell Us About Your Vision</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Describe your project, event details, location, and any specific requirements..."
                        className="w-full bg-transparent border-b border-border focus:border-primary py-3 outline-none transition-colors text-foreground placeholder:text-muted-foreground/30 resize-none"
                        data-testid="textarea-message"
                      />
                    </div>

                    {error && (
                      <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-widest h-14 mt-2 flex items-center justify-center gap-3"
                      data-testid="button-submit-booking"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          SENDING...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          SEND INQUIRY
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground/50">
                      Or email us directly at{" "}
                      <a href="mailto:vexonstudiosmain@gmail.com" className="text-primary/70 hover:text-primary transition-colors">
                        vexonstudiosmain@gmail.com
                      </a>
                    </p>
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
