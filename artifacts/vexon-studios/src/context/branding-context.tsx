import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BrandingData {
  logoUrl?: string;
  faviconUrl?: string;
  siteName?: string;
}

export interface ContactData {
  email?: string;
  phone?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  twitter?: string;
  tiktok?: string;
}

interface BrandingContextType {
  branding: BrandingData;
  contact: ContactData;
  loading: boolean;
  reload: () => void;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: {},
  contact: {},
  loading: true,
  reload: () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingData>({});
  const [contact, setContact] = useState<ContactData>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([
        getDoc(doc(db, "site_content", "branding")),
        getDoc(doc(db, "site_content", "contact")),
      ]);
      if (b.exists()) setBranding(b.data() as BrandingData);
      if (c.exists()) setContact(c.data() as ContactData);
    } catch {
      // silently fail — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Dynamic favicon
  useEffect(() => {
    if (!branding.faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }, [branding.faviconUrl]);

  return (
    <BrandingContext.Provider value={{ branding, contact, loading, reload: load }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
