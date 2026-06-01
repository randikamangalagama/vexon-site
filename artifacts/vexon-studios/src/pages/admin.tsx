import { useState, useEffect, useRef } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot, updateDoc,
  deleteDoc, doc, setDoc, addDoc, getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { sendOtp, verifyOtp } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, CheckCircle, Loader2, Trash2, Image, Users, Settings, LogOut,
  Shield, Eye, EyeOff, Upload, Check, X, RefreshCw, Plus, Camera,
  FolderOpen, ChevronLeft, AlertCircle, MessageSquare, Mail,
  Package, Palette, Globe, Smartphone, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ADMIN_EMAIL = "vexonstudiosmain@gmail.com";
const CLOUDINARY_CLOUD = "dyfwks8az";
const CLOUDINARY_PRESET = "vexon_unsigned";

type Stage = "login" | "otp" | "dashboard";
type Tab = "reviews" | "messages" | "shoots" | "team" | "packages" | "products" | "settings" | "branding";

// ── Types ────────────────────────────────────────────────────────────
interface Review { id: string; name: string; email: string; service: string; rating: number; text: string; approved: boolean; createdAt?: any; }
interface Message { id: string; name: string; email: string; service?: string; message: string; date?: string; source?: string; status: string; createdAt?: any; }
interface PhotoItem { url: string; caption?: string; }
interface Shoot { id: string; title: string; description?: string; coverUrl?: string; photos: PhotoItem[]; visible: boolean; createdAt?: any; }
interface TeamMember { id: string; name: string; role: string; imageUrl: string; bio?: string; }
interface Package { id: string; name: string; price: string; description: string; features: string[]; popular: boolean; visible: boolean; category: string; }
interface Product { id: string; title: string; description: string; imageUrl: string; category: string; demoUrl: string; downloadUrl: string; actionType: "demo" | "download" | "both" | "none"; visible: boolean; }
interface BrandingData { logoUrl: string; faviconUrl: string; siteName: string; }
interface ContactData { email: string; phone: string; address: string; instagram: string; facebook: string; whatsapp: string; twitter: string; tiktok: string; showreelUrl: string; }

// ── Cloudinary upload ─────────────────────────────────────────────────
function uploadToCloudinary(file: File, onProgress?: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_PRESET);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`);
    xhr.upload.addEventListener("progress", e => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve((JSON.parse(xhr.responseText) as any).secure_url); }
        catch { reject(new Error("Invalid response")); }
      } else {
        try { reject(new Error((JSON.parse(xhr.responseText) as any).error?.message || `Upload failed (${xhr.status})`)); }
        catch { reject(new Error(`Upload failed: ${xhr.status}`)); }
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.send(fd);
  });
}

// ── Small helpers ────────────────────────────────────────────────────
function StarRow({ n }: { n: number }) {
  return <span className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= n ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`} />)}</span>;
}
function Err({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{msg}</span></div>;
}
function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-widest text-muted-foreground/55 block mb-1.5">{label}</label>
      <input {...props} className="w-full bg-[#080808] border border-white/10 focus:border-primary px-3 py-2.5 outline-none text-sm text-foreground transition-colors" />
    </div>
  );
}
function SaveBtn({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <Button onClick={onClick} disabled={saving} className="rounded-none bg-primary text-black font-bold tracking-widest px-10">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "SAVE"}
      </Button>
      {saved && <span className="text-green-400 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved!</span>}
    </div>
  );
}

// ── Shared file upload button ─────────────────────────────────────────
function FileUploadArea({ label, file, onChange, accept = "image/*" }: { label: string; file: File | null; onChange: (f: File) => void; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="flex items-center gap-3 cursor-pointer border border-dashed border-white/12 hover:border-primary/50 px-4 py-3 transition-colors group">
      <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      <span className="text-sm">{file ? <span className="text-primary font-medium">{file.name}</span> : label}</span>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
    </label>
  );
}

