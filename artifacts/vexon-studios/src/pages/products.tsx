import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { ExternalLink, Download, Package, Globe, Smartphone, Settings, Palette } from "lucide-react";
import { useBookingModal } from "@/context/booking-context";

interface Product {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: "website" | "app" | "system" | "design" | "other";
  demoUrl: string;
  downloadUrl: string;
  actionType: "demo" | "download" | "both" | "none";
  visible: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  website: <Globe className="w-4 h-4" />,
  app: <Smartphone className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
  design: <Palette className="w-4 h-4" />,
  other: <Package className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  website: "Website",
  app: "Mobile App",
  system: "System",
  design: "Design",
  other: "Product",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { openModal } = useBookingModal();

  useEffect(() => {
    getDoc(doc(db, "site_content", "products"))
      .then(snap => {
        if (snap.exists()) {
          const items = (snap.data().items ?? []) as Product[];
          setProducts(items.filter(p => p.visible !== false));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#050505] min-h-screen pt-24">

      {/* ── Hero ── */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-[60%] h-[60%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="container px-4 md:px-6 relative z-10">
          <FadeIn>
            <span className="text-primary/80 text-xs uppercase tracking-[0.3em] mb-6 block font-medium">Our Portfolio</span>
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6">
              Our<br /><span className="text-muted-foreground">Products &amp; Work</span>
            </h1>
            <div className="w-16 h-px bg-primary mb-8" />
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              Sites, apps, and digital systems we have designed and built — crafted for performance, aesthetics, and impact.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Products Grid ── */}
      <section className="pb-32 relative z-10">
        <div className="container px-4 md:px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="border border-white/5 bg-white/2 aspect-video animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32 border border-white/5">
              <Package className="w-12 h-12 mx-auto mb-4 text-primary/20" />
              <h3 className="font-serif text-xl text-muted-foreground">Products coming soon</h3>
              <p className="text-sm text-muted-foreground/50 mt-2">Check back shortly — great things are being built.</p>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-white/5 relative z-10">
        <div className="container px-4 md:px-6 text-center">
          <FadeIn>
            <span className="text-primary/80 text-xs uppercase tracking-[0.3em] mb-4 block">Let's Build Together</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">Have a project in mind?</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-10">
              We build custom digital products, sites, and systems. Tell us what you need.
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-3 border border-primary text-primary hover:bg-primary hover:text-black transition-all duration-300 px-10 py-4 font-medium tracking-widest text-sm"
            >
              START A PROJECT
            </button>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group border border-white/8 bg-white/[0.015] overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="aspect-video bg-[#111] relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {CATEGORY_ICONS[product.category] || <Package className="w-8 h-8 text-white/10" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-primary">{CATEGORY_ICONS[product.category]}</span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </span>
        </div>
        <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
          {product.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-5">
          {product.description}
        </p>
        <div className="flex gap-3 flex-wrap">
          {(product.actionType === "demo" || product.actionType === "both") && product.demoUrl && (
            <a
              href={product.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-primary text-primary hover:bg-primary hover:text-black transition-all duration-200 px-5 py-2 text-xs font-medium tracking-wider"
            >
              <ExternalLink className="w-3.5 h-3.5" /> VIEW DEMO
            </a>
          )}
          {(product.actionType === "download" || product.actionType === "both") && product.downloadUrl && (
            <a
              href={product.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-2 border border-white/15 text-muted-foreground hover:border-white/40 hover:text-foreground transition-all duration-200 px-5 py-2 text-xs font-medium tracking-wider"
            >
              <Download className="w-3.5 h-3.5" /> DOWNLOAD
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