// ════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { user, loading } = useAuth();
  const [stage, setStage] = useState<Stage>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailRO, setEmailRO] = useState(true);
  const [passRO, setPassRO] = useState(true);
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("reviews");

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending" | "approved">("all");
  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  // Shoots
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [selectedShootId, setSelectedShootId] = useState<string | null>(null);
  const selectedShoot = selectedShootId ? (shoots.find(s => s.id === selectedShootId) ?? null) : null;
  const [newShootTitle, setNewShootTitle] = useState("");
  const [newShootDesc, setNewShootDesc] = useState("");
  const [showNewShootForm, setShowNewShootForm] = useState(false);
  const [creatingShoot, setCreatingShoot] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [uploadShootFile, setUploadShootFile] = useState<File | null>(null);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [shootProgress, setShootProgress] = useState<number | null>(null);
  const [shootError, setShootError] = useState("");
  const shootFileRef = useRef<HTMLInputElement>(null);
  // Team
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamSaved, setTeamSaved] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "", bio: "", imageUrl: "" });
  const [newMemberFile, setNewMemberFile] = useState<File | null>(null);
  const [newMemberSaving, setNewMemberSaving] = useState(false);
  const newMemberFileRef = useRef<HTMLInputElement>(null);
  // Packages
  const [packages, setPackages] = useState<Package[]>([]);
  const [savingPackages, setSavingPackages] = useState(false);
  const [packagesSaved, setPackagesSaved] = useState(false);
  const [packagesError, setPackagesError] = useState("");
  const [addingPackage, setAddingPackage] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: "", price: "", description: "", category: "", features: "", popular: false });
  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [savingProducts, setSavingProducts] = useState(false);
  const [productsSaved, setProductsSaved] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: "", description: "", imageUrl: "", category: "website", demoUrl: "", downloadUrl: "", actionType: "demo" as Product["actionType"] });
  const [newProductFile, setNewProductFile] = useState<File | null>(null);
  const [newProductSaving, setNewProductSaving] = useState(false);
  const newProductFileRef = useRef<HTMLInputElement>(null);
  // Settings (showreel + contact)
  const [settings, setSettings] = useState<ContactData>({ email: "", phone: "", address: "", instagram: "", facebook: "", whatsapp: "", twitter: "", tiktok: "", showreelUrl: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  // Branding
  const [branding, setBranding] = useState<BrandingData>({ logoUrl: "", faviconUrl: "", siteName: "Vexon Studios" });
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [brandingError, setBrandingError] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);

  // Auto-send OTP if already logged in
  useEffect(() => {
    if (!loading && user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && stage === "login") {
      sendOtp(ADMIN_EMAIL).then(({ sessionId: sid }) => { setSessionId(sid); setStage("otp"); }).catch((e: any) => setErr(e.message));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // Load all dashboard data
  useEffect(() => {
    if (stage !== "dashboard") return;

    const unsubReviews = onSnapshot(query(collection(db, "reviews"), orderBy("createdAt", "desc")), snap => setReviews(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }))), () => {});
    const unsubMessages = onSnapshot(query(collection(db, "inquiries"), orderBy("createdAt", "desc")), snap => setMessages(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))), () => {});
    const unsubShoots = onSnapshot(query(collection(db, "shoots"), orderBy("createdAt", "desc")), snap => setShoots(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Shoot, "id">) }))), () => {});

    // Load one-time docs
    Promise.all([
      getDoc(doc(db, "site_content", "team")),
      getDoc(doc(db, "site_content", "packages")),
      getDoc(doc(db, "site_content", "products")),
      getDoc(doc(db, "site_content", "contact")),
      getDoc(doc(db, "site_content", "homepage")),
      getDoc(doc(db, "site_content", "branding")),
    ]).then(([teamSnap, pkgSnap, prodSnap, contactSnap, homeSnap, brandingSnap]) => {
      // Team
      if (teamSnap.exists()) {
        const d = teamSnap.data();
        if (d.members?.length) setMembers(d.members);
        else {
          const legacy: TeamMember[] = [];
          if (d.member1?.name) legacy.push({ id: "m1", ...d.member1 });
          if (d.member2?.name) legacy.push({ id: "m2", ...d.member2 });
          setMembers(legacy);
        }
      }
      // Packages
      if (pkgSnap.exists()) setPackages(pkgSnap.data().items ?? []);
      // Products
      if (prodSnap.exists()) setProducts(prodSnap.data().items ?? []);
      // Contact + showreel
      const contactData = contactSnap.exists() ? contactSnap.data() : {};
      const homeData = homeSnap.exists() ? homeSnap.data() : {};
      setSettings({ email: "", phone: "", address: "", instagram: "", facebook: "", whatsapp: "", twitter: "", tiktok: "", showreelUrl: "", ...contactData, showreelUrl: homeData.showreelUrl ?? "" });
      // Branding
      if (brandingSnap.exists()) setBranding({ logoUrl: "", faviconUrl: "", siteName: "Vexon Studios", ...(brandingSnap.data() as BrandingData) });
    }).catch(() => {});

    return () => { unsubReviews(); unsubMessages(); unsubShoots(); };
  }, [stage]);

  // ── Auth ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) throw new Error("Unauthorized email");
      await signInWithEmailAndPassword(auth, email, password);
      const { sessionId: sid } = await sendOtp(email);
      setSessionId(sid); setStage("otp");
    } catch (e: any) { setErr(e.message ?? "Login failed"); }
    finally { setBusy(false); }
  };
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await verifyOtp(sessionId, otp); setStage("dashboard"); }
    catch (e: any) { setErr(e.message ?? "Verification failed"); }
    finally { setBusy(false); }
  };
  const handleResendOtp = async () => {
    setBusy(true); setErr("");
    try { const { sessionId: sid } = await sendOtp(email || ADMIN_EMAIL); setSessionId(sid); setErr("New code sent."); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };
  const handleSignOut = async () => { await signOut(auth); setStage("login"); setPassword(""); setOtp(""); };

  // ── Reviews ─────────────────────────────────────────────────────────
  const approveReview = (id: string) => updateDoc(doc(db, "reviews", id), { approved: true });
  const rejectReview = (id: string) => updateDoc(doc(db, "reviews", id), { approved: false });
  const deleteReview = (id: string) => { if (confirm("Delete?")) deleteDoc(doc(db, "reviews", id)); };
  const filteredReviews = reviews.filter(r => reviewFilter === "all" ? true : reviewFilter === "approved" ? r.approved : !r.approved);
  const pending = reviews.filter(r => !r.approved).length;
  const unread = messages.filter(m => m.status === "new").length;

  // ── Shoots ──────────────────────────────────────────────────────────
  const createShoot = async () => {
    if (!newShootTitle.trim()) return;
    setCreatingShoot(true); setCreateError("");
    try {
      await addDoc(collection(db, "shoots"), { title: newShootTitle.trim(), description: newShootDesc.trim(), photos: [], visible: true, coverUrl: "", createdAt: new Date() });
      setNewShootTitle(""); setNewShootDesc(""); setShowNewShootForm(false);
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreatingShoot(false); }
  };
  const addPhoto = async (shoot: Shoot) => {
    setShootError(""); setShootProgress(null);
    if (!newPhotoUrl.trim() && !uploadShootFile) { setShootError("Paste a URL or select a file."); return; }
    setAddingPhoto(true);
    let url = newPhotoUrl.trim();
    try {
      if (uploadShootFile) url = await uploadToCloudinary(uploadShootFile, pct => setShootProgress(pct));
      await updateDoc(doc(db, "shoots", shoot.id), { photos: [...(shoot.photos ?? []), { url, caption: newPhotoCaption.trim() }], coverUrl: shoot.coverUrl || url });
      setNewPhotoUrl(""); setNewPhotoCaption(""); setUploadShootFile(null); setShootProgress(null);
      if (shootFileRef.current) shootFileRef.current.value = "";
    } catch (e: any) { setShootError(e.message); setShootProgress(null); }
    finally { setAddingPhoto(false); }
  };
  const removePhoto = async (shoot: Shoot, idx: number) => {
    const p = (shoot.photos ?? []).filter((_, i) => i !== idx);
    await updateDoc(doc(db, "shoots", shoot.id), { photos: p, coverUrl: p[0]?.url || "" });
  };
  const toggleShootVisibility = (shoot: Shoot) => updateDoc(doc(db, "shoots", shoot.id), { visible: !shoot.visible });
  const deleteShoot = (id: string) => { if (confirm("Delete this shoot?")) { deleteDoc(doc(db, "shoots", id)); if (selectedShootId === id) setSelectedShootId(null); } };

  // ── Team ────────────────────────────────────────────────────────────
  const saveTeamFS = (updated: TeamMember[]) => setDoc(doc(db, "site_content", "team"), { members: updated }, { merge: true });
  const addMember = async () => {
    if (!newMember.name.trim()) return;
    setNewMemberSaving(true);
    let imageUrl = newMember.imageUrl;
    try {
      if (newMemberFile) imageUrl = await uploadToCloudinary(newMemberFile);
      const m: TeamMember = { id: Date.now().toString(), name: newMember.name.trim(), role: newMember.role.trim(), imageUrl, bio: newMember.bio.trim() };
      const updated = [...members, m];
      await saveTeamFS(updated); setMembers(updated);
      setNewMember({ name: "", role: "", bio: "", imageUrl: "" }); setNewMemberFile(null); setAddingMember(false);
    } catch (e: any) { setTeamError(e.message); }
    finally { setNewMemberSaving(false); }
  };
  const removeMember = async (id: string) => { if (!confirm("Remove?")) return; const u = members.filter(m => m.id !== id); await saveTeamFS(u); setMembers(u); };
  const updateMemberField = (id: string, field: keyof TeamMember, value: string) => setMembers(p => p.map(m => m.id === id ? { ...m, [field]: value } : m));
  const uploadMemberPhoto = async (id: string, file: File) => { try { const url = await uploadToCloudinary(file); updateMemberField(id, "imageUrl", url); } catch (e: any) { setTeamError(e.message); } };
  const saveTeam = async () => { setSavingTeam(true); setTeamError(""); setTeamSaved(false); try { await saveTeamFS(members); setTeamSaved(true); setTimeout(() => setTeamSaved(false), 3000); } catch (e: any) { setTeamError(e.message); } finally { setSavingTeam(false); } };

  // ── Packages ────────────────────────────────────────────────────────
  const savePackagesFS = (items: Package[]) => setDoc(doc(db, "site_content", "packages"), { items }, { merge: true });
  const addPackage = async () => {
    if (!newPkg.name.trim()) return;
    const pkg: Package = {
      id: Date.now().toString(), name: newPkg.name.trim(), price: newPkg.price.trim(),
      description: newPkg.description.trim(), category: newPkg.category.trim(),
      features: newPkg.features.split("\n").map(f => f.trim()).filter(Boolean),
      popular: newPkg.popular, visible: true,
    };
    const updated = [...packages, pkg];
    await savePackagesFS(updated); setPackages(updated);
    setNewPkg({ name: "", price: "", description: "", category: "", features: "", popular: false }); setAddingPackage(false);
  };
  const removePackage = async (id: string) => { if (!confirm("Remove package?")) return; const u = packages.filter(p => p.id !== id); await savePackagesFS(u); setPackages(u); };
  const updatePkgField = (id: string, field: keyof Package, value: any) => setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  const savePackages = async () => { setSavingPackages(true); setPackagesError(""); setPackagesSaved(false); try { await savePackagesFS(packages); setPackagesSaved(true); setTimeout(() => setPackagesSaved(false), 3000); } catch (e: any) { setPackagesError(e.message); } finally { setSavingPackages(false); } };

  // ── Products ────────────────────────────────────────────────────────
  const saveProductsFS = (items: Product[]) => setDoc(doc(db, "site_content", "products"), { items }, { merge: true });
  const addProduct = async () => {
    if (!newProduct.title.trim()) return;
    setNewProductSaving(true);
    let imageUrl = newProduct.imageUrl;
    try {
      if (newProductFile) imageUrl = await uploadToCloudinary(newProductFile);
      const prod: Product = { id: Date.now().toString(), ...newProduct, imageUrl, visible: true };
      const updated = [...products, prod];
      await saveProductsFS(updated); setProducts(updated);
      setNewProduct({ title: "", description: "", imageUrl: "", category: "website", demoUrl: "", downloadUrl: "", actionType: "demo" });
      setNewProductFile(null); setAddingProduct(false);
    } catch (e: any) { setProductsError(e.message); }
    finally { setNewProductSaving(false); }
  };
  const removeProduct = async (id: string) => { if (!confirm("Remove?")) return; const u = products.filter(p => p.id !== id); await saveProductsFS(u); setProducts(u); };
  const updateProductField = (id: string, field: keyof Product, value: any) => setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  const saveProducts = async () => { setSavingProducts(true); setProductsError(""); setProductsSaved(false); try { await saveProductsFS(products); setProductsSaved(true); setTimeout(() => setProductsSaved(false), 3000); } catch (e: any) { setProductsError(e.message); } finally { setSavingProducts(false); } };

  // ── Settings ─────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setSavingSettings(true); setSettingsError(""); setSettingsSaved(false);
    try {
      const { showreelUrl, ...contactFields } = settings;
      await Promise.all([
        setDoc(doc(db, "site_content", "contact"), contactFields, { merge: true }),
        setDoc(doc(db, "site_content", "homepage"), { showreelUrl }, { merge: true }),
      ]);
      setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000);
    } catch (e: any) { setSettingsError(e.message); }
    finally { setSavingSettings(false); }
  };

  // ── Branding ─────────────────────────────────────────────────────────
  const uploadLogoFile = async () => {
    if (!logoFile) return;
    setLogoUploading(true);
    try { const url = await uploadToCloudinary(logoFile); setBranding(b => ({ ...b, logoUrl: url })); setLogoFile(null); }
    catch (e: any) { setBrandingError(e.message); }
    finally { setLogoUploading(false); }
  };
  const uploadFaviconFile = async () => {
    if (!faviconFile) return;
    setFaviconUploading(true);
    try { const url = await uploadToCloudinary(faviconFile); setBranding(b => ({ ...b, faviconUrl: url })); setFaviconFile(null); }
    catch (e: any) { setBrandingError(e.message); }
    finally { setFaviconUploading(false); }
  };
  const saveBranding = async () => {
    setSavingBranding(true); setBrandingError(""); setBrandingSaved(false);
    try { await setDoc(doc(db, "site_content", "branding"), branding, { merge: true }); setBrandingSaved(true); setTimeout(() => setBrandingSaved(false), 3000); }
    catch (e: any) { setBrandingError(e.message); }
    finally { setSavingBranding(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  // ──────────────────────── LOGIN ──────────────────────────────────────
  if (stage === "login") return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md border border-white/8 bg-[#0f0f0f] p-10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary rounded mx-auto mb-4 flex items-center justify-center"><Shield className="w-6 h-6 text-black" /></div>
          <h1 className="font-serif text-2xl font-bold">Admin Access</h1>
          <p className="text-muted-foreground text-sm mt-1">Vexon Studios Control Panel</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
          <input type="text" name="fakeuser" style={{ display: "none" }} readOnly />
          <input type="password" name="fakepass" style={{ display: "none" }} readOnly />
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Email</label>
            <input name="vx-email" type="text" autoComplete="off" readOnly={emailRO} onFocus={() => setEmailRO(false)} value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-[#080808] border border-white/10 focus:border-primary px-4 py-3 outline-none text-sm transition-colors" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Password</label>
            <div className="relative">
              <input name="vx-pass" type={showPw ? "text" : "password"} autoComplete="new-password" readOnly={passRO} onFocus={() => setPassRO(false)} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-[#080808] border border-white/10 focus:border-primary px-4 py-3 pr-12 outline-none text-sm transition-colors" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {err && <Err msg={err} />}
          <Button type="submit" disabled={busy} className="w-full rounded-none bg-primary text-black font-bold tracking-widest h-12">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "REQUEST ACCESS CODE"}
          </Button>
        </form>
      </motion.div>
    </div>
  );

  // ──────────────────────── OTP ──────────────────────────────────────
  if (stage === "otp") return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md border border-white/8 bg-[#0f0f0f] p-10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary/20 border border-primary rounded-full mx-auto mb-4 flex items-center justify-center"><Shield className="w-6 h-6 text-primary" /></div>
          <h1 className="font-serif text-2xl font-bold">Two-Factor Auth</h1>
          <p className="text-muted-foreground text-sm mt-2">Code sent to <strong className="text-foreground">{ADMIN_EMAIL}</strong></p>
        </div>
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Verification Code</label>
            <input type="text" inputMode="numeric" maxLength={6} value={otp} autoComplete="one-time-code" onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-[#080808] border border-white/10 focus:border-primary px-4 py-3 outline-none text-center text-3xl tracking-[1.2em] font-mono transition-colors" placeholder="——————" required />
          </div>
          {err && <p className={`text-sm ${err.includes("sent") ? "text-green-400" : "text-red-400"}`}>{err}</p>}
          <Button type="submit" disabled={busy || otp.length < 6} className="w-full rounded-none bg-primary text-black font-bold tracking-widest h-12">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "VERIFY CODE"}
          </Button>
          <button type="button" onClick={handleResendOtp} disabled={busy} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Resend code
          </button>
        </form>
      </motion.div>
    </div>
  );

  // ──────────────────────── DASHBOARD ────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" />, badge: pending },
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" />, badge: unread },
    { id: "shoots", label: "Photo Shoots", icon: <Camera className="w-4 h-4" /> },
    { id: "team", label: "Team", icon: <Users className="w-4 h-4" /> },
    { id: "packages", label: "Packages", icon: <Star className="w-4 h-4" /> },
    { id: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
    { id: "settings", label: "Site Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "branding", label: "Branding", icon: <Palette className="w-4 h-4" /> },
  ];

  const inp = "w-full bg-[#080808] border border-white/10 focus:border-primary px-3 py-2.5 outline-none text-sm text-foreground transition-colors";

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <header className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#080808]/95 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary flex items-center justify-center font-serif font-bold text-black text-lg">V</div>
          <span className="font-serif font-bold tracking-wide text-sm">VEXON STUDIOS</span>
          <span className="text-muted-foreground text-xs ml-1 uppercase tracking-wider">Admin</span>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-52 border-r border-white/8 p-3 flex-col gap-0.5 hidden md:flex shrink-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-left transition-all relative ${tab === t.id ? "text-primary bg-primary/8 border-l-2 border-primary pl-[10px]" : "text-muted-foreground hover:text-foreground hover:bg-white/3"}`}>
              {t.icon}{t.label}
              {t.badge ? <span className="ml-auto bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{t.badge}</span> : null}
            </button>
          ))}
        </aside>

        {/* Mobile bottom tabs */}
        <div className="md:hidden fixed bottom-0 inset-x-0 flex border-t border-white/8 bg-[#080808]/95 backdrop-blur-md z-40 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-none flex flex-col items-center gap-1 py-3 px-3 text-[9px] font-medium transition-all ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
              {t.icon}{t.label.split(" ")[0]}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-24 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.12 }}>

              {/* ── REVIEWS ── */}
              {tab === "reviews" && (
                <div>
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h2 className="font-serif text-2xl font-bold">Client Reviews</h2>
                    <div className="flex gap-2">{(["all","pending","approved"] as const).map(f => (
                      <button key={f} onClick={() => setReviewFilter(f)} className={`px-4 py-1.5 text-xs uppercase tracking-wider border transition-colors ${reviewFilter===f?"border-primary text-primary":"border-white/10 text-muted-foreground hover:border-white/30"}`}>
                        {f}{f==="pending"&&pending>0?` (${pending})`:""}
                      </button>
                    ))}</div>
                  </div>
                  {filteredReviews.length === 0 ? <div className="text-center py-20 text-muted-foreground text-sm">No reviews found.</div> : (
                    <div className="flex flex-col gap-4">
                      {filteredReviews.map(r => (
                        <div key={r.id} className={`border rounded p-5 ${r.approved?"border-white/8 bg-white/2":"border-primary/20 bg-primary/3"}`}>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="font-semibold text-sm">{r.name}</span>
                                <StarRow n={r.rating} />
                                <span className={`text-xs px-2 py-0.5 border ${r.approved?"border-green-500/30 text-green-400":"border-yellow-500/30 text-yellow-400"}`}>{r.approved?"Approved":"Pending"}</span>
                                {r.service && <span className="text-xs text-muted-foreground border border-white/10 px-2 py-0.5">{r.service}</span>}
                              </div>
                              <p className="text-muted-foreground text-sm mb-1">"{r.text}"</p>
                              <p className="text-xs text-muted-foreground/40">{r.email}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {!r.approved && <button onClick={() => approveReview(r.id)} className="text-xs border border-green-500/40 text-green-400 hover:bg-green-500/10 px-3 py-1.5 transition-colors flex items-center gap-1"><Check className="w-3 h-3"/>Approve</button>}
                              {r.approved && <button onClick={() => rejectReview(r.id)} className="text-xs border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 px-3 py-1.5 transition-colors flex items-center gap-1"><X className="w-3 h-3"/>Unpublish</button>}
                              <button onClick={() => deleteReview(r.id)} className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-1.5 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── MESSAGES ── */}
              {tab === "messages" && (
                <div>
                  <h2 className="font-serif text-2xl font-bold mb-6">Contact Messages</h2>
                  {messages.length === 0 ? (
                    <div className="text-center py-20 border border-white/5 text-muted-foreground text-sm"><MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20"/>No messages yet.</div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {messages.map(m => (
                        <div key={m.id} className={`border p-5 ${m.status==="new"?"border-blue-500/20 bg-blue-500/3":"border-white/8 bg-white/2"}`}>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="font-semibold text-sm">{m.name}</span>
                                {m.status==="new" && <span className="text-xs border border-blue-500/40 text-blue-400 px-2 py-0.5">New</span>}
                                {m.service && <span className="text-xs text-muted-foreground border border-white/10 px-2 py-0.5">{m.service}</span>}
                              </div>
                              <p className="text-muted-foreground text-sm mb-2">{m.message}</p>
                              <a href={`mailto:${m.email}?subject=Re: Vexon Studios Inquiry`} className="text-xs text-primary flex items-center gap-1 hover:underline"><Mail className="w-3 h-3"/>{m.email}</a>
                            </div>
                            <div className="flex gap-2">
                              {m.status==="new" && <button onClick={() => updateDoc(doc(db,"inquiries",m.id),{status:"read"})} className="text-xs border border-white/15 text-muted-foreground hover:border-white/30 px-3 py-1.5 flex items-center gap-1"><Check className="w-3 h-3"/>Read</button>}
                              <button onClick={() => { if(confirm("Delete?")) deleteDoc(doc(db,"inquiries",m.id)); }} className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 p-1.5"><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── PHOTO SHOOTS ── */}
              {tab === "shoots" && (
                <div>
                  {selectedShoot ? (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => { setSelectedShootId(null); setShootError(""); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"><ChevronLeft className="w-4 h-4"/>All Shoots</button>
                        <span className="text-white/20">/</span>
                        <span className="font-serif font-bold">{selectedShoot.title}</span>
                      </div>
                      <div className="border border-white/8 p-5 bg-white/2 mb-6">
                        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Add Photo</h3>
                        <input value={newPhotoCaption} onChange={e => setNewPhotoCaption(e.target.value)} placeholder="Caption (optional)" className={`${inp} mb-3`}/>
                        <div className="mb-3">
                          <label className="text-[11px] uppercase tracking-widest text-muted-foreground/55 block mb-1.5">Option A — URL</label>
                          <input value={newPhotoUrl} onChange={e => { setNewPhotoUrl(e.target.value); if(e.target.value) setUploadShootFile(null); }} placeholder="https://..." className={inp}/>
                        </div>
                        <div className="mb-3">
                          <label className="text-[11px] uppercase tracking-widest text-muted-foreground/55 block mb-1.5">Option B — Upload</label>
                          <label className="flex items-center gap-3 cursor-pointer border border-dashed border-white/15 hover:border-primary/60 px-4 py-3 transition-colors group">
                            <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0"/>
                            <span className="text-sm">{uploadShootFile ? <span className="text-primary">{uploadShootFile.name}</span> : "Choose photo"}</span>
                            <input ref={shootFileRef} type="file" accept="image/*" className="hidden" onChange={e => { setUploadShootFile(e.target.files?.[0]??null); setNewPhotoUrl(""); }}/>
                          </label>
                        </div>
                        {shootProgress !== null && <div className="mb-3"><div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Uploading…</span><span>{shootProgress}%</span></div><div className="w-full bg-white/5 h-1.5"><div className="bg-primary h-1.5 transition-all" style={{width:`${shootProgress}%`}}/></div></div>}
                        <Err msg={shootError}/>
                        <div className="flex justify-end mt-3">
                          <Button onClick={() => addPhoto(selectedShoot)} disabled={addingPhoto||(!newPhotoUrl.trim()&&!uploadShootFile)} className="rounded-none bg-primary text-black font-bold tracking-widest px-7 text-xs">
                            {addingPhoto?<><Loader2 className="w-3.5 h-3.5 animate-spin mr-1"/>Adding…</>:<><Plus className="w-3.5 h-3.5 mr-1"/>ADD PHOTO</>}
                          </Button>
                        </div>
                      </div>
                      {selectedShoot.photos.length===0
                        ? <div className="text-center py-16 border border-white/5 text-muted-foreground text-sm"><Image className="w-10 h-10 mx-auto mb-3 opacity-20"/>No photos yet.</div>
                        : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {selectedShoot.photos.map((p,idx)=>(
                              <div key={idx} className="relative group border border-white/8 overflow-hidden aspect-square bg-[#111]">
                                <img src={p.url} alt={p.caption||`${idx+1}`} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button onClick={()=>removePhoto(selectedShoot,idx)} className="p-1.5 bg-red-500/30 hover:bg-red-500/60 rounded"><Trash2 className="w-3.5 h-3.5 text-red-300"/></button>
                                </div>
                                {idx===0&&<div className="absolute top-2 left-2 text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 border border-primary/30">Cover</div>}
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif text-2xl font-bold">Photo Shoots</h2>
                        <Button onClick={() => { setShowNewShootForm(true); setCreateError(""); }} className="rounded-none bg-primary text-black font-bold tracking-widest px-5 text-xs flex items-center gap-2"><Plus className="w-3.5 h-3.5"/>NEW SHOOT</Button>
                      </div>
                      {showNewShootForm && (
                        <div className="border border-primary/20 bg-primary/3 p-5 mb-6">
                          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">New Shoot</h3>
                          <div className="space-y-3 mb-4">
                            <input value={newShootTitle} onChange={e=>setNewShootTitle(e.target.value)} placeholder="Title *" className={inp} autoFocus onKeyDown={e=>e.key==="Enter"&&createShoot()}/>
                            <input value={newShootDesc} onChange={e=>setNewShootDesc(e.target.value)} placeholder="Description (optional)" className={inp}/>
                          </div>
                          <Err msg={createError}/>
                          <div className="flex gap-3 mt-3">
                            <Button onClick={createShoot} disabled={creatingShoot||!newShootTitle.trim()} className="rounded-none bg-primary text-black font-bold tracking-widest px-6 text-xs">
                              {creatingShoot?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:"CREATE"}
                            </Button>
                            <button onClick={()=>{setShowNewShootForm(false);setNewShootTitle("");setNewShootDesc("");}} className="text-xs text-muted-foreground hover:text-foreground px-4">Cancel</button>
                          </div>
                        </div>
                      )}
                      {shoots.length===0
                        ? <div className="text-center py-20 border border-white/5 text-muted-foreground text-sm"><FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-20"/>No shoots yet.</div>
                        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shoots.map(shoot=>(
                              <div key={shoot.id} className={`border ${shoot.visible?"border-white/8 bg-white/2":"border-white/4 opacity-55"}`}>
                                <div className="aspect-video bg-[#111] relative overflow-hidden cursor-pointer" onClick={()=>setSelectedShootId(shoot.id)}>
                                  {shoot.coverUrl?<img src={shoot.coverUrl} alt={shoot.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"/>:<div className="w-full h-full flex items-center justify-center"><Camera className="w-8 h-8 text-white/10"/></div>}
                                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 text-[10px] text-muted-foreground">{shoot.photos?.length??0} photos</div>
                                </div>
                                <div className="p-4">
                                  <h3 className="font-semibold text-sm mb-3 truncate">{shoot.title}</h3>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button onClick={()=>setSelectedShootId(shoot.id)} className="text-xs border border-primary/40 text-primary hover:bg-primary/10 px-3 py-1.5 flex items-center gap-1"><Upload className="w-3 h-3"/>Add Photos</button>
                                    <button onClick={()=>toggleShootVisibility(shoot)} className="text-xs border border-white/10 text-muted-foreground hover:border-white/30 px-3 py-1.5 flex items-center gap-1">{shoot.visible?<><Eye className="w-3 h-3"/>Visible</>:<><EyeOff className="w-3 h-3"/>Hidden</>}</button>
                                    <button onClick={()=>deleteShoot(shoot.id)} className="ml-auto text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 p-1.5"><Trash2 className="w-3.5 h-3.5"/></button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  )}
                </div>
              )}

              {/* ── TEAM ── */}
              {tab === "team" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div><h2 className="font-serif text-2xl font-bold">Team</h2><p className="text-xs text-muted-foreground mt-0.5">Members shown on the website.</p></div>
                    <Button onClick={()=>setAddingMember(true)} className="rounded-none bg-primary text-black font-bold tracking-widest px-5 text-xs flex items-center gap-2"><Plus className="w-3.5 h-3.5"/>ADD MEMBER</Button>
                  </div>
                  {addingMember && (
                    <div className="border border-primary/20 bg-primary/3 p-5 mb-6">
                      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">New Member</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input value={newMember.name} onChange={e=>setNewMember(v=>({...v,name:e.target.value}))} placeholder="Full Name *" autoFocus className={inp}/>
                        <input value={newMember.role} onChange={e=>setNewMember(v=>({...v,role:e.target.value}))} placeholder="Role / Title" className={inp}/>
                      </div>
                      <input value={newMember.imageUrl} onChange={e=>setNewMember(v=>({...v,imageUrl:e.target.value}))} placeholder="Photo URL (or upload below)" className={`${inp} mb-3`}/>
                      <FileUploadArea label="Upload photo from PC" file={newMemberFile} onChange={setNewMemberFile}/>
                      <Err msg={teamError}/>
                      <div className="flex gap-3 mt-3">
                        <Button onClick={addMember} disabled={newMemberSaving||!newMember.name.trim()} className="rounded-none bg-primary text-black font-bold tracking-widest px-6 text-xs">
                          {newMemberSaving?<><Loader2 className="w-3.5 h-3.5 animate-spin mr-1"/>Saving…</>:"ADD MEMBER"}
                        </Button>
                        <button onClick={()=>{setAddingMember(false);setNewMember({name:"",role:"",bio:"",imageUrl:""});setNewMemberFile(null);setTeamError("");}} className="text-xs text-muted-foreground hover:text-foreground px-4">Cancel</button>
                      </div>
                    </div>
                  )}
                  {members.length === 0
                    ? <div className="text-center py-20 border border-white/5 text-muted-foreground text-sm"><Users className="w-12 h-12 mx-auto mb-4 opacity-20"/>No members yet. Click "Add Member".</div>
                    : <div className="flex flex-col gap-4">
                        {members.map(m=>(
                          <div key={m.id} className="border border-white/8 bg-white/2 p-5">
                            <div className="flex items-start gap-5 flex-wrap">
                              <div className="relative shrink-0">
                                {m.imageUrl?<img src={m.imageUrl} alt={m.name} className="w-14 h-14 object-cover rounded-full border border-white/10"/>:<div className="w-14 h-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center"><Users className="w-5 h-5 text-white/20"/></div>}
                                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                                  <Upload className="w-3 h-3 text-black"/>
                                  <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)uploadMemberPhoto(m.id,f);}}/>
                                </label>
                              </div>
                              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input value={m.name} onChange={e=>updateMemberField(m.id,"name",e.target.value)} placeholder="Name" className={inp}/>
                                <input value={m.role} onChange={e=>updateMemberField(m.id,"role",e.target.value)} placeholder="Role" className={inp}/>
                                <input value={m.imageUrl} onChange={e=>updateMemberField(m.id,"imageUrl",e.target.value)} placeholder="Photo URL" className={`${inp} md:col-span-2`}/>
                              </div>
                              <button onClick={()=>removeMember(m.id)} className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 p-2 self-start"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        ))}
                        <Err msg={teamError}/>
                        <SaveBtn saving={savingTeam} saved={teamSaved} onClick={saveTeam}/>
                      </div>
                  }
                </div>
              )}

              {/* ── PACKAGES ── */}
              {tab === "packages" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div><h2 className="font-serif text-2xl font-bold">Photography Packages</h2><p className="text-xs text-muted-foreground mt-0.5">Displayed on the Photography page.</p></div>
                    <Button onClick={()=>setAddingPackage(true)} className="rounded-none bg-primary text-black font-bold tracking-widest px-5 text-xs flex items-center gap-2"><Plus className="w-3.5 h-3.5"/>ADD PACKAGE</Button>
                  </div>
                  {addingPackage && (
                    <div className="border border-primary/20 bg-primary/3 p-5 mb-6">
                      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">New Package</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input value={newPkg.name} onChange={e=>setNewPkg(p=>({...p,name:e.target.value}))} placeholder="Package Name (e.g. Essential) *" className={inp} autoFocus/>
                        <input value={newPkg.price} onChange={e=>setNewPkg(p=>({...p,price:e.target.value}))} placeholder="Price (e.g. Rs. 25,000)" className={inp}/>
                        <input value={newPkg.category} onChange={e=>setNewPkg(p=>({...p,category:e.target.value}))} placeholder="Category (e.g. Wedding, Portrait)" className={inp}/>
                        <div className="flex items-center gap-2 px-3 py-2.5 border border-white/10">
                          <input type="checkbox" id="pkg-popular" checked={newPkg.popular} onChange={e=>setNewPkg(p=>({...p,popular:e.target.checked}))} className="accent-primary"/>
                          <label htmlFor="pkg-popular" className="text-sm text-muted-foreground">Mark as Popular</label>
                        </div>
                      </div>
                      <textarea value={newPkg.description} onChange={e=>setNewPkg(p=>({...p,description:e.target.value}))} placeholder="Short description" rows={2} className={`${inp} mb-3 resize-none`}/>
                      <textarea value={newPkg.features} onChange={e=>setNewPkg(p=>({...p,features:e.target.value}))} placeholder={"Included features — one per line:\n2-hour session\n30 edited photos\nOnline gallery"} rows={4} className={`${inp} mb-3 resize-none`}/>
                      <div className="flex gap-3">
                        <Button onClick={addPackage} disabled={!newPkg.name.trim()} className="rounded-none bg-primary text-black font-bold tracking-widest px-6 text-xs">ADD PACKAGE</Button>
                        <button onClick={()=>{setAddingPackage(false);setNewPkg({name:"",price:"",description:"",category:"",features:"",popular:false});}} className="text-xs text-muted-foreground hover:text-foreground px-4">Cancel</button>
                      </div>
                    </div>
                  )}
                  {packages.length === 0
                    ? <div className="text-center py-20 border border-white/5 text-muted-foreground text-sm"><Star className="w-12 h-12 mx-auto mb-4 opacity-20"/>No packages yet.</div>
                    : <div className="flex flex-col gap-4">
                        {packages.map(pkg=>(
                          <div key={pkg.id} className="border border-white/8 bg-white/2 p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <input value={pkg.name} onChange={e=>updatePkgField(pkg.id,"name",e.target.value)} placeholder="Name" className={inp}/>
                              <input value={pkg.price} onChange={e=>updatePkgField(pkg.id,"price",e.target.value)} placeholder="Price" className={inp}/>
                              <input value={pkg.category} onChange={e=>updatePkgField(pkg.id,"category",e.target.value)} placeholder="Category" className={inp}/>
                            </div>
                            <textarea value={pkg.description} onChange={e=>updatePkgField(pkg.id,"description",e.target.value)} placeholder="Description" rows={2} className={`${inp} mb-3 resize-none`}/>
                            <textarea value={pkg.features?.join("\n")} onChange={e=>updatePkgField(pkg.id,"features",e.target.value.split("\n"))} placeholder="Features (one per line)" rows={3} className={`${inp} mb-3 resize-none`}/>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                <input type="checkbox" checked={pkg.popular} onChange={e=>updatePkgField(pkg.id,"popular",e.target.checked)} className="accent-primary"/>Popular
                              </label>
                              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                <input type="checkbox" checked={pkg.visible!==false} onChange={e=>updatePkgField(pkg.id,"visible",e.target.checked)} className="accent-primary"/>Visible
                              </label>
                              <button onClick={()=>removePackage(pkg.id)} className="ml-auto text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 p-1.5"><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                          </div>
                        ))}
                        <Err msg={packagesError}/>
                        <SaveBtn saving={savingPackages} saved={packagesSaved} onClick={savePackages}/>
                      </div>
                  }
                </div>
              )}

              {/* ── PRODUCTS ── */}
              {tab === "products" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div><h2 className="font-serif text-2xl font-bold">Our Products</h2><p className="text-xs text-muted-foreground mt-0.5">Displayed on the /products page.</p></div>
                    <Button onClick={()=>setAddingProduct(true)} className="rounded-none bg-primary text-black font-bold tracking-widest px-5 text-xs flex items-center gap-2"><Plus className="w-3.5 h-3.5"/>ADD PRODUCT</Button>
                  </div>
                  {addingProduct && (
                    <div className="border border-primary/20 bg-primary/3 p-5 mb-6">
                      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">New Product</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input value={newProduct.title} onChange={e=>setNewProduct(p=>({...p,title:e.target.value}))} placeholder="Title *" autoFocus className={inp}/>
                        <select value={newProduct.category} onChange={e=>setNewProduct(p=>({...p,category:e.target.value}))} className={inp}>
                          <option value="website">Website</option>
                          <option value="app">Mobile App</option>
                          <option value="system">System</option>
                          <option value="design">Design</option>
                          <option value="other">Other</option>
                        </select>
                        <select value={newProduct.actionType} onChange={e=>setNewProduct(p=>({...p,actionType:e.target.value as Product["actionType"]}))} className={inp}>
                          <option value="demo">View Demo button</option>
                          <option value="download">Download button</option>
                          <option value="both">Both buttons</option>
                          <option value="none">No button</option>
                        </select>
                        <input value={newProduct.imageUrl} onChange={e=>setNewProduct(p=>({...p,imageUrl:e.target.value}))} placeholder="Image URL (or upload)" className={inp}/>
                        {(newProduct.actionType==="demo"||newProduct.actionType==="both") && <input value={newProduct.demoUrl} onChange={e=>setNewProduct(p=>({...p,demoUrl:e.target.value}))} placeholder="Demo URL" className={inp}/>}
                        {(newProduct.actionType==="download"||newProduct.actionType==="both") && <input value={newProduct.downloadUrl} onChange={e=>setNewProduct(p=>({...p,downloadUrl:e.target.value}))} placeholder="Download URL (GitHub link etc.)" className={inp}/>}
                      </div>
                      <textarea value={newProduct.description} onChange={e=>setNewProduct(p=>({...p,description:e.target.value}))} placeholder="Description" rows={2} className={`${inp} mb-3 resize-none`}/>
                      <FileUploadArea label="Upload preview image" file={newProductFile} onChange={setNewProductFile}/>
                      <Err msg={productsError}/>
                      <div className="flex gap-3 mt-3">
                        <Button onClick={addProduct} disabled={newProductSaving||!newProduct.title.trim()} className="rounded-none bg-primary text-black font-bold tracking-widest px-6 text-xs">
                          {newProductSaving?<><Loader2 className="w-3.5 h-3.5 animate-spin mr-1"/>Saving…</>:"ADD PRODUCT"}
                        </Button>
                        <button onClick={()=>{setAddingProduct(false);setNewProductFile(null);}} className="text-xs text-muted-foreground hover:text-foreground px-4">Cancel</button>
                      </div>
                    </div>
                  )}
                  {products.length === 0
                    ? <div className="text-center py-20 border border-white/5 text-muted-foreground text-sm"><Package className="w-12 h-12 mx-auto mb-4 opacity-20"/>No products yet.</div>
                    : <div className="flex flex-col gap-4">
                        {products.map(prod=>(
                          <div key={prod.id} className="border border-white/8 bg-white/2 p-5">
                            <div className="flex items-start gap-4 flex-wrap">
                              {prod.imageUrl&&<img src={prod.imageUrl} alt={prod.title} className="w-20 h-14 object-cover border border-white/10 shrink-0"/>}
                              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input value={prod.title} onChange={e=>updateProductField(prod.id,"title",e.target.value)} placeholder="Title" className={inp}/>
                                <select value={prod.actionType} onChange={e=>updateProductField(prod.id,"actionType",e.target.value)} className={inp}>
                                  <option value="demo">Demo</option><option value="download">Download</option><option value="both">Both</option><option value="none">None</option>
                                </select>
                                <input value={prod.demoUrl} onChange={e=>updateProductField(prod.id,"demoUrl",e.target.value)} placeholder="Demo URL" className={inp}/>
                                <input value={prod.downloadUrl} onChange={e=>updateProductField(prod.id,"downloadUrl",e.target.value)} placeholder="Download URL" className={inp}/>
                                <input value={prod.imageUrl} onChange={e=>updateProductField(prod.id,"imageUrl",e.target.value)} placeholder="Image URL" className={`${inp} md:col-span-2`}/>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                  <input type="checkbox" checked={prod.visible!==false} onChange={e=>updateProductField(prod.id,"visible",e.target.checked)} className="accent-primary"/>Visible
                                </label>
                                <button onClick={()=>removeProduct(prod.id)} className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 p-1.5"><Trash2 className="w-3.5 h-3.5"/></button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Err msg={productsError}/>
                        <SaveBtn saving={savingProducts} saved={productsSaved} onClick={saveProducts}/>
                      </div>
                  }
                </div>
              )}

              {/* ── SITE SETTINGS ── */}
              {tab === "settings" && (
                <div className="max-w-2xl">
                  <h2 className="font-serif text-2xl font-bold mb-6">Site Settings</h2>

                  <div className="border border-white/8 p-6 bg-white/2 mb-5">
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Showreel Video</h3>
                    <p className="text-xs text-muted-foreground/50 mb-3">YouTube, Vimeo, or direct MP4/WebM link.</p>
                    <input value={settings.showreelUrl} onChange={e=>setSettings(s=>({...s,showreelUrl:e.target.value}))} placeholder="https://www.youtube.com/watch?v=..." className={`${inp} mb-2`}/>
                  </div>

                  <div className="border border-white/8 p-6 bg-white/2 mb-5">
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Email" type="email" value={settings.email} onChange={e=>setSettings(s=>({...s,email:e.target.value}))} placeholder="vexonstudios@gmail.com"/>
                      <Input label="Phone / WhatsApp number" value={settings.phone} onChange={e=>setSettings(s=>({...s,phone:e.target.value}))} placeholder="+94 77 123 4567"/>
                      <Input label="Address" value={settings.address} onChange={e=>setSettings(s=>({...s,address:e.target.value}))} placeholder="Colombo, Sri Lanka" className="md:col-span-2"/>
                    </div>
                  </div>

                  <div className="border border-white/8 p-6 bg-white/2 mb-5">
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Instagram URL" value={settings.instagram} onChange={e=>setSettings(s=>({...s,instagram:e.target.value}))} placeholder="https://instagram.com/vexonstudios"/>
                      <Input label="Facebook URL" value={settings.facebook} onChange={e=>setSettings(s=>({...s,facebook:e.target.value}))} placeholder="https://facebook.com/vexonstudios"/>
                      <Input label="WhatsApp number (digits only)" value={settings.whatsapp} onChange={e=>setSettings(s=>({...s,whatsapp:e.target.value}))} placeholder="94771234567"/>
                      <Input label="Twitter / X URL" value={settings.twitter} onChange={e=>setSettings(s=>({...s,twitter:e.target.value}))} placeholder="https://twitter.com/vexonstudios"/>
                      <Input label="TikTok URL" value={settings.tiktok} onChange={e=>setSettings(s=>({...s,tiktok:e.target.value}))} placeholder="https://tiktok.com/@vexonstudios"/>
                    </div>
                  </div>

                  <Err msg={settingsError}/>
                  <SaveBtn saving={savingSettings} saved={settingsSaved} onClick={saveSettings}/>
                </div>
              )}

              {/* ── BRANDING ── */}
              {tab === "branding" && (
                <div className="max-w-xl">
                  <h2 className="font-serif text-2xl font-bold mb-6">Branding</h2>

                  <div className="border border-white/8 p-6 bg-white/2 mb-5">
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Site Name</h3>
                    <Input label="Site Name (shown in footer copyright)" value={branding.siteName} onChange={e=>setBranding(b=>({...b,siteName:e.target.value}))} placeholder="Vexon Studios"/>
                  </div>

                  <div className="border border-white/8 p-6 bg-white/2 mb-5">
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Logo</h3>
                    <p className="text-xs text-muted-foreground/50 mb-4">Replaces "VEXON STUDIOS" text in the navbar and footer. Recommended: transparent PNG, at least 200px tall.</p>
                    {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-10 mb-4 object-contain border border-white/10 p-2"/>}
                    <Input label="Logo URL" value={branding.logoUrl} onChange={e=>setBranding(b=>({...b,logoUrl:e.target.value}))} placeholder="https://..."/>
                    <div className="mt-3"><FileUploadArea label="Upload logo from PC" file={logoFile} onChange={setLogoFile}/></div>
                    {logoFile && (
                      <Button onClick={uploadLogoFile} disabled={logoUploading} className="mt-2 rounded-none bg-primary/20 border border-primary/40 text-primary text-xs font-bold tracking-widest px-5">
                        {logoUploading?<><Loader2 className="w-3.5 h-3.5 animate-spin mr-1"/>Uploading…</>:"UPLOAD LOGO"}
                      </Button>
                    )}
                  </div>

                  <div className="border border-white/8 p-6 bg-white/2 mb-5">
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Favicon</h3>
                    <p className="text-xs text-muted-foreground/50 mb-4">The small icon shown in the browser tab. Recommended: square PNG or ICO, 32×32 or 64×64px.</p>
                    {branding.faviconUrl && <img src={branding.faviconUrl} alt="Favicon" className="w-8 h-8 mb-4 object-contain border border-white/10 p-1"/>}
                    <Input label="Favicon URL" value={branding.faviconUrl} onChange={e=>setBranding(b=>({...b,faviconUrl:e.target.value}))} placeholder="https://..."/>
                    <div className="mt-3"><FileUploadArea label="Upload favicon from PC" file={faviconFile} onChange={setFaviconFile}/></div>
                    {faviconFile && (
                      <Button onClick={uploadFaviconFile} disabled={faviconUploading} className="mt-2 rounded-none bg-primary/20 border border-primary/40 text-primary text-xs font-bold tracking-widest px-5">
                        {faviconUploading?<><Loader2 className="w-3.5 h-3.5 animate-spin mr-1"/>Uploading…</>:"UPLOAD FAVICON"}
                      </Button>
                    )}
                  </div>

                  <Err msg={brandingError}/>
                  <SaveBtn saving={savingBranding} saved={brandingSaved} onClick={saveBranding}/>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
