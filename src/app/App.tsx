import { useState, useMemo, useEffect, useRef, Suspense, lazy } from "react";
import { CONFIG } from "./config";
import { cartService } from "../services/cartService";
import { wishlistService } from "../services/wishlistService";
import { cashfreeService } from "../services/cashfreeService";

// Sync temporary localStorage cart/wishlist to permanent DB storage when user logs in
async function migrateLocalToDB() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      const cartItems = JSON.parse(savedCart);
      await cartService.updateCart(cartItems);
      localStorage.removeItem('cart');
    } catch (e) {
      console.error('Cart sync failed', e);
    }
  }

  const savedWishlist = localStorage.getItem('wishlist');
  if (savedWishlist) {
    try {
      const wishlistItems = JSON.parse(savedWishlist);
      await wishlistService.updateWishlist(wishlistItems);
      localStorage.removeItem('wishlist');
    } catch (e) {
      console.error('Wishlist sync failed', e);
    }
  }
}
import { Toaster, toast } from "sonner";
import logoImg from "../imports/image-11.png";
import { GoogleLogin } from "../components/GoogleLogin";
import { AuthForm } from "../components/AuthForm";
import { AdminOrderNotificationCenter } from "../components/AdminOrderNotificationCenter";
import adminService from "../services/adminService";

const AboutUs = lazy(() => import("./pages/AboutUs"));
const Policies = lazy(() => import("./pages/Policies"));
import {
  Search, ShoppingBag, User, Heart, Home, Grid3x3, Package,
  Menu, X, Plus, Minus, Trash2, ChevronRight, MapPin, Phone, Mail,
  Instagram, ChevronLeft, Star, Filter, Check,
  Bell, Upload, Edit2, ImageIcon, ShoppingCart, Package2, Sun, Moon, Eye, EyeOff,
  Truck,
} from "lucide-react";

/* ─────────────────── Types ─────────────────── */
type Category = { id: number | string; name: string; img: string };
type Product = { id: string; name: string; price: number; category: string | number; image_url?: string; category_image?: string; banner_image?: string; images?: string[]; popularity: number; sizes: string[]; featured?: boolean };
type CartItem = { product: Product; size: string; qty: number };
type OrderNotification = {
  id: string;
  orderId: string;
  customerName: string;
  total: number;
  items: { name: string; qty: number; size: string }[];
  date: string;
  read: boolean;
};
type Page =
  | { name: "home" } | { name: "category"; id: string } | { name: "categories" }
  | { name: "product"; id: string } | { name: "search"; query: string }
  | { name: "cart" } | { name: "checkout"; directItem?: CartItem } | { name: "login" }
  | { name: "wishlist" } | { name: "orders" }
  | { name: "admin"; initialTab?: string; initialOrderId?: any }
  | { name: "notifications" } | { name: "allproducts" }
  | { name: "aboutus" } | { name: "policies" };

/* ─────────────────── Utility ─────────────────── */
export interface BannerConfig {
  desktop_url: string;
  mobile_url: string;
  desktop_zoom: number;
  desktop_x: number;
  desktop_y: number;
  mobile_zoom: number;
  mobile_x: number;
  mobile_y: number;
}

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://mens-hub-backend.onrender.com';

function absoluteUrl(url?: string): string {
  if (!url) return '';
  let result = url;
  if (url.startsWith('/')) {
    if (url.startsWith('/media/')) {
      result = `https://menshub64.in${url}`;
    } else {
      result = `${BACKEND_URL}${url}`;
    }
  }
  return result.replace(/ /g, '%20');
}

export function optimizeImageUrl(url: string, width: number): string {
  if (!url) return '';
  let result = absoluteUrl(url);
  
  // Intercept the known 404 seed banner URL and use a valid fallback instead
  if (result.includes('photo-1578921049066-f845f67c53e8')) {
    result = CONFIG.FALLBACK_BANNER || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200';
  }

  if (result.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(result);
      urlObj.searchParams.set('w', width.toString());
      // auto=format ensures WebP/AVIF format optimization
      urlObj.searchParams.set('auto', 'format');
      // q=75 offers excellent compression with virtually no visible quality loss
      urlObj.searchParams.set('q', '75');
      if (!urlObj.searchParams.has('fit')) {
        urlObj.searchParams.set('fit', 'crop');
      }
      result = urlObj.toString();
    } catch (e) {
      if (result.includes('w=')) {
        result = result.replace(/w=\d+/, `w=${width}`);
      } else {
        const separator = result.includes('?') ? '&' : '?';
        result = `${result}${separator}w=${width}&q=75&auto=format&fit=crop`;
      }
    }
  }
  return result;
}

export function parseBannerConfig(bannerData?: string): BannerConfig {
  const fallbackBanner = CONFIG.FALLBACK_BANNER || "";
  if (!bannerData) {
    return {
      desktop_url: fallbackBanner,
      mobile_url: fallbackBanner,
      desktop_zoom: 100,
      desktop_x: 50,
      desktop_y: 50,
      mobile_zoom: 100,
      mobile_x: 50,
      mobile_y: 50,
    };
  }
  
  const trimmed = bannerData.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        desktop_url: absoluteUrl(parsed.desktop_url) || fallbackBanner,
        mobile_url: absoluteUrl(parsed.mobile_url) || fallbackBanner,
        desktop_zoom: typeof parsed.desktop_zoom === 'number' ? parsed.desktop_zoom : 100,
        desktop_x: typeof parsed.desktop_x === 'number' ? parsed.desktop_x : 50,
        desktop_y: typeof parsed.desktop_y === 'number' ? parsed.desktop_y : 50,
        mobile_zoom: typeof parsed.mobile_zoom === 'number' ? parsed.mobile_zoom : 100,
        mobile_x: typeof parsed.mobile_x === 'number' ? parsed.mobile_x : 50,
        mobile_y: typeof parsed.mobile_y === 'number' ? parsed.mobile_y : 50,
      };
    } catch (e) {
      console.warn("Failed to parse banner JSON:", e);
    }
  }
  
  return {
    desktop_url: absoluteUrl(bannerData),
    mobile_url: absoluteUrl(bannerData),
    desktop_zoom: 100,
    desktop_x: 50,
    desktop_y: 50,
    mobile_zoom: 100,
    mobile_x: 50,
    mobile_y: 50,
  };
}

export function getTranslation(pos: number, zoom: number): number {
  // When zoomed in, the image overflows. We shift it so the user-chosen
  // focal point (pos 0-100%) stays centred in the visible area.
  // At zoom 100% or below, scale is ≤1 so translate has no overflow to pan.
  if (zoom <= 100) return 0;
  const scale = zoom / 100;
  // Maximum shift (in %) the image can travel inside its container at this scale.
  const maxShift = ((scale - 1) / scale) * 50; // half the extra width/height
  // Map pos 0→+maxShift (shift right/down), 100→-maxShift (shift left/up), 50→0
  return ((pos - 50) / 50) * maxShift;
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.readAsDataURL(file); });
}

/* ─────────────────── Seed Data Constants ─────────────────── */
const DEFAULT_SEED_PRODUCT_NAMES = [
  'classic cotton t-shirt',
  'premium formal shirt',
  'casual striped shirt',
  'blue denim jeans',
  'chino pants',
  'leather jacket',
  'casual bomber jacket',
  'running sneakers',
  'formal dress shoes',
  'classic leather shoes',
  'casual slip-ons',
  'leather belt',
  'wool scarf',
  'aviator sunglasses',
  'leather wallet',
  'sports smartwatch'
];

const DEFAULT_SEED_CATEGORY_NAMES = [
  'shirt',
  't-shirt',
  'jeans',
  'slides',
  'shoes',
  'sunglasses',
  'pants',
  'jacket',
  'accessories',
  'sarees'
];


/* ═══════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════ */
export default function App(): React.ReactElement {
  // Call this after any admin update (product/category/banner)
  const notifyTabsToRefresh = () => {
    localStorage.setItem('refreshData', Date.now().toString());
  };
  const [page, setPage] = useState<Page>({ name: "home" });



  // Listen for cross-tab updates (admin changes)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'refreshData') {
        refreshDataFromDB();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const [history, setHistory] = useState<Page[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<{ name: string; email?: string; isAdmin: boolean } | null>(null);
  // Track if migration has run for this user (by user name)
  const [migrationDone, setMigrationDone] = useState(false);
  // Run migration after login (only once per user)
  useEffect(() => {
    if (user && !migrationDone) {
      const migrationKey = `migrationDone_${user.name}`;
      if (!localStorage.getItem(migrationKey)) {
        migrateLocalToDB().then(() => {
          localStorage.setItem(migrationKey, '1');
          setMigrationDone(true);
        });
      } else {
        setMigrationDone(true);
      }
    }
    if (!user) setMigrationDone(false);
  }, [user, migrationDone]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]); // Load from database on mount
  const [categories, setCategories] = useState<Category[]>([]); // Load from database on mount
  const [bannerImg, setBannerImg] = useState(""); // Default empty banner
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all data on app startup
  useEffect(() => {
    // Restore temporary user/cart/wishlist from localStorage (synced to DB on login)
    const savedCart = localStorage.getItem('cart');
    if (savedCart) try { setCart(JSON.parse(savedCart)); } catch { }

    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) try { setWishlist(JSON.parse(savedWishlist)); } catch { }

    const savedUser = localStorage.getItem('user');
    if (savedUser) try { setUser(JSON.parse(savedUser)); } catch { }

    // Load cached data from localStorage for instant display (Stale-While-Revalidate)
    const cachedProducts = localStorage.getItem('cachedProducts');
    const cachedCategories = localStorage.getItem('cachedCategories');
    const cachedBanner = localStorage.getItem('cachedBanner');
    
    let parsedProducts: Product[] = [];
    let parsedCategories: Category[] = [];
    
    if (cachedProducts) {
      try { parsedProducts = JSON.parse(cachedProducts); } catch {}
    }
    if (cachedCategories) {
      try { parsedCategories = JSON.parse(cachedCategories); } catch {}
    }
    
    // Check if the cached products/categories are the default seeds to prevent flash
    const containsSeedData = 
      parsedProducts.some((p: any) => p && typeof p.name === 'string' && DEFAULT_SEED_PRODUCT_NAMES.includes(p.name.toLowerCase())) ||
      parsedCategories.some((c: any) => c && typeof c.name === 'string' && DEFAULT_SEED_CATEGORY_NAMES.includes(c.name.toLowerCase()));
      
    if (containsSeedData) {
      console.log("🧹 Wiping default seeded cache from localStorage to prevent flash...");
      localStorage.removeItem('cachedProducts');
      localStorage.removeItem('cachedCategories');
      localStorage.removeItem('cachedBanner');
      parsedProducts = [];
      parsedCategories = [];
    }
    
    let hasCache = false;
    if (parsedProducts && parsedProducts.length > 0) {
      setProducts(parsedProducts);
      hasCache = true;
    }
    if (parsedCategories && parsedCategories.length > 0) {
      setCategories(parsedCategories);
      hasCache = true;
    }
    if (cachedBanner && !containsSeedData) {
      const sanitizedCachedBanner = cachedBanner.includes('photo-1578921049066-f845f67c53e8')
        ? (CONFIG.FALLBACK_BANNER || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200')
        : cachedBanner;
      setBannerImg(sanitizedCachedBanner);
    }
    
    if (hasCache) {
      setLoading(false); // Instantly render cached content
    }

    // Load all data from permanent database storage
    const loadData = async () => {
      try {
        const [dbProducts, dbCategories, dbBanner] = await Promise.all([
          adminService.loadProductsFromDB(),
          adminService.loadCategoriesFromDB(),
          adminService.loadBannerFromSettings()
        ]);
        
        const freshProducts = dbProducts || [];
        const freshCategories = dbCategories || [];
        const freshBanner = dbBanner || "";
        
        // Safety check to filter out any default seed data from arriving products/categories
        const filteredProducts = freshProducts.filter((p: any) => 
          p && typeof p.name === 'string' && !DEFAULT_SEED_PRODUCT_NAMES.includes(p.name.toLowerCase())
        );
        const filteredCategories = freshCategories.filter((c: any) => 
          c && typeof c.name === 'string' && !DEFAULT_SEED_CATEGORY_NAMES.includes(c.name.toLowerCase())
        );
        
        setProducts(filteredProducts);
        localStorage.setItem('cachedProducts', JSON.stringify(filteredProducts));
        
        setCategories(filteredCategories);
        localStorage.setItem('cachedCategories', JSON.stringify(filteredCategories));
        
        const sanitizedBanner = freshBanner.includes('photo-1578921049066-f845f67c53e8')
          ? (CONFIG.FALLBACK_BANNER || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200')
          : freshBanner;
        
        setBannerImg(sanitizedBanner);
        localStorage.setItem('cachedBanner', sanitizedBanner);
      } catch (err) {
        console.warn("Could not load data from database:", err);
      } finally {
        setLoading(false); // Stop loading screen once DB results arrive
      }
    };
    loadData();
  }, []);

  // Save temporary cart to localStorage (synced to DB on login)
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Save temporary wishlist to localStorage (synced to DB on login)
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Save user authentication state to localStorage for session persistence
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
    }
  }, [user]);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const navigate = (p: Page) => { setHistory((h: Page[]) => [...h, page]); setPage(p); window.scrollTo(0, 0); };
  const back = () => setHistory((h: Page[]) => { if (!h.length) return h; const prev = h[h.length - 1]; setPage(prev); return h.slice(0, -1); });

  // Refresh data from database after admin changes
  const refreshDataFromDB = async () => {
    console.log('🔄 Refreshing data from database...');
    try {
      const [dbProducts, dbCategories, dbBanner] = await Promise.all([
        adminService.loadProductsFromDB(true),
        adminService.loadCategoriesFromDB(true),
        adminService.loadBannerFromSettings(true)
      ]);
      
      const freshProducts = dbProducts || [];
      const freshCategories = dbCategories || [];
      const freshBanner = dbBanner || "";
      
      // Filter out seed products and categories to ensure a completely custom experience
      const filteredProducts = freshProducts.filter((p: any) => 
        p && typeof p.name === 'string' && !DEFAULT_SEED_PRODUCT_NAMES.includes(p.name.toLowerCase())
      );
      const filteredCategories = freshCategories.filter((c: any) => 
        c && typeof c.name === 'string' && !DEFAULT_SEED_CATEGORY_NAMES.includes(c.name.toLowerCase())
      );
      
      setProducts(filteredProducts);
      localStorage.setItem('cachedProducts', JSON.stringify(filteredProducts));
      console.log('✅ Products refreshed from DB');
      
      setCategories(filteredCategories);
      localStorage.setItem('cachedCategories', JSON.stringify(filteredCategories));
      console.log('✅ Categories refreshed from DB');
      
      const sanitizedBanner = freshBanner.includes('photo-1578921049066-f845f67c53e8')
        ? (CONFIG.FALLBACK_BANNER || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200')
        : freshBanner;
      
      setBannerImg(sanitizedBanner);
      localStorage.setItem('cachedBanner', sanitizedBanner);
      console.log('✅ Banner refreshed from DB');
    } catch (err) {
      console.warn("Could not refresh data from database:", err);
    }
  };



  const requireAuth = (action: () => void) => {
    if (!user) { toast.error("Please login first"); navigate({ name: "login" }); return; }
    action();
  };

  const buyNow = (product: Product, size: string) => {
    requireAuth(() => {
      navigate({ name: "checkout", directItem: { product, size, qty: 1 } });
    });
  };

  const toggleWishlist = (id: string) => {
    requireAuth(() => setWishlist((w: string[]) => w.includes(id) ? w.filter((x: string) => x !== id) : [...w, id]));
  };

  /* Called after customer places order — fires admin notification */
  const handleOrderPlaced = () => {
    const isDirectBuy = page.name === "checkout" && (page as any).directItem;
    const checkoutItems = isDirectBuy ? [(page as any).directItem] : cart;
    const checkoutTotal = isDirectBuy ? checkoutItems[0].product.price * checkoutItems[0].qty : cartTotal;

    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const notification: OrderNotification = {
      id: Date.now().toString(),
      orderId,
      customerName: user?.name || "Guest",
      total: checkoutTotal,
      items: checkoutItems.map((i: CartItem) => ({ name: i.product.name, qty: i.qty, size: i.size })),
      date: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      read: false,
    };
    setNotifications((n) => [notification, ...n]);

    if (!isDirectBuy) {
      setCart([]);
    }
    toast.success(`Order ${orderId} placed! 🎉`);
    navigate({ name: "orders" });
  };

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  const markRead = (id: string) => setNotifications((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
  const deleteNotif = (id: string) => setNotifications((n) => n.filter((x) => x.id !== id));

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const accentVars = {
    ["--accent" as any]: dark ? "#d4af37" : "#1e3a8a",
    ["--accent-soft" as any]: dark ? "#b8860b" : "#1e40af",
    ["--accent-grad" as any]: dark ? "linear-gradient(135deg,#d4af37 0%,#f5d97a 50%,#b8860b 100%)"
      : "linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#1e3a8a 100%)",
    ["--accent-fg" as any]: dark ? "#0a0a0a" : "#ffffff",
    ["--accent-glow" as any]: dark ? "rgba(212,175,55,0.65)" : "rgba(30,58,138,0.30)",
  } as React.CSSProperties;


  return (
    <div className={`min-h-screen w-full ${dark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900"} transition-colors`} style={accentVars}>
      <Toaster position="top-right" richColors duration={1000} />
      {user?.isAdmin && (
        <AdminOrderNotificationCenter
          onViewOrder={(orderId) => {
            navigate({
              name: "admin",
              initialTab: "orders",
              initialOrderId: orderId
            });
          }}
        />
      )}

      <TopBar
        categories={categories}
        dark={dark}
        toggleDark={() => setDark(d => !d)}
        user={user}
        cartCount={cartCount}
        unreadCount={unreadCount}
        activePage={page}
        onLogo={() => navigate({ name: "home" })}
        onSearch={() => setSearchOpen(true)}
        onCart={() => navigate({ name: "cart" })}
        onLogin={() => navigate({ name: "login" })}
        onOrders={() => navigate({ name: "orders" })}
        onNotifications={() => navigate({ name: "notifications" })}
        onAdmin={() => navigate({ name: "admin" })}
        onMyShop={() => navigate({ name: "home" })}
        onLogout={() => { setUser(null); toast.success("Logged out"); navigate({ name: "home" }); }}
        onCategoryNav={(id: string) => navigate({ name: "category", id })}
        onProducts={() => navigate({ name: "search", query: "" })}
        onWishlist={() => requireAuth(() => navigate({ name: "wishlist" }))}
        onCategories={() => navigate({ name: "categories" })}
        onAllProducts={() => navigate({ name: "allproducts" })}
      />

      {searchOpen && (
        <SearchOverlay
          products={products}
          onClose={() => setSearchOpen(false)}
          onSelect={(p: Product) => { setSearchOpen(false); navigate({ name: "product", id: p.id }); }}
          onSearch={(q: string) => { setSearchOpen(false); navigate({ name: "search", query: q }); }}
        />
      )}

      <main className="pb-24 md:pb-8">
        {page.name === "home" && (
          <HomePage products={products} categories={categories} bannerImg={bannerImg}
            onCategory={(id: string) => navigate({ name: "category", id })}
            onProduct={(id: string) => navigate({ name: "product", id })}
            onBuy={buyNow} onWish={toggleWishlist} wishlist={wishlist}
            onAllCategories={() => navigate({ name: "categories" })}
            loading={loading} />
        )}
        {page.name === "categories" && (
          <CategoriesPage categories={categories}
            onCategory={(id: string) => navigate({ name: "category", id })} onBack={back} />
        )}
        {page.name === "category" && (
          <ListingPage
            title={categories.find((c: Category) => String(c.id) === String((page as any).id))?.name || "Products"}
            products={products.filter((p: Product) => String(p.category) === String((page as any).id))}
            onProduct={(id: string) => navigate({ name: "product", id })}
            onBuy={buyNow} onWish={toggleWishlist} wishlist={wishlist} onBack={back} />
        )}
        {page.name === "search" && (
          <ListingPage
            title={(page as any).query ? `Results for "${(page as any).query}"` : "All Products"}
            products={products.filter((p: Product) => p.name.toLowerCase().includes(((page as any).query || "").toLowerCase()))}
            onProduct={(id: string) => navigate({ name: "product", id })}
            onBuy={buyNow} onWish={toggleWishlist} wishlist={wishlist} onBack={back} />
        )}
        {page.name === "product" && (
          <ProductPage product={products.find((p: Product) => p.id === (page as any).id)!}
            onBuy={buyNow} onWish={toggleWishlist} wishlist={wishlist} onBack={back} />
        )}
        {page.name === "cart" && (
          <CartPage cart={cart} setCart={setCart}
            onCheckout={() => requireAuth(() => navigate({ name: "checkout" }))}
            onBack={back} total={cartTotal} />
        )}
        {page.name === "checkout" && (
          <CheckoutPage
            cart={(page as any).directItem ? [(page as any).directItem] : cart}
            total={(page as any).directItem ? (page as any).directItem.product.price * (page as any).directItem.qty : cartTotal}
            user={user}
            onPlaced={handleOrderPlaced}
            onBack={back}
          />
        )}
        {page.name === "login" && (
          <LoginPage onLogin={(u: { name: string; isAdmin: boolean }) => {
            setUser(u);
            toast.success(`Welcome ${u.name}`);
            // Migration will run automatically via useEffect
            if (u.isAdmin) navigate({ name: "admin" }); else back();
          }} onBack={back} />
        )}
        {page.name === "wishlist" && (
          <WishlistPage products={products.filter((p: Product) => wishlist.includes(p.id))}
            onProduct={(id: string) => navigate({ name: "product", id })}
            onBuy={buyNow} onWish={toggleWishlist} wishlist={wishlist} onBack={back} />
        )}
        {page.name === "orders" && <OrdersPage user={user} onBack={back} />}
        {page.name === "notifications" && user?.isAdmin && (
          <NotificationsPage onBack={back} />
        )}
        {page.name === "allproducts" && (
          <AllProductsPage
            products={products}
            categories={categories}
            onProduct={(id: string) => navigate({ name: "product", id })}
            onBuy={buyNow} onWish={toggleWishlist} wishlist={wishlist} onBack={back}
            onCategory={(id: string) => navigate({ name: "category", id })} />
        )}
        {page.name === "admin" && user?.isAdmin && (
          <AdminPanel
            products={products} setProducts={setProducts}
            categories={categories} setCategories={setCategories}
            bannerImg={bannerImg} setBannerImg={setBannerImg}
            notifyTabsToRefresh={notifyTabsToRefresh}
            initialTab={(page as any).initialTab}
            initialOrderId={(page as any).initialOrderId}
            onBack={() => { refreshDataFromDB(); back(); }} />
        )}
        {page.name === "aboutus" && (
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <AboutUs onBack={back} />
          </Suspense>
        )}
        {page.name === "policies" && (
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Policies onBack={back} />
          </Suspense>
        )}
      </main>

      <Footer onNavigate={navigate} />
      <BottomNav
        active={page.name}
        onHome={() => navigate({ name: "home" })}
        onCategories={() => navigate({ name: "categories" })}
        onWishlist={() => requireAuth(() => navigate({ name: "wishlist" }))}
        onCart={() => navigate({ name: "cart" })}
        onOrders={() => requireAuth(() => navigate({ name: "orders" }))}
        toggleDark={() => setDark(d => !d)}
        dark={dark}
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
      />
    </div>
  );
}

/* ─────────────────── Shared UI ─────────────────── */
function ProfileItem({ children, onClick }: any) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm uppercase tracking-wider rounded-md transition mb-1"
      style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-grad)"; e.currentTarget.style.color = "var(--accent-fg)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}>
      {children}
    </button>
  );
}

function IconBtn({ children, onClick, className = "", ...rest }: any) {
  return (
    <button onClick={onClick}
      className={`relative w-9 h-9 rounded-md flex items-center justify-center transition ${className}`}
      style={{ border: "1px solid var(--accent)", color: "var(--accent-soft)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-grad)"; e.currentTarget.style.color = "var(--accent-fg)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent-soft)"; }}
      {...rest}>
      {children}
    </button>
  );
}

function SectionTitle({ children, onViewAll }: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="uppercase tracking-[0.2em] shrink-0" style={{ fontWeight: 700, color: "var(--accent)" }}>{children}</h2>
      <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800 mx-4" />
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="shrink-0 text-xs uppercase tracking-widest px-3 py-1.5 rounded-full transition-all"
          style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-grad)"; e.currentTarget.style.color = "var(--accent-fg)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}>
          View All
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════════ */
function TopBar(props: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { categories = [], user, dark, unreadCount = 0, activePage } = props;
  const activeCatId = activePage?.name === "category" ? activePage.id : null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-950/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 relative">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        {/* Mobile hamburger */}
        <button className="md:hidden p-2 -ml-2" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu"><Menu size={22} /></button>

        {/* Logo */}
        <button onClick={props.onLogo} className="flex items-center gap-2 group shrink-0" aria-label="Men's Hub Home">
          <img src={logoImg} alt="Men's Hub" width="44" height="44" className="h-11 w-11 rounded-lg object-cover object-top" style={{ boxShadow: "0 0 0 1.5px var(--accent)" }} />
          <div className="flex flex-col leading-none">
            <span className="tracking-[0.25em] uppercase" style={{ fontWeight: 700, color: "var(--accent)" }}>Men's Hub</span>
            <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--accent-soft)", opacity: 0.85 }}>Be Your Own Label</span>
          </div>
        </button>

        {/* Desktop category nav — max 5 + View All */}
        <nav className="hidden md:flex items-center gap-2 ml-8 overflow-x-auto">
          {categories.slice(0, 5).map((c: Category) => {
            const isActive = activeCatId === c.id;
            return (
              <button key={c.id} onClick={() => props.onCategoryNav(c.id)}
                className="px-3 py-1.5 uppercase tracking-wider text-sm rounded-md transition-all duration-200 shrink-0"
                style={isActive ? {
                  background: "var(--accent-grad)",
                  color: "var(--accent-fg)",
                  fontWeight: 700,
                  border: "1px solid transparent",
                  boxShadow: "0 0 0 2px var(--accent), 0 4px 16px var(--accent-glow)",
                } : {
                  background: "transparent",
                  border: "1px solid var(--accent)",
                  color: "var(--accent-soft)",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--accent-grad)"; e.currentTarget.style.color = "var(--accent-fg)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent), 0 6px 20px var(--accent-glow)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent-soft)"; e.currentTarget.style.boxShadow = "none"; } }}>
                {c.name}
              </button>
            );
          })}
          {categories.length > 5 && (
            (() => {
              const isActive = activePage?.name === "allproducts";
              return (
                <button onClick={props.onAllProducts}
                  className="px-3 py-1.5 uppercase tracking-wider text-sm rounded-md transition shrink-0 flex items-center gap-1"
                  style={isActive ? {
                    background: "var(--accent-grad)",
                    color: "var(--accent-fg)",
                    fontWeight: 700,
                    border: "1px solid transparent",
                    boxShadow: "0 0 0 2px var(--accent), 0 4px 16px var(--accent-glow)",
                  } : {
                    background: "transparent",
                    border: "1px solid var(--accent)",
                    color: "var(--accent-soft)",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--accent-grad)"; e.currentTarget.style.color = "var(--accent-fg)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent), 0 6px 20px var(--accent-glow)"; } else { e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent), 0 6px 20px var(--accent-glow)"; e.currentTarget.style.opacity = "0.9"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent-soft)"; e.currentTarget.style.boxShadow = "none"; } else { e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent), 0 4px 16px var(--accent-glow)"; e.currentTarget.style.opacity = "1"; } }}>
                  View All <ChevronRight size={13} />
                </button>
              );
            })()
          )}
        </nav>

        {/* Desktop search bar */}
        <div className="hidden md:flex flex-1 max-w-xs mx-auto">
          <button onClick={props.onSearch} className="w-full flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-900 dark:hover:border-white transition" aria-label="Search products">
            <Search size={16} /> <span className="text-sm">Search...</span>
          </button>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Dark mode — desktop */}
          <IconBtn onClick={props.toggleDark} className="hidden md:inline-flex" aria-label="Toggle dark mode">
            <span style={{ fontSize: 14 }}>{dark ? "☀" : "☾"}</span>
          </IconBtn>

          {/* Search — mobile */}
          <IconBtn onClick={props.onSearch} className="md:hidden" aria-label="Search products"><Search size={18} /></IconBtn>

          {/* Wishlist — desktop */}
          <IconBtn onClick={props.onWishlist} className="hidden md:inline-flex" aria-label="View wishlist">
            <Heart size={18} />
          </IconBtn>

          {user?.isAdmin && (
            <div className="relative flex items-center justify-center">
              <IconBtn onClick={props.onNotifications} className="hidden md:inline-flex" aria-label="View notifications">
                <Bell size={18} />
                {props.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] rounded-full w-4 h-4 flex items-center justify-center"
                    style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>{props.unreadCount}</span>
                )}
              </IconBtn>
            </div>
          )}

          {/* Profile dropdown */}
          <div className="relative">
            <IconBtn onClick={() => setProfileOpen((o: boolean) => !o)} aria-label="Toggle user menu"><User size={18} /></IconBtn>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-12 z-[101] w-60 rounded-xl shadow-2xl p-2"
                  style={{ backgroundColor: dark ? "#0a0a0a" : "#ffffff", border: "1px solid var(--accent)" }}>
                  {user ? (
                    <>
                      <div className="px-3 py-2 text-xs uppercase tracking-wider opacity-60">Signed in as</div>
                      <div className="px-3 pb-2 text-sm" style={{ fontWeight: 700, color: "var(--accent)" }}>
                        {user.name}{user.isAdmin ? " (Admin)" : ""}
                      </div>
                      <div className="h-px mb-2" style={{ background: "var(--accent)", opacity: 0.3 }} />

                      {user.isAdmin ? (
                        /* ── Admin dropdown ── */
                        <>
                          <ProfileItem onClick={() => { setProfileOpen(false); props.onAdmin(); }}>
                            Admin Panel
                          </ProfileItem>
                          <ProfileItem onClick={() => { setProfileOpen(false); props.onMyShop(); }}>
                            My Shop (Preview)
                          </ProfileItem>
                          <ProfileItem onClick={() => { setProfileOpen(false); props.onNotifications(); }}>
                            Notifications
                          </ProfileItem>
                        </>
                      ) : (
                        /* ── Customer dropdown ── */
                        <ProfileItem onClick={() => { setProfileOpen(false); props.onOrders(); }}>
                          My Orders
                        </ProfileItem>
                      )}

                      <ProfileItem onClick={() => { setProfileOpen(false); props.onLogout(); }}>Logout</ProfileItem>
                    </>
                  ) : (
                    <ProfileItem onClick={() => { setProfileOpen(false); props.onLogin(); }}>Login / Sign Up</ProfileItem>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Cart */}
          <IconBtn onClick={props.onCart} className="hidden md:inline-flex" aria-label="View shopping cart">
            <ShoppingBag size={18} />
            {props.cartCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] rounded-full w-4 h-4 flex items-center justify-center"
                style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>{props.cartCount}</span>
            )}
          </IconBtn>
        </div>
      </div>

      {/* Mobile sidebar menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-3 top-14 z-[101] w-56 rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: dark ? "#0a0a0a" : "#ffffff", border: "1px solid var(--accent)" }}>
            <div className="flex flex-col p-2 gap-1">
              {(user?.isAdmin ? [
                { label: "Home", action: props.onLogo },
                { label: "Products", action: props.onProducts },
                { label: "Categories", action: props.onCategories },
                { label: "Wishlist", action: props.onWishlist },
                { label: "Cart", action: props.onCart },
                { label: "Notifications", action: props.onNotifications },
                { label: "Admin Panel", action: props.onAdmin },
                { label: `${dark ? "Light" : "Dark"} Mode`, action: props.toggleDark },
              ] : [
                { label: "Home", action: props.onLogo },
                { label: "Categories", action: props.onCategories },
                { label: "Wishlist", action: props.onWishlist },
                { label: "Cart", action: props.onCart },
                { label: user ? "My Orders" : "Login", action: user ? props.onOrders : props.onLogin },
                { label: `${dark ? "Light" : "Dark"} Mode`, action: props.toggleDark },
              ]).map((item: any, i: number) => (
                <button key={i} onClick={() => { setMenuOpen(false); item.action(); }}
                  className="text-left px-3 py-2 uppercase tracking-wider text-sm rounded-md transition"
                  style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-grad)"; e.currentTarget.style.color = "var(--accent-fg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

/* ─────────────────── Search Overlay ─────────────────── */
function SearchOverlay({ products, onClose, onSelect, onSearch }: any) {
  const [q, setQ] = useState("");
  const suggestions = useMemo(() =>
    q ? products.filter((p: Product) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [], [q, products]);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-950 max-w-2xl mx-auto mt-20 rounded-xl p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <Search size={20} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && onSearch(q)}
            placeholder="Search shirts, jeans, shoes..." className="flex-1 bg-transparent outline-none" />
          <button onClick={onClose} aria-label="Close search overlay"><X size={20} /></button>
        </div>
        <div className="mt-3">
          {q && suggestions.length === 0 && <div className="py-8 text-center text-neutral-500">No products found</div>}
          {suggestions.map((p: Product) => (
            <button key={p.id} onClick={() => onSelect(p)} className="w-full flex items-center gap-3 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded">
              <img src={p.image_url || p.images?.[0] || ''} className="w-12 h-12 object-cover rounded" />
              <div className="text-left flex-1"><div>{p.name}</div><div className="text-sm text-neutral-500">₹{p.price}</div></div>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Skeletons for Performance ─────────────────── */
function SkeletonBanner() {
  return (
    <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 animate-pulse flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-neutral-400 dark:text-neutral-600 uppercase text-xs tracking-widest font-bold">Loading Premium Fashion...</span>
      </div>
    </div>
  );
}

function SkeletonCategory() {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="aspect-square w-full rounded-xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700" />
      <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded mt-2 mx-auto" />
    </div>
  );
}

function SkeletonProductCard() {
  return (
    <div className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 animate-pulse">
      <div className="aspect-[3/4] w-full rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mt-1" />
      <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
      <div className="h-8 w-full bg-neutral-200 dark:bg-neutral-800 rounded mt-2" />
    </div>
  );
}

/* ─────────────────── Home Page ─────────────────── */
function HomePage({ products, categories, bannerImg, onCategory, onProduct, onBuy, onWish, wishlist, onAllCategories, loading }: any) {
  const visibleCats = categories.slice(0, 5);
  const hasMore = categories.length > 5;
  const fallbackBanner = CONFIG.FALLBACK_BANNER;
  const fallbackCategory = CONFIG.FALLBACK_CATEGORY;

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Visually hidden h1 for SEO and heading structure outline */}
      <h1 className="sr-only">Men's Hub – Premium Men's Fashion</h1>
      {/* Hero Banner — Responsive and adjustable */}
      <section className="relative my-6 rounded-2xl overflow-hidden h-64 md:h-96 bg-neutral-900" style={{ border: "1.5px solid var(--accent)" }}>
        {loading ? (
          <SkeletonBanner />
        ) : (
          (() => {
            const config = parseBannerConfig(bannerImg);
            return (
              <>
                {/* Desktop Banner View */}
                <div className="hidden md:block w-full h-full relative overflow-hidden">
                  <img 
                    src={optimizeImageUrl(config.desktop_url || fallbackBanner, 1200)} 
                    className="w-full h-full object-cover transition-all duration-300"
                    style={{
                      objectPosition: `${config.desktop_x}% ${config.desktop_y}%`,
                      transform: `scale(${config.desktop_zoom / 100})`,
                      transformOrigin: `${config.desktop_x}% ${config.desktop_y}%`
                    }}
                    alt="Desktop Banner" 
                    fetchPriority="high"
                    decoding="async"
                    onError={(e: any) => { e.target.src = optimizeImageUrl(fallbackBanner, 1200); }} 
                  />
                </div>
                
                {/* Mobile Banner View */}
                <div className="block md:hidden w-full h-full relative overflow-hidden">
                  <img 
                    src={optimizeImageUrl(config.mobile_url || fallbackBanner, 600)} 
                    className="w-full h-full object-cover transition-all duration-300"
                    style={{
                      objectPosition: `${config.mobile_x}% ${config.mobile_y}%`,
                      transform: `scale(${config.mobile_zoom / 100})`,
                      transformOrigin: `${config.mobile_x}% ${config.mobile_y}%`
                    }}
                    alt="Mobile Banner" 
                    fetchPriority="high"
                    decoding="async"
                    onError={(e: any) => { e.target.src = optimizeImageUrl(fallbackBanner, 600); }} 
                  />
                </div>
              </>
            );
          })()
        )}
      </section>

      <section className="my-8">
        <SectionTitle>Shop By Category</SectionTitle>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCategory key={i} />)
          ) : (
            <>
              {/* First 5 real category tiles */}
              {visibleCats.map((c: Category) => (
                <button key={c.id} onClick={() => onCategory(c.id)} className="group">
                  <div className="aspect-square overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800 transition"
                    style={{ border: "1px solid var(--accent)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 2px var(--accent), 0 10px 40px var(--accent-glow)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px var(--accent)"; }}>
                    <img src={optimizeImageUrl(c.img || fallbackCategory, 200)} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" decoding="async" alt={c.name} onError={(e: any) => { e.target.src = optimizeImageUrl(fallbackCategory, 200); }} />
                  </div>
                  <div className="mt-2 text-center text-sm uppercase tracking-wider" style={{ fontWeight: 600, color: "var(--accent)" }}>{c.name}</div>
                </button>
              ))}
              {/* 6th slot — always "View All" tile */}
              {hasMore && (
                <button onClick={onAllCategories} className="group">
                  <div className="aspect-square overflow-hidden rounded-xl flex flex-col items-center justify-center gap-2 transition"
                    style={{ background: "var(--accent-grad)", border: "2px solid var(--accent)", boxShadow: "0 4px 24px var(--accent-glow)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px var(--accent), 0 10px 40px var(--accent-glow)"; (e.currentTarget as HTMLDivElement).style.opacity = "0.88"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px var(--accent-glow)"; (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}>
                    <ChevronRight size={28} style={{ color: "var(--accent-fg)" }} />
                    <span className="text-[11px] uppercase tracking-widest px-1 text-center" style={{ color: "var(--accent-fg)", fontWeight: 700 }}>
                      +{categories.length - 5} More
                    </span>
                  </div>
                  <div className="mt-2 text-center text-sm uppercase tracking-wider" style={{ fontWeight: 700, color: "var(--accent)" }}>View All</div>
                </button>
              )}
            </>
          )}
        </div>
      </section>

      <section className="my-10">
        <SectionTitle>Featured</SectionTitle>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={i} />)}
          </div>
        ) : products.filter((p: Product) => p.featured).length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">No featured products yet. Admin can mark products as featured.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.filter((p: Product) => p.featured).map((p: Product) => (
              <ProductCard key={p.id} product={p} onProduct={onProduct} onBuy={onBuy} onWish={onWish} wishlist={wishlist} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─────────────────── Categories Page ─────────────────── */
function CategoriesPage({ categories, onCategory, onBack }: any) {
  const fallbackCategory = CONFIG.FALLBACK_CATEGORY;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2" aria-label="Go back"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]" style={{ fontWeight: 600 }}>All Categories</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((c: Category) => (
          <button key={c.id} onClick={() => onCategory(c.id)}
            className="group relative overflow-hidden rounded-xl aspect-[4/3] transition"
            style={{ border: "1px solid var(--accent)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent), 0 10px 40px var(--accent-glow)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent)"; }}>
            <img src={optimizeImageUrl(c.img || fallbackCategory, 400)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" decoding="async" alt={c.name} onError={(e: any) => { e.target.src = optimizeImageUrl(fallbackCategory, 400); }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white uppercase tracking-[0.2em]" style={{ fontWeight: 600 }}>{c.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── Product Card ─────────────────── */
function ProductCard({ product, onProduct, onBuy, onWish, wishlist }: any) {
  const wished = wishlist.includes(product.id);
  const isOneSize = product.sizes.length === 1 && product.sizes[0] === "One";
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? "");
  const fallbackProduct = CONFIG.FALLBACK_PRODUCT;
  const productImage = optimizeImageUrl(product.image_url || product.images?.[0] || fallbackProduct, 300);

  return (
    <div className="group p-2 rounded-xl transition flex flex-col" style={{ border: "1px solid var(--accent)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 2px var(--accent), 0 10px 40px var(--accent-glow)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px var(--accent)"; }}>
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 cursor-pointer" onClick={() => onProduct(product.id)}>
        <img src={productImage} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" decoding="async" alt={product.name} onError={(e: any) => { e.target.src = optimizeImageUrl(fallbackProduct, 300); }} />
        <button onClick={e => { e.stopPropagation(); onWish(product.id); }}
          className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.95)", border: "1px solid var(--accent)" }}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}>
          <Heart size={16} className={wished ? "fill-red-500 text-red-500" : ""} style={{ color: wished ? undefined : "var(--accent-soft)" }} />
        </button>
      </div>
      {/* Name + Price */}
      <div className="mt-2 px-1">
        <div className="text-sm truncate" style={{ fontWeight: 600 }}>{product.name}</div>
        <div className="text-sm mt-0.5" style={{ color: "var(--accent)" }}>₹{product.price.toLocaleString()}</div>
      </div>
      {/* Size chips — Flipkart style */}
      <div className="mt-2 px-1 flex flex-wrap gap-1 min-h-[24px]">
        {!isOneSize && product.sizes.map((s: string) => {
          const active = s === selectedSize;
          return (
            <button key={s} onClick={e => { e.stopPropagation(); setSelectedSize(s); }}
              className="text-[10px] px-2 py-0.5 rounded-full transition"
              style={{
                border: "1px solid var(--accent)",
                background: active ? "var(--accent-grad)" : "transparent",
                color: active ? "var(--accent-fg)" : "var(--accent-soft)",
                fontWeight: active ? 700 : 400,
              }}>
              {s}
            </button>
          );
        })}
      </div>
      {/* Buy Now */}
      <div className="mt-2 px-1 pb-1">
        <button onClick={() => onBuy(product, selectedSize)}
          className="w-full text-xs uppercase tracking-wider py-1.5 rounded-md transition"
          style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", fontWeight: 600 }}>
          {isOneSize ? "Buy Now" : `Buy Now — ${selectedSize}`}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── Listing Page ─────────────────── */
function ListingPage({ title, products, onProduct, onBuy, onWish, wishlist, onBack }: any) {
  const [sort, setSort] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [size, setSize] = useState("");
  const [visible, setVisible] = useState(8);

  const filtered = useMemo(() => {
    let arr = products.filter((p: Product) => p.price <= maxPrice && (!size || p.sizes.includes(size)));
    if (sort === "low") arr = [...arr].sort((a, b) => a.price - b.price);
    if (sort === "high") arr = [...arr].sort((a, b) => b.price - a.price);
    if (sort === "popular") arr = [...arr].sort((a, b) => b.popularity - a.popularity);
    return arr;
  }, [products, maxPrice, size, sort]);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200)
        setVisible((v: number) => Math.min(v + 4, filtered.length));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [filtered.length]);

  const clearFilters = () => {
    setSort("popular");
    setMaxPrice(5000);
    setSize("");
    setVisible(8);
    window.scrollTo(0, 0);
  };

  const allSizes = Array.from(new Set(products.flatMap((p: Product) => p.sizes)));
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-3 my-4">
        <button onClick={onBack} className="p-2 -ml-2" aria-label="Go back"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]">{title}</h2>
      </div>
      <div className="sticky top-16 z-20 bg-white/90 dark:bg-neutral-950/90 backdrop-blur py-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-3">
        <Filter size={16} />
        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 rounded-full text-sm">
          <option value="popular">Popular</option>
          <option value="low">Price: Low → High</option>
          <option value="high">Price: High → Low</option>
        </select>
        <select value={size} onChange={e => setSize(e.target.value)} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 rounded-full text-sm">
          <option value="">All Sizes</option>
          {allSizes.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          Max ₹{maxPrice}
          <input type="range" min={500} max={5000} step={100} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
        </label>
        <button onClick={clearFilters} className="ml-auto px-3 py-1.5 text-xs uppercase tracking-wider rounded-full transition font-500 hover:opacity-80" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>Clear All</button>
      </div>
      {filtered.length === 0
        ? <div className="py-20 text-center text-neutral-500 font-medium">No Products Available</div>
        : <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          {filtered.slice(0, visible).map((p: Product) => (
            <ProductCard key={p.id} product={p} onProduct={onProduct} onBuy={onBuy} onWish={onWish} wishlist={wishlist} />
          ))}
        </div>
      }
    </div>
  );
}

/* ─────────────────── All Products Page ─────────────────── */
function AllProductsPage({ products, categories, onProduct, onBuy, onWish, wishlist, onBack }: any) {
  const [activeCat, setActiveCat] = useState<string>("all");
  const [visible, setVisible] = useState(12);

  const filtered = useMemo(() => {
    return activeCat === "all" ? products : products.filter((p: Product) => String(p.category) === String(activeCat));
  }, [products, activeCat]);

  useEffect(() => { setVisible(12); }, [activeCat]);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200)
        setVisible((v: number) => Math.min(v + 8, filtered.length));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [filtered.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2" aria-label="Go back"><ChevronLeft size={20} /></button>
        <div>
          <h2 className="uppercase tracking-[0.2em]" style={{ fontWeight: 700 }}>All Products</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--accent-soft)", opacity: 0.7 }}>
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Category filter chips — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6" style={{ scrollbarWidth: "none" }}>
        {([{ id: "all", name: "All" }, ...categories] as any[]).map((c: any) => {
          const isActive = activeCat === c.id;
          return (
            <button key={c.id}
              onClick={() => setActiveCat(c.id)}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm uppercase tracking-wider transition-all duration-200"
              style={isActive ? {
                background: "var(--accent-grad)",
                color: "var(--accent-fg)",
                fontWeight: 700,
                border: "2px solid transparent",
                boxShadow: "0 0 0 2px var(--accent), 0 4px 16px var(--accent-glow)",
              } : {
                background: "transparent",
                color: "var(--accent)",
                fontWeight: 500,
                border: "1.5px solid var(--accent)",
                boxShadow: "none",
                opacity: 0.75,
              }}>
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Product grid — no filters bar */}
      {filtered.length === 0
        ? <div className="py-20 text-center text-neutral-500">No products found</div>
        : <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.slice(0, visible).map((p: Product) => (
            <ProductCard key={p.id} product={p} onProduct={onProduct} onBuy={onBuy} onWish={onWish} wishlist={wishlist} />
          ))}
        </div>
      }
      {visible < filtered.length && (
        <div className="mt-8 text-center">
          <button onClick={() => setVisible((v: number) => Math.min(v + 12, filtered.length))}
            className="px-8 py-2.5 rounded-full text-sm uppercase tracking-widest transition"
            style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", fontWeight: 600 }}>
            Load More ({filtered.length - visible} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Product Page ───���─────────────── */
function ProductPage({ product, onBuy, onWish, wishlist, onBack }: any) {
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const wished = wishlist.includes(product.id);
  const fallbackProduct = CONFIG.FALLBACK_PRODUCT;
  const images = product.images && product.images.length > 0 ? product.images : [fallbackProduct];
  const validImages = images.filter((img: string) => img && img.trim() !== '');
  const displayImages = validImages.length > 0 ? validImages : [fallbackProduct];

  return (
    <div className="max-w-6xl mx-auto px-4">
      <button onClick={onBack} className="my-4 flex items-center gap-1 text-sm"><ChevronLeft size={16} /> Back</button>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 rounded-xl overflow-hidden group">
            <img src={displayImages[imgIdx]} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" onError={(e: any) => { e.target.src = fallbackProduct; }} />
            {displayImages.length > 1 && (
              <>
                <button onClick={() => setImgIdx((imgIdx - 1 + displayImages.length) % displayImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 flex items-center justify-center" aria-label="Previous image"><ChevronLeft size={18} /></button>
                <button onClick={() => setImgIdx((imgIdx + 1) % displayImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 flex items-center justify-center" aria-label="Next image"><ChevronRight size={18} /></button>
              </>
            )}
          </div>
          {displayImages.length > 1 && (
            <div className="flex gap-2 mt-3">
              {displayImages.map((src: string, i: number) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 rounded overflow-hidden border-2 ${i === imgIdx ? "border-neutral-900 dark:border-white" : "border-transparent"}`}>
                  <img src={src} className="w-full h-full object-cover" onError={(e: any) => { e.target.src = fallbackProduct; }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl uppercase tracking-wider" style={{ fontWeight: 600 }}>{product.name}</h1>
          <div className="text-xl mt-2">₹{product.price.toLocaleString()}</div>
          <div className="flex items-center gap-1 mt-2 text-neutral-500 text-sm">
            <Star size={14} className="fill-amber-500 text-amber-500" /> Premium Quality • Free Shipping
          </div>
          <div className="mt-6">
            <div className="text-sm uppercase tracking-wider mb-2">Size</div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s: string) => (
                <button key={s} onClick={() => setSize(s)}
                  className={`px-4 py-2 border text-sm ${size === s ? "border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "border-neutral-300 dark:border-neutral-700"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => onBuy(product, size)} className="flex-1 py-3 uppercase tracking-wider text-sm rounded-md"
              style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>Buy Now</button>
            <button onClick={() => onWish(product.id)} className="px-4 border border-neutral-300 dark:border-neutral-700" aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}>
              <Heart size={20} className={wished ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
          <div className="mt-8 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Crafted from premium materials with a tailored fit. A timeless piece combining modern aesthetics with classic comfort.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Cart Page ─────────────────── */
function CartPage({ cart, setCart, onCheckout, onBack, total }: any) {
  if (cart.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <ShoppingBag size={48} className="mx-auto text-neutral-400" />
      <h2 className="uppercase tracking-[0.2em] mt-4">Your Cart Is Empty</h2>
      <button onClick={onBack} className="mt-6 px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 uppercase text-sm tracking-wider">Continue Shopping</button>
    </div>
  );
  const update = (i: number, qty: number) => {
    setCart((c: CartItem[]) => {
      if (qty <= 0) return c.filter((_, x) => x !== i);
      if (qty > 5) { toast.error("Stock limit reached"); return c; }
      const copy = [...c]; copy[i] = { ...copy[i], qty }; return copy;
    });
  };
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex items-center gap-3 my-4">
        <button onClick={onBack} className="p-2 -ml-2" aria-label="Go back"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]">Cart ({cart.length})</h2>
      </div>
      <div className="space-y-3">
        {cart.map((item: CartItem, i: number) => {
          const fallbackProduct = CONFIG.FALLBACK_PRODUCT;
          const imageSrc = item.product.image_url || (Array.isArray(item.product.images) && item.product.images[0]) || fallbackProduct;
          return (
            <div key={i} className="flex gap-4 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <img src={imageSrc} className="w-20 h-24 object-cover rounded" onError={(e: any) => { e.target.src = fallbackProduct; }} />
              <div className="flex-1">
                <div>{item.product.name}</div>
                <div className="text-sm text-neutral-500">Size: {item.size}</div>
                <div className="mt-1">₹{(item.product.price * item.qty).toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => update(i, 0)} aria-label="Remove item from cart"><Trash2 size={16} className="text-neutral-500" /></button>
                <div className="flex items-center gap-1 border border-neutral-300 dark:border-neutral-700 rounded-full">
                  <button onClick={() => update(i, item.qty - 1)} className="w-7 h-7 flex items-center justify-center" aria-label="Decrease quantity"><Minus size={12} /></button>
                  <span className="w-6 text-center text-sm">{item.qty}</span>
                  <button onClick={() => update(i, item.qty + 1)} className="w-7 h-7 flex items-center justify-center" aria-label="Increase quantity"><Plus size={12} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl">
        <div className="flex justify-between mb-2"><span>Subtotal</span><span>₹{total.toLocaleString()}</span></div>
        <div className="flex justify-between mb-4 text-sm text-neutral-500"><span>Shipping</span><span>Free</span></div>
        <div className="flex justify-between border-t border-neutral-200 dark:border-neutral-800 pt-3"><span style={{ fontWeight: 600 }}>Total</span><span style={{ fontWeight: 600 }}>₹{total.toLocaleString()}</span></div>
        <button onClick={onCheckout} className="w-full mt-4 py-3 uppercase tracking-wider text-sm" style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>Proceed to Checkout</button>
      </div>
    </div>
  );
}

/* ─────────────────── Checkout Page (UPI) ─────────────────── */
function CheckoutPage({ cart, total, user, onPlaced, onBack }: any) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
  const [upiId, setUpiId] = useState("");
  const [success, setSuccess] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  /* Validate phone number: 10 digits, starts with 6, 7, 8, or 9 */
  const validatePhone = (phone: string): { valid: boolean; error?: string } => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone) return { valid: false, error: "Phone number is required" };
    if (!/^\d+$/.test(phone)) return { valid: false, error: "Phone must contain only digits" };
    if (phone.length !== 10) return { valid: false, error: "Phone must be exactly 10 digits" };
    if (!phoneRegex.test(phone)) return { valid: false, error: "Phone must start with 6, 7, 8, or 9" };
    return { valid: true };
  };

  /* Validate pincode: exactly 6 digits */
  const validatePincode = (pincode: string): { valid: boolean; error?: string } => {
    if (!pincode) return { valid: false, error: "Pincode is required" };
    if (!/^\d+$/.test(pincode)) return { valid: false, error: "Pincode must contain only digits" };
    if (pincode.length !== 6) return { valid: false, error: "Pincode must be exactly 6 digits" };
    return { valid: true };
  };

  /* Validate all form fields */
  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    const phoneValidation = validatePhone(form.phone);
    if (!phoneValidation.valid) {
      toast.error(phoneValidation.error);
      return false;
    }
    if (!form.address.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!form.city.trim()) {
      toast.error("City is required");
      return false;
    }
    const pincodeValidation = validatePincode(form.pincode);
    if (!pincodeValidation.valid) {
      toast.error(pincodeValidation.error);
      return false;
    }
    return true;
  };

  const handlePaymentAndPlaceOrder = async () => {
    if (!localStorage.getItem('authToken')) {
      toast.error('Please login to place order');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const API_URL = CONFIG.API_URL;

      // 1. Format order items from cart
      const orderItems = cart.map((item: CartItem) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        qty: item.qty,
        size: item.size,
        product_id: item.product.id,
      }));

      console.log('Creating pending order on backend:', orderItems);

      // 2. Create order on backend (starts as pending)
      const response = await fetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: (user && user.email) ? user.email : 'customer@menshub.com',
          address: form.address,
          pincode: form.pincode,
          phone: form.phone,
          city: form.city,
          total_amount: total,
          items: orderItems,
          status: 'pending',
          payment_method: 'upi',
          payment_status: 'pending',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create order on backend:', errorText);
        toast.error('Failed to initiate order: ' + errorText);
        setIsCreatingOrder(false);
        return;
      }

      const orderData = await response.json();
      const orderNumber = orderData.order_number || orderData.id;
      console.log('✅ Pending Order created on backend:', orderData);

      // 3. Initiate payment session on Cashfree
      toast.info("⏳ Creating secure Cashfree payment session...");

      cashfreeService.initialize({
        appId: 'placeholder',
        mode: 'TEST' // Configured as Sandbox mode by default
      });

      const initiationResult = await cashfreeService.initiatePayment({
        orderId: orderNumber,
        amount: total,
        customerName: form.name,
        customerEmail: (user && user.email) ? user.email : 'customer@menshub.com',
        customerPhone: form.phone
      });

      const sessionId = initiationResult.payment_session_id;

      if (!sessionId) {
        throw new Error("Did not receive payment_session_id from backend");
      }

      // 4. Trigger Cashfree SDK Checkout Popup Overlay
      toast.info("💳 Launching Cashfree secure gateway...");
      const modalResult = await cashfreeService.openPaymentModal(sessionId, orderNumber);

      console.log("✅ Cashfree Checkout success callback completed:", modalResult);

      // 5. Secure Backend Verification
      toast.info("🔐 Securely verifying transaction status...");
      const verificationResult = await cashfreeService.verifyPayment({
        orderId: orderNumber,
        paymentId: modalResult.txnId,
        orderStatus: 'paid'
      });

      if (verificationResult.payment_status === 'success') {
        toast.success(`🎉 Payment verified! Order #${orderNumber} placed!`);
        setSuccess(true);
        setTimeout(onPlaced, 1800);
      } else {
        toast.error("❌ Payment verification failed: " + verificationResult.message);
      }

    } catch (error: any) {
      console.error('❌ Payment flow error:', error);
      toast.error('Payment failed: ' + (error.message || error));
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (success) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-green-500 text-white flex items-center justify-center"><Check size={32} /></div>
      <h2 className="uppercase tracking-[0.2em] mt-4">Order Placed!</h2>
      <p className="mt-2 text-neutral-500">Thank you for shopping at Men's Hub. Your order is being processed.</p>
      <button onClick={onPlaced} className="mt-6 px-6 py-3 uppercase text-sm tracking-wider" style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>View Orders</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="flex items-center gap-3 my-4">
        <button onClick={onBack} className="p-2 -ml-2" aria-label="Go back"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]">Checkout</h2>
      </div>
      <div className="flex gap-2 mb-6">
        {["Address", "Secure Payment"].map((s, i) => (
          <div key={s} className="flex-1 text-center py-2 text-xs uppercase tracking-wider rounded"
            style={step >= i ? { background: "var(--accent-grad)", color: "var(--accent-fg)" } : { background: "var(--neutral-200)", color: "#888" }}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <form onSubmit={e => {
          e.preventDefault();
          if (validateForm()) {
            setStep(1);
          }
        }} className="space-y-3">
          <div>
            <input key="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
          </div>

          <div>
            <input
              key="phone"
              required
              value={form.phone}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setForm({ ...form, phone: val });
              }}
              placeholder="Phone (10 digits, starts with 6-9)"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent"
              maxLength={10}
              inputMode="numeric"
            />
            {form.phone && !validatePhone(form.phone).valid && (
              <p className="text-red-500 text-xs mt-1">📱 {validatePhone(form.phone).error}</p>
            )}
          </div>

          <div>
            <input key="address" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Address"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
          </div>

          <div>
            <input key="city" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="City"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
          </div>

          <div>
            <input
              key="pincode"
              required
              value={form.pincode}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setForm({ ...form, pincode: val });
              }}
              placeholder="Pincode (6 digits)"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent"
              maxLength={6}
              inputMode="numeric"
            />
            {form.pincode && !validatePincode(form.pincode).valid && (
              <p className="text-red-500 text-xs mt-1">📮 {validatePincode(form.pincode).error}</p>
            )}
          </div>

          <button type="submit" className="w-full py-3 uppercase tracking-wider text-sm" style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>Continue to Payment</button>
        </form>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <div className="text-sm uppercase tracking-wider mb-1" style={{ color: "var(--accent)" }}>Shipping to</div>
            <div className="font-semibold text-neutral-800 dark:text-neutral-200">{form.name}</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">{form.address}, {form.city} — {form.pincode}</div>
            <div className="text-sm text-neutral-500 mt-1">📞 {form.phone}</div>
          </div>
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <div className="text-sm uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}>Order Items</div>
            {cart.map((item: CartItem, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-neutral-100 dark:border-neutral-900 last:border-b-0">
                <span className="text-neutral-700 dark:text-neutral-300">{item.product.name} × {item.qty} (Size: {item.size})</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">₹{(item.product.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between p-4 rounded-xl" style={{ border: "1px solid var(--accent)", background: "rgba(var(--accent-glow-rgb), 0.05)" }}>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Total Bill Amount</span>
            <span className="font-bold text-lg" style={{ color: "var(--accent)" }}>₹{total.toLocaleString()}</span>
          </div>
          <button
            onClick={handlePaymentAndPlaceOrder}
            disabled={isCreatingOrder}
            className="w-full py-3.5 uppercase tracking-wider text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
            style={{
              background: "var(--accent-grad)",
              color: "var(--accent-fg)",
              opacity: isCreatingOrder ? 0.6 : 1,
              cursor: isCreatingOrder ? "not-allowed" : "pointer"
            }}>
            {isCreatingOrder ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </>
            ) : (
              'Pay with Cashfree Gateway'
            )}
          </button>
          <button onClick={() => setStep(0)} className="w-full py-2 text-sm text-neutral-500 underline text-center">← Back to Address</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Login Page ─────────────────── */
function LoginPage({ onLogin, onBack }: any) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAuthForm, setShowAuthForm] = useState(false);

  const handleAuthSuccess = (userData: any) => {
    onLogin({
      name: userData.name || userData.email,
      email: userData.email,
      isAdmin: userData.isAdmin || false,
      authToken: localStorage.getItem('authToken')
    });
  };

  if (showAuthForm) {
    return (
      <AuthForm
        mode={authMode}
        onSuccess={handleAuthSuccess}
        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        onBack={() => setShowAuthForm(false)}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm"><ChevronLeft size={16} /> Back</button>
      <h2 className="uppercase tracking-[0.2em] text-center mb-6">Welcome Back</h2>

      {/* Email/Password Options */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => { setAuthMode('login'); setShowAuthForm(true); }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white uppercase tracking-wider text-sm rounded transition"
        >
          Login with Email
        </button>
        <button
          onClick={() => { setAuthMode('register'); setShowAuthForm(true); }}
          className="w-full py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 uppercase tracking-wider text-sm rounded transition"
        >
          Create Account
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-neutral-950 text-neutral-500">Or continue with</span>
        </div>
      </div>

      {/* Google OAuth Login */}
      <GoogleOAuthLoginButton onSuccess={handleAuthSuccess} onError={() => { }} />
    </div>
  );
}

/* Google OAuth Login Component */
function GoogleOAuthLoginButton({ onSuccess, onError }: any) {
  return (
    <div className="w-full">
      <GoogleLogin onSuccess={onSuccess} onError={onError} className="w-full" />
    </div>
  );
}

/* ─────────────────── Wishlist Page ─────────────────── */
function WishlistPage({ products, onProduct, onBuy, onWish, wishlist, onBack }: any) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg transition" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }} aria-label="Go back"><ChevronLeft size={20} /></button>
        <div>
          <h2 className="uppercase tracking-[0.2em]" style={{ fontWeight: 700 }}>My Wishlist</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{products.length === 0 ? "No saved items" : `${products.length} item${products.length > 1 ? "s" : ""} saved`}</p>
        </div>
        {products.length > 0 && (
          <div className="ml-auto hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}>
            <Heart size={14} className="fill-current" /><span>{products.length} Favourite{products.length > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
      <div className="h-px w-full my-4" style={{ background: "var(--accent)", opacity: 0.25 }} />
      {products.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ border: "2px solid var(--accent)" }}><Heart size={36} style={{ color: "var(--accent)" }} /></div>
          <h3 className="uppercase tracking-[0.2em] text-lg" style={{ fontWeight: 600 }}>Your Wishlist Is Empty</h3>
          <p className="text-neutral-500 text-sm text-center max-w-xs">Browse and tap the heart icon to save your favourite items.</p>
          <button onClick={onBack} className="mt-2 px-8 py-3 uppercase tracking-wider text-sm rounded-md" style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>Start Shopping</button>
        </div>
      ) : (
        <>
          <div className="hidden md:grid md:grid-cols-4 gap-5">
            {products.map((p: Product) => (
              <div key={p.id} className="group rounded-2xl overflow-hidden transition" style={{ border: "1px solid var(--accent)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 2px var(--accent), 0 10px 40px var(--accent-glow)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px var(--accent)"; }}>
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900 cursor-pointer" onClick={() => onProduct(p.id)}>
                  <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <button onClick={e => { e.stopPropagation(); onWish(p.id); }} title="Remove"
                    className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition"
                    style={{ background: "rgba(255,255,255,0.95)", border: "1px solid var(--accent)" }}>
                    <Heart size={16} className="fill-red-500 text-red-500" />
                  </button>
                </div>
                <div className="p-3">
                  <div className="text-sm truncate" style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="text-sm mt-0.5" style={{ color: "var(--accent-soft)" }}>₹{p.price.toLocaleString()}</div>
                  <button onClick={() => onBuy(p, p.sizes[0])} className="w-full mt-3 py-2 text-xs uppercase tracking-wider rounded-md"
                    style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>Buy Now</button>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 md:hidden">
            {products.map((p: Product) => <ProductCard key={p.id} product={p} onProduct={onProduct} onBuy={onBuy} onWish={onWish} wishlist={wishlist} />)}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────── Orders Page ─────────────────── */
function OrdersPage({ user, onBack }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchangeRequesting, setExchangeRequesting] = useState(false);
  const [exchangeForm, setExchangeForm] = useState<any>({});

  useEffect(() => {
    fetchUserOrders();

    // Auto-refresh orders every 5 seconds to show live admin updates
    const interval = setInterval(fetchUserOrders, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchUserOrders = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.warn('No auth token found');
        setOrders([]);
        setLoading(false);
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const url = `${API_URL}/api/orders/my_orders/`;
      console.log('Fetching orders from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Orders response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Orders data:', data);
        setOrders(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch orders. Status:', response.status, 'Response:', errorText);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* Calculate if order is eligible for exchange (within 3 days of delivery) */
  const isExchangeEligible = (order: any) => {
    if (!order.delivered_at) return false;
    const deliveredDate = new Date(order.delivered_at);
    const eligibleUntil = new Date(deliveredDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    return new Date() <= eligibleUntil && order.status === 'delivered';
  };

  /* Get days remaining for exchange eligibility */
  const getDaysRemaining = (order: any) => {
    if (!order.delivered_at) return 0;
    const deliveredDate = new Date(order.delivered_at);
    const eligibleUntil = new Date(deliveredDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((eligibleUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  /* Request exchange for order */
  const handleRequestExchange = async () => {
    if (!selectedOrder || !exchangeForm.product_name || !exchangeForm.size_old || !exchangeForm.size_new || !exchangeForm.reason) {
      toast.error('Please fill all exchange details');
      return;
    }

    if (exchangeForm.size_old === exchangeForm.size_new) {
      toast.error('New size must be different from old size');
      return;
    }

    setExchangeRequesting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}/request_exchange/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: selectedOrder.items?.[0]?.product_id || 0,
          product_name: exchangeForm.product_name,
          size_old: exchangeForm.size_old,
          size_new: exchangeForm.size_new,
          reason: exchangeForm.reason,
          reason_description: exchangeForm.reason_description || '',
        }),
      });

      if (response.ok) {
        toast.success('✅ Exchange request submitted! Admin will review soon.');
        setSelectedOrder(null);
        setExchangeForm({});
        fetchUserOrders();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to request exchange');
      }
    } catch (error) {
      console.error('Exchange request error:', error);
      toast.error('Error requesting exchange');
    } finally {
      setExchangeRequesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'delivered': 'text-green-500 bg-green-50',
      'shipped': 'text-blue-500 bg-blue-50',
      'placed': 'text-amber-500 bg-amber-50',
      'pending': 'text-amber-500 bg-amber-50',
      'processing': 'text-orange-500 bg-orange-50',
      'cancelled': 'text-red-500 bg-red-50',
    };
    return statusMap[status?.toLowerCase()] || 'text-gray-500 bg-gray-50';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  /* Detailed Order View */
  if (selectedOrder) {
    const isEligible = isExchangeEligible(selectedOrder);
    const daysLeft = getDaysRemaining(selectedOrder);

    // Check if shipped for over 4 days and not delivered yet
    const isShippedOver4Days = (() => {
      const status = selectedOrder.status?.toLowerCase();
      if (status !== 'shipped' && status !== 'out_for_delivery') {
        return false;
      }
      const dateStr = selectedOrder.shipped_at || selectedOrder.updated_at || selectedOrder.created_at;
      if (!dateStr) return false;

      const shipDate = new Date(dateStr);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - shipDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 4;
    })();

    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 my-4">
          <button onClick={() => setSelectedOrder(null)} className="p-2 -ml-2" aria-label="Back to orders list"><ChevronLeft size={20} /></button>
          <h2 className="uppercase tracking-[0.2em]">Order Details</h2>
        </div>

        <div className="space-y-4">
          {/* Order Header */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{selectedOrder.order_number || `Order #${selectedOrder.id}`}</h3>
                <p className="text-sm text-neutral-500">Placed on {formatDate(selectedOrder.created_at)}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(selectedOrder.status)}`}>
                {selectedOrder.status}
              </div>
            </div>

            {/* Status Step Timeline */}
            <div className="my-6 border-t border-b border-neutral-100 dark:border-neutral-800 py-6">
              <div className="flex justify-between items-center relative">
                {/* Horizontal line */}
                <div className="absolute left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-800 -z-10" />

                {/* Status steps */}
                {['pending', 'packed', 'shipped', 'out_for_delivery', 'delivered'].map((step) => {
                  const statuses = ['pending', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
                  const currentIdx = statuses.indexOf(selectedOrder.status?.toLowerCase());
                  const stepIdx = statuses.indexOf(step);
                  const isCompleted = stepIdx <= currentIdx;
                  const isCurrent = stepIdx === currentIdx;

                  const stepLabel: { [key: string]: string } = {
                    'pending': 'Placed',
                    'packed': 'Packed',
                    'shipped': 'Shipped',
                    'out_for_delivery': 'Out',
                    'delivered': 'Delivered'
                  };

                  const icon: { [key: string]: string } = {
                    'pending': '🛒',
                    'packed': '📦',
                    'shipped': '🚚',
                    'out_for_delivery': '🛵',
                    'delivered': '✅'
                  };

                  return (
                    <div key={step} className="flex flex-col items-center z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30'
                            : isCompleted
                              ? 'bg-green-600 text-white'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                          }`}
                      >
                        {icon[step]}
                      </div>
                      <span className={`text-[10px] font-semibold mt-2 ${isCurrent
                          ? 'text-blue-600 font-bold'
                          : isCompleted
                            ? 'text-green-600'
                            : 'text-neutral-500'
                        }`}>
                        {stepLabel[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Status Timeline */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Package size={16} /> <span>₹{parseFloat(selectedOrder.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              {selectedOrder.tracking_number && (
                <div
                  className="flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition"
                  style={{
                    background: selectedOrder.status === 'out_for_delivery' ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.1)',
                    border: `1px solid ${selectedOrder.status === 'out_for_delivery' ? '#22c55e' : '#d1d5db'}`,
                  }}
                  title="Click to copy tracking ID">
                  <div className="flex items-center gap-2">
                    <span style={{ color: selectedOrder.status === 'out_for_delivery' ? '#22c55e' : 'inherit' }}>📦</span>
                    <div>
                      <div className="text-xs text-neutral-500">Tracking ID:</div>
                      <span className="font-mono font-semibold">{selectedOrder.tracking_number}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.tracking_number);
                      toast.success('✅ Tracking ID copied!');
                    }}
                    className="px-2 py-1 text-xs rounded bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition">
                    📋
                  </button>
                </div>
              )}
              {selectedOrder.delivered_at && (
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" /> <span>Delivered on {formatDate(selectedOrder.delivered_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          {selectedOrder.items && selectedOrder.items.length > 0 && (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-neutral-500">Size: {item.size} | Qty: {item.qty}</p>
                    </div>
                    {item.price && <p className="font-semibold">₹{(item.price * item.qty).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exchange Eligibility */}
          {isEligible ? (
            <div className="border border-green-300 bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check size={18} className="text-green-600" />
                <p className="font-semibold text-green-900">Eligible for Size Exchange</p>
              </div>
              <p className="text-sm text-green-800 mb-3">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining to request exchange</p>

              {/* Exchange Form */}
              <div className="space-y-3 mt-4 pt-4 border-t border-green-200">
                <div>
                  <label className="text-sm font-medium">Product</label>
                  <input
                    type="text"
                    placeholder="Product name"
                    value={exchangeForm.product_name || ''}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, product_name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg mt-1 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Current Size</label>
                    <input
                      type="text"
                      placeholder="e.g., M"
                      value={exchangeForm.size_old || ''}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, size_old: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">New Size</label>
                    <input
                      type="text"
                      placeholder="e.g., L"
                      value={exchangeForm.size_new || ''}
                      onChange={(e) => setExchangeForm({ ...exchangeForm, size_new: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg mt-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <select
                    value={exchangeForm.reason || ''}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg mt-1 text-sm"
                  >
                    <option value="">Select reason...</option>
                    <option value="too_small">Too Small</option>
                    <option value="too_large">Too Large</option>
                    <option value="size_mismatch">Size Mismatch</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Additional Details (Optional)</label>
                  <textarea
                    placeholder="Any additional information..."
                    value={exchangeForm.reason_description || ''}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, reason_description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg mt-1 text-sm"
                    rows={2}
                  />
                </div>
                <button
                  onClick={handleRequestExchange}
                  disabled={exchangeRequesting}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  {exchangeRequesting ? 'Submitting...' : 'Request Exchange'}
                </button>
              </div>
            </div>
          ) : (
            selectedOrder.status === 'delivered' && (
              <div className="border border-neutral-300 bg-neutral-50 rounded-xl p-4">
                <p className="text-sm text-neutral-600">Exchange eligibility window has closed. Exchange must be requested within 3 days of delivery.</p>
              </div>
            )
          )}

          {/* WhatsApp Support Notice for Shipped/Out for Delivery Orders */}
          {['shipped', 'out_for_delivery'].includes(selectedOrder.status?.toLowerCase()) && (
            <div className="border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-600 text-lg">🚚</span>
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">Order Shipped & On Its Way!</p>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-3">
                Your order has been shipped. For any queries or product discussion, chat directly with the Admin on WhatsApp.
              </p>
              <button
                onClick={() => {
                  const adminPhone = "919524097865";
                  const orderNum = selectedOrder.order_number || selectedOrder.id;
                  const customerName = selectedOrder.customer_name || selectedOrder.customer?.name || "Customer";
                  const customerPhone = selectedOrder.phone || selectedOrder.customer?.phone || "N/A";
                  const customerAddress = `${selectedOrder.address || ""}, ${selectedOrder.city || ""}, ${selectedOrder.pincode || ""}`.replace(/(^[,\s]+)|([,\s]+$)/g, '');
                  const message = `Hello Mens Hub Admin,\n\nI have a query regarding my shipped product. Here are my details:\n\n*Name:* ${customerName}\n*Order ID:* #${orderNum}\n*Phone:* ${customerPhone}\n*Address:* ${customerAddress}\n\n*Status:* ${selectedOrder.status?.toUpperCase()}`;
                  window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="w-full py-2.5 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                style={{ background: "#25D366" }}
              >
                💬 Chat with Admin on WhatsApp
              </button>
            </div>
          )}

          {/* Customer Info */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Delivery Address</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {selectedOrder.customer_name}<br />
              {selectedOrder.address}<br />
              {selectedOrder.pincode}
            </p>
          </div>

          {/* WhatsApp Query Support Button removed for admin/customer separation */}
        </div>
      </div>
    );
  }

  /* Orders List View */
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="flex items-center gap-3 my-4">
        <button onClick={onBack} className="p-2 -ml-2" aria-label="Go back"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]">My Orders</h2>
      </div>
      <div className="mb-4 text-sm text-neutral-500">Welcome, {user?.name || "Guest"}</div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-sm text-neutral-500">Loading your orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-4">
          <div className="text-neutral-400">📦</div>
          <h3 className="text-center">No Orders Yet</h3>
          <p className="text-sm text-neutral-500 text-center max-w-xs">You haven't placed any orders yet. Start shopping to see your orders here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const isEligible = isExchangeEligible(o);
            const daysLeft = getDaysRemaining(o);

            return (
              <button
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className="w-full p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
              >
                <div className="text-left">
                  <div className="font-medium">{o.order_number || `Order #${o.id}`}</div>
                  <div className="text-sm text-neutral-500">{formatDate(o.created_at)}</div>
                  {isEligible && <div className="text-xs text-green-600 font-semibold mt-1">✓ Exchange eligible ({daysLeft}d left)</div>}
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{parseFloat(o.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                  <div className={`text-xs uppercase font-medium mt-1 px-2 py-1 rounded-full inline-block ${getStatusColor(o.status)}`}>{o.status}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════���═══════
   NOTIFICATIONS PAGE (Admin only)
═════════════════════���═════════════════════════ */
function NotificationsPage({ onBack }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<any>(null);

  useEffect(() => {
    fetchNotifications();

    // Refresh every 5 seconds to check for new orders
    const interval = setInterval(fetchNotifications, 5000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/api/admin/notifications/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notifications fetched:', data);
        setNotifications(data);
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/api/admin/notifications/${notificationId}/read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

      // Mark each unread notification as read
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      for (const notification of unreadNotifications) {
        await fetch(`${API_URL}/api/admin/notifications/${notification.id}/read/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="text-neutral-500">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg transition" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }} aria-label="Go back"><ChevronLeft size={20} /></button>
        <div className="flex-1">
          <h2 className="uppercase tracking-[0.2em] flex items-center gap-2" style={{ fontWeight: 700 }}>
            <Bell size={20} style={{ color: "var(--accent)" }} /> Order Notifications
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            {notifications.length === 0 ? "No orders yet" : `${notifications.length} order${notifications.length > 1 ? "s" : ""} • ${unread} unread`}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllAsRead}
            className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md"
            style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}>
            Mark All Read
          </button>
        )}
      </div>
      <div className="h-px w-full my-4" style={{ background: "var(--accent)", opacity: 0.25 }} />

      {notifications.length === 0 ? (
        /* Empty state */
        <div className="py-24 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ border: "2px solid var(--accent)" }}>
            <Bell size={36} style={{ color: "var(--accent)" }} />
          </div>
          <h3 className="uppercase tracking-[0.2em] text-lg" style={{ fontWeight: 600 }}>No Orders Yet</h3>
          <p className="text-neutral-500 text-sm text-center max-w-xs">When customers place orders, you'll see real-time notifications here. (Auto-refreshes every 5 seconds)</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className="relative p-4 rounded-2xl cursor-pointer transition"
              style={{
                border: `1.5px solid ${n.is_read ? "var(--accent)" : "#ef4444"}`,
                background: n.is_read ? "transparent" : "rgba(239,68,68,0.04)",
                opacity: n.is_read ? 0.85 : 1,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 2px var(--accent), 0 6px 24px var(--accent-glow)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px var(--accent)"; }}>

              {/* Unread dot */}
              {!n.is_read && (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-red-500" />
              )}

              {/* Top row */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>
                  <ShoppingCart size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm" style={{ fontWeight: 700, color: "var(--accent)" }}>
                      #{n.order_number || n.order}
                    </span>
                    {!n.is_read && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white uppercase tracking-wider">New</span>}
                  </div>
                  <div className="text-sm mt-0.5">
                    <span className="text-neutral-500">from </span>
                    <span style={{ fontWeight: 600 }}>{n.customer_name}</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div style={{ fontWeight: 700, color: "var(--accent)" }}>₹{parseFloat(n.total_amount || 0).toLocaleString()}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{n.items_count || 0} item{n.items_count > 1 ? "s" : ""}</div>
                </div>
              </div>

              {/* Items list */}
              {n.items_summary && n.items_summary.length > 0 && (
                <div className="mt-3 ml-13 pl-1 border-l-2 border-neutral-200 dark:border-neutral-800 ml-[52px] space-y-1">
                  {n.items_summary.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Package2 size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
                      <span>{item.name || 'Product'}</span>
                      <span className="ml-auto shrink-0">× {item.qty || 1} • Size {item.size || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════ */
function AdminPanel({ products, setProducts, categories, setCategories, bannerImg, setBannerImg, notifyTabsToRefresh, onBack, initialTab, initialOrderId }: any) {
  const [tab, setTab] = useState<"products" | "categories" | "banner" | "orders">(initialTab || "products");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const openedOrderIdRef = useRef<any>(null);

  // Synchronize props to state if they change (e.g. clicking notification)
  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  // Track and auto-open order when initialOrderId is provided (e.g., from a notification click)
  useEffect(() => {
    if (!initialOrderId) {
      openedOrderIdRef.current = null;
      return;
    }
    if (tab === "orders") {
      if (orders.length > 0) {
        if (openedOrderIdRef.current !== initialOrderId) {
          const match = orders.find((o: any) => o.id == initialOrderId || o.order_number == initialOrderId);
          if (match) {
            setViewingOrder(match);
            openedOrderIdRef.current = initialOrderId;
            console.log('✅ Order from notification opened:', match);
          }
        }
      } else if (!loadingOrders) {
        fetchOrders();
      }
    }
  }, [initialOrderId, tab, orders, loadingOrders]);

  // Load data directly from database when AdminPanel first loads
  // This ensures each tab has its own fresh data, preventing cross-tab conflicts
  useEffect(() => {
    const loadAdminData = async () => {
      setDataLoading(true);
      try {
        const [dbProducts, dbCategories] = await Promise.all([
          adminService.loadProductsFromDB(true), // Force fresh load
          adminService.loadCategoriesFromDB(true) // Force fresh load
        ]);

        if (dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts);
          console.log('✅ AdminPanel: Loaded', dbProducts.length, 'products from DB');
        }
        if (dbCategories && dbCategories.length > 0) {
          setCategories(dbCategories);
          console.log('✅ AdminPanel: Loaded', dbCategories.length, 'categories from DB');
        }
      } catch (err) {
        console.error('❌ AdminPanel: Failed to load data from DB:', err);
        toast.error('Failed to load admin data from database');
      } finally {
        setDataLoading(false);
      }
    };

    loadAdminData();
  }, []); // Load once on mount

  // Listen for updates from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'refreshData') {
        console.log('🔄 AdminPanel: Detected refresh from another tab, reloading data...');
        const loadAdminData = async () => {
          try {
            const [dbProducts, dbCategories] = await Promise.all([
              adminService.loadProductsFromDB(true), // Force fresh load
              adminService.loadCategoriesFromDB(true) // Force fresh load
            ]);

            if (dbProducts && dbProducts.length > 0) setProducts(dbProducts);
            if (dbCategories && dbCategories.length > 0) setCategories(dbCategories);
          } catch (err) {
            console.error('Failed to refresh data:', err);
          }
        };
        loadAdminData();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setProducts, setCategories]);


  // Add updateOrderStatus function for order status updates
  const updateOrderStatus = async (orderId: any, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        setViewingOrder((prev: any) =>
          prev && prev.id === orderId ? { ...prev, status: newStatus } : prev
        );
        toast.success(`✅ Order updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
        // Re-fetch to ensure live update
        await fetchOrders();
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error updating order status');
    } finally {
      setUpdatingStatus(false);
    }
  };
  const filteredProducts = products.filter((p: Product) => p.name.toLowerCase().includes(q.toLowerCase()));

  const saveProduct = async (p: Product) => {
    setSaving(true);
    try {
      let categoryId = p.category;
      const catObj = categories.find((c: Category) => String(c.id) === String(p.category) || c.name.toLowerCase() === String(p.category).toLowerCase());
      if (catObj) categoryId = catObj.id;
      const safeProduct = { ...p, category: categoryId };
      const saved = await adminService.saveProduct(safeProduct);
      setProducts((arr: Product[]) => {
        const idx = arr.findIndex(x => x.id === p.id);
        if (idx >= 0) { const c = [...arr]; c[idx] = saved; return c; }
        return [...arr, saved];
      });
      notifyTabsToRefresh();
      // Ensure modal closes properly
      setEditingProduct(null);
      // Reset search to show updated product
      setQ("");
      toast.success("Product saved to database ✓");
    } catch (err: any) {
      console.error("Failed to save product:", err);
      toast.error(err?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: any) => {
    setSaving(true);
    try {
      await adminService.deleteProductFromDB(id);
      setProducts((arr: Product[]) => arr.filter(p => p.id !== id));
      notifyTabsToRefresh();
      toast.success("Product deleted from database ✓");
    } catch (err: any) {
      console.error("Failed to delete product:", err);
      toast.error(err?.message || "Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async (c: Category) => {
    setSaving(true);
    try {
      const saved = await adminService.saveCategory(c);
      setCategories((arr: Category[]) => {
        const idx = arr.findIndex(x => x.id === c.id);
        if (idx >= 0) { const copy = [...arr]; copy[idx] = saved; return copy; }
        return [...arr, saved];
      });
      notifyTabsToRefresh();
      setEditingCategory(null);
      toast.success("Category saved to database ✓");
    } catch (err: any) {
      console.error("Failed to save category:", err);
      toast.error(err?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: any) => {
    setSaving(true);
    try {
      await adminService.deleteCategoryFromDB(id);
      setCategories((arr: Category[]) => arr.filter(c => c.id !== id));
      notifyTabsToRefresh();
      toast.success("Category deleted from database ✓");
    } catch (err: any) {
      console.error("Failed to delete category:", err);
      toast.error(err?.message || "Failed to delete category");
    } finally {
      setSaving(false);
    }
  };

  // ===== ORDER MANAGEMENT =====
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/api/admin/orders/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const submitTrackingId = async () => {
    if (!trackingId.trim()) {
      toast.error('Please enter delivery order ID');
      return;
    }

    setUpdatingStatus(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/api/admin/orders/${selectedOrder}/status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'out_for_delivery',
          tracking_number: trackingId,
        }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder
              ? { ...o, status: 'out_for_delivery', tracking_number: trackingId }
              : o
          )
        );
        toast.success(`✅ Order marked as Out for Delivery | Tracking: ${trackingId}`);
        setShowTrackingModal(false);
        setTrackingId('');
        setSelectedOrder(null);
        // Re-fetch to ensure live update
        await fetchOrders();
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error updating order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Fetch orders when orders tab is opened
  useEffect(() => {
    if (tab === 'orders') {
      fetchOrders();
      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [tab]);

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex items-center gap-3 my-4">
        <button onClick={onBack} className="p-2 -ml-2" aria-label="Go back"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]">Admin Panel</h2>
        {dataLoading && <span className="text-xs text-neutral-500 animate-pulse">📡 Loading data...</span>}
      </div>
      <div className="flex gap-2 mb-6">
        {([
          ["products", "Products"],
          ["categories", "Categories"],
          ["orders", "Orders"],
          ["banner", "Banner"]
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="px-4 py-2 text-sm uppercase tracking-wider rounded-md transition"
            style={tab === id ? { background: "var(--accent-grad)", color: "var(--accent-fg)" } : { border: "1px solid var(--accent)", color: "var(--accent)" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <>
          <div className="flex gap-2 mb-4">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
              className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
            <button onClick={() => setEditingProduct({ id: "", name: "", price: 0, category: categories[0]?.id || "", popularity: 5, sizes: ["M"], images: [""], featured: false })}
              className="px-4 py-2 text-sm uppercase tracking-wider"
              style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>+ Add</button>
          </div>
          {dataLoading ? (
            <div className="py-8 text-center text-neutral-500">
              <div className="animate-pulse">📦 Loading products...</div>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              <div>No products found. Click "+ Add" to create one.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {(filteredProducts || []).map((p: Product) => {
                // Defensive: always use a fallback if images is missing or empty
                const fallbackProduct = CONFIG.FALLBACK_PRODUCT;
                const imageSrc = p.image_url || (Array.isArray(p.images) && p.images[0]) || fallbackProduct;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                    <img src={imageSrc} className="w-14 h-14 object-cover rounded-lg" onError={(e: any) => { e.target.src = fallbackProduct; }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        {p.featured && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", fontWeight: 700 }}>
                            ★ Featured
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-500">₹{p.price.toLocaleString()} • {categories.find((c: Category) => String(c.id) === String(p.category))?.name || p.category}</div>
                    </div>
                    {/* Quick Featured Toggle */}
                    <button
                      onClick={async () => {
                        const updated = { ...p, featured: !p.featured };
                        setSaving(true);
                        try {
                          await adminService.saveProduct(updated);
                          setProducts((arr: Product[]) => arr.map(x => x.id === p.id ? updated : x));
                          notifyTabsToRefresh();
                          toast.success(p.featured ? "Removed from Featured ✓" : "Added to Featured ✓");
                        } catch (err) {
                          toast.error("Failed to update featured status");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      title={p.featured ? "Remove from Featured" : "Mark as Featured"}
                      className="p-2 rounded-md transition-all text-xs"
                      style={p.featured ? { background: "var(--accent-grad)", color: "var(--accent-fg)", fontWeight: 700, border: "1px solid var(--accent)", opacity: saving ? 0.5 : 1 } : { border: "1px solid var(--accent)", color: "var(--accent)", opacity: saving ? 0.5 : 1 }}>
                      ★
                    </button>
                    <button onClick={() => setEditingProduct(p)} className="p-2 rounded-md" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}><Edit2 size={14} /></button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 rounded-md border border-red-300 text-red-500"><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          )}
          {editingProduct && <ProductEditor product={editingProduct} categories={categories} onSave={saveProduct} onCancel={() => setEditingProduct(null)} notifyTabsToRefresh={notifyTabsToRefresh} />}
        </>
      )}

      {tab === "categories" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setEditingCategory({ id: "", name: "", img: "" })}
              className="px-4 py-2 text-sm uppercase tracking-wider"
              style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>+ Add Category</button>
          </div>
          {dataLoading ? (
            <div className="py-8 text-center text-neutral-500">
              <div className="animate-pulse">📂 Loading categories...</div>
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              <div>No categories found. Click "+ Add Category" to create one.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((c: Category) => (
                <div key={c.id} className="rounded-xl overflow-hidden transition"
                  style={{ border: "1px solid var(--accent)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 2px var(--accent), 0 10px 40px var(--accent-glow)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px var(--accent)"; }}>
                  <div className="relative h-32">
                    <img src={c.img} className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display = "none"; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white uppercase tracking-wider text-sm" style={{ fontWeight: 600 }}>{c.name}</div>
                  </div>
                  <div className="flex gap-2 p-3">
                    <button onClick={() => setEditingCategory(c)} className="flex-1 py-1.5 text-xs uppercase tracking-wider rounded" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}>
                      <Edit2 size={12} className="inline mr-1" />Edit
                    </button>
                    <button onClick={() => deleteCategory(c.id)} className="flex-1 py-1.5 text-xs uppercase tracking-wider rounded border border-red-400 text-red-500">
                      <Trash2 size={12} className="inline mr-1" />Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {editingCategory && <CategoryEditor category={editingCategory} onSave={saveCategory} onCancel={() => setEditingCategory(null)} notifyTabsToRefresh={notifyTabsToRefresh} />}
        </>
      )}

      {tab === "banner" && <BannerEditor bannerImg={bannerImg} setBannerImg={setBannerImg} notifyTabsToRefresh={notifyTabsToRefresh} />}

      {tab === "orders" && (
        <div>
          {/* Refresh Button */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={fetchOrders}
              disabled={loadingOrders}
              className="px-4 py-2 text-sm uppercase tracking-wider rounded-md transition"
              style={{
                background: "var(--accent-grad)",
                color: "var(--accent-fg)",
                opacity: loadingOrders ? 0.5 : 1,
              }}>
              {loadingOrders ? "Loading..." : "🔄 Refresh Orders"}
            </button>
            <div className="text-sm text-neutral-500 py-2 px-3 rounded-md border border-neutral-300 dark:border-neutral-700">
              {orders.length} Total Orders
            </div>
          </div>

          {loadingOrders && <div className="text-center py-8 text-neutral-500">Loading orders...</div>}

          {!loadingOrders && orders.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-neutral-500 mb-2">No orders yet</div>
            </div>
          )}

          {!loadingOrders && orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl"
                  style={{
                    borderColor: "var(--accent)",
                    borderWidth: "1px",
                  }}>
                  {/* Header (Click to view details) */}
                  <div onClick={() => setViewingOrder(order)} className="flex items-start justify-between mb-3 cursor-pointer hover:opacity-80 transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                          #{order.order_number}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            background:
                              order.status === "pending"
                                ? "rgba(239,68,68,0.2)"
                                : order.status === "processing"
                                  ? "rgba(245,158,11,0.2)"
                                  : order.status === "packed"
                                    ? "rgba(59,130,246,0.2)"
                                    : order.status === "shipped"
                                      ? "rgba(168,85,247,0.2)"
                                      : order.status === "out_for_delivery"
                                        ? "rgba(34,197,94,0.2)"
                                        : order.status === "delivered"
                                          ? "rgba(34,197,94,0.2)"
                                          : "rgba(107,114,128,0.2)",
                            color:
                              order.status === "pending"
                                ? "#ef4444"
                                : order.status === "processing"
                                  ? "#f59e0b"
                                  : order.status === "packed"
                                    ? "#3b82f6"
                                    : order.status === "shipped"
                                      ? "#a855f7"
                                      : order.status === "out_for_delivery"
                                        ? "#22c55e"
                                        : order.status === "delivered"
                                          ? "#22c55e"
                                          : "#6b7280",
                          }}>
                          {order.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        <strong>Customer:</strong> {order.customer_name || order.customer?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        <strong>Email:</strong> {order.customer_email || order.customer?.email || 'N/A'}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        <strong>Phone:</strong> {order.phone || 'N/A'}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        <strong>Address:</strong> {order.address || 'N/A'} {order.city ? `(${order.city})` : ''} {order.pincode ? `- ${order.pincode}` : ''}
                      </div>
                      <div className="text-xs text-neutral-400 mt-2">
                        ₹{order.total_amount?.toLocaleString() || 0} • {order.items?.length || 0} items
                      </div>
                      {order.tracking_number && (
                        <div className="text-xs text-neutral-500 mt-2 p-2 bg-neutral-100 dark:bg-neutral-900 rounded">
                          📦 Tracking: <strong>{order.tracking_number}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateOrderStatus(order.id, "packed")}
                      disabled={updatingStatus || !["pending", "processing"].includes(order.status)}
                      className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                      style={{
                        border:
                          ["pending", "processing"].includes(order.status)
                            ? "1px solid #3b82f6"
                            : "1px solid #d1d5db",
                        color:
                          ["pending", "processing"].includes(order.status)
                            ? "#3b82f6"
                            : "#9ca3af",
                        background: order.status === "packed" ? "rgba(59,130,246,0.2)" : "transparent",
                        opacity: updatingStatus ? 0.5 : 1,
                        cursor: ["pending", "processing"].includes(order.status) ? "pointer" : "not-allowed",
                      }}>
                      📦 Packed
                    </button>

                    <button
                      onClick={() => updateOrderStatus(order.id, "shipped")}
                      disabled={updatingStatus || !["pending", "processing", "packed"].includes(order.status)}
                      className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                      style={{
                        border:
                          ["pending", "processing", "packed"].includes(order.status)
                            ? "1px solid #a855f7"
                            : "1px solid #d1d5db",
                        color:
                          ["pending", "processing", "packed"].includes(order.status)
                            ? "#a855f7"
                            : "#9ca3af",
                        background:
                          order.status === "shipped" ? "rgba(168,85,247,0.2)" : "transparent",
                        opacity: updatingStatus ? 0.5 : 1,
                        cursor: ["pending", "processing", "packed", "shipped"].includes(order.status)
                          ? "pointer"
                          : "not-allowed",
                      }}>
                      🚚 Shipped
                    </button>

                    <button
                      onClick={() => updateOrderStatus(order.id, "out_for_delivery")}
                      disabled={
                        updatingStatus ||
                        !["pending", "processing", "packed", "shipped"].includes(order.status)
                      }
                      className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                      style={{
                        border:
                          ["pending", "processing", "packed", "shipped"].includes(order.status)
                            ? "1px solid #22c55e"
                            : "1px solid #d1d5db",
                        color:
                          ["pending", "processing", "packed", "shipped"].includes(order.status)
                            ? "#22c55e"
                            : "#9ca3af",
                        background:
                          order.status === "out_for_delivery"
                            ? "rgba(34,197,94,0.2)"
                            : "transparent",
                        opacity: updatingStatus ? 0.5 : 1,
                        cursor: ["pending", "processing", "packed", "shipped"].includes(order.status)
                          ? "pointer"
                          : "not-allowed",
                      }}>
                      🎯 Out for Delivery
                    </button>
                    <button
                      onClick={() => setViewingOrder(order)}
                      className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                      style={{
                        border: "1px solid var(--accent)",
                        color: "var(--accent)",
                        cursor: "pointer",
                      }}>
                      👁 View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tracking ID Modal */}
      {showTrackingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowTrackingModal(false)}>
          <div
            className="bg-white dark:bg-neutral-950 rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "1px solid var(--accent)" }}>
            <h3
              className="uppercase tracking-wider mb-4"
              style={{ fontWeight: 600, color: "var(--accent)" }}>
              📦 Enter Delivery Tracking ID
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Enter the delivery order ID for tracking (e.g., Delhivery, FedEx tracking number)
            </p>
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitTrackingId();
              }}
              placeholder="e.g., DL1234567890"
              maxLength={50}
              className="w-full px-4 py-2.5 mb-4 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-transparent text-sm"
              style={{ borderColor: "var(--accent)", borderWidth: "1.5px" }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowTrackingModal(false)}
                className="flex-1 py-2 text-xs uppercase tracking-wider rounded-md"
                style={{
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                }}>
                Cancel
              </button>
              <button
                onClick={submitTrackingId}
                disabled={updatingStatus}
                className="flex-1 py-2 text-xs uppercase tracking-wider rounded-md"
                style={{
                  background: "var(--accent-grad)",
                  color: "var(--accent-fg)",
                  opacity: updatingStatus ? 0.5 : 1,
                }}>
                {updatingStatus ? "Updating..." : "✅ Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Order Details Modal */}
      {viewingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onMouseDown={() => setViewingOrder(null)}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className="bg-white dark:bg-neutral-950 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ border: "1px solid var(--accent)", pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <h3 className="text-lg font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                📄 Order Details: #{viewingOrder.order_number || viewingOrder.id}
              </h3>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewingOrder(null);
                }}
                className="p-1 rounded bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center"
                style={{ pointerEvents: 'auto' }}
                type="button"
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
              {/* Left Column: Customer & Delivery Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-400 mb-1">Customer Info</h4>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <p className="mb-1"><strong>Name:</strong> {viewingOrder.customer?.name || viewingOrder.customer_name || 'N/A'}</p>
                    <p className="mb-1"><strong>Email:</strong> {viewingOrder.customer?.email || viewingOrder.customer_email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {viewingOrder.customer?.phone || viewingOrder.phone || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-400 mb-1">Shipping Details</h4>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <p className="mb-1"><strong>Address:</strong> {viewingOrder.address || 'N/A'}</p>
                    <p className="mb-1"><strong>City:</strong> {viewingOrder.city || 'N/A'}</p>
                    <p><strong>Pincode:</strong> {viewingOrder.pincode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Status & Metadata */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-400 mb-1">Order Status</h4>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold">Status:</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold"
                        style={{
                          background:
                            viewingOrder.status === "pending"
                              ? "rgba(239,68,68,0.2)"
                              : viewingOrder.status === "packed"
                                ? "rgba(59,130,246,0.2)"
                                : viewingOrder.status === "shipped"
                                  ? "rgba(168,85,247,0.2)"
                                  : viewingOrder.status === "out_for_delivery"
                                    ? "rgba(34,197,94,0.2)"
                                    : viewingOrder.status === "delivered"
                                      ? "rgba(34,197,94,0.2)"
                                      : "rgba(107,114,128,0.2)",
                          color:
                            viewingOrder.status === "pending"
                              ? "#ef4444"
                              : viewingOrder.status === "packed"
                                ? "#3b82f6"
                                : viewingOrder.status === "shipped"
                                  ? "#a855f7"
                                  : viewingOrder.status === "out_for_delivery"
                                    ? "#22c55e"
                                    : viewingOrder.status === "delivered"
                                      ? "#22c55e"
                                      : "#6b7280",
                        }}
                      >
                        {viewingOrder.status.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                    {viewingOrder.tracking_number && (
                      <p className="mt-1 mb-1"><strong>Tracking Number:</strong> {viewingOrder.tracking_number}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-2">
                      Placed on: {new Date(viewingOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-400 mb-1">Payment Info</h4>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <p className="mb-1"><strong>Method:</strong> {viewingOrder.payment_method?.toUpperCase() || 'UPI'}</p>
                    <p className="mb-1"><strong>Status:</strong> {viewingOrder.payment_status?.toUpperCase() || 'SUCCESS'}</p>
                    <p><strong>Total Amount:</strong> ₹{parseFloat(viewingOrder.total_amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table/List */}
            <div className="mb-6">
              <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-400 mb-2">Itemized Products</h4>
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-neutral-500">Product</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-neutral-500 text-center">Size</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-neutral-500 text-center">Quantity</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-neutral-500 text-right">Price</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-neutral-500 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingOrder.items?.map((item: any, idx: number) => {
                      // Lookup matching product in products array to get the thumbnail
                      const matchedProduct = products.find((p: any) => p.id == item.product_id || p.id == item.id);
                      const fallbackImg = CONFIG.FALLBACK_IMG;
                      const imgUrl = matchedProduct?.image_url || matchedProduct?.images?.[0] || fallbackImg;

                      const itemPrice = parseFloat(item.price || 0);
                      const itemQty = parseInt(item.qty || item.quantity || 1);
                      return (
                        <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50">
                          <td className="p-3 flex items-center gap-3">
                            <img src={imgUrl} className="w-10 h-10 object-cover rounded-lg border border-neutral-200 dark:border-neutral-800" onError={(e: any) => e.target.src = fallbackImg} />
                            <span className="font-semibold">{item.name || item.product_name}</span>
                          </td>
                          <td className="p-3 text-center font-semibold font-mono">{item.size || 'N/A'}</td>
                          <td className="p-3 text-center font-semibold">{itemQty}</td>
                          <td className="p-3 text-right">₹{itemPrice.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold">₹{(itemPrice * itemQty).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions / Buttons Footer */}
            <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800">
              {/* Quick Status Actions */}
              <div className="flex gap-2 justify-center pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 self-center mr-2">Update Status:</span>
                <button
                  onClick={() => updateOrderStatus(viewingOrder.id, "packed")}
                  disabled={updatingStatus || viewingOrder.status !== "pending"}
                  className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                  style={{
                    border: viewingOrder.status === "pending" ? "1px solid #3b82f6" : "1px solid #d1d5db",
                    color: viewingOrder.status === "pending" ? "#3b82f6" : "#9ca3af",
                    background: viewingOrder.status === "packed" ? "rgba(59,130,246,0.2)" : "transparent",
                    opacity: updatingStatus ? 0.5 : 1,
                    cursor: viewingOrder.status === "pending" ? "pointer" : "not-allowed",
                  }}>
                  📦 Packed
                </button>
                <button
                  onClick={() => updateOrderStatus(viewingOrder.id, "shipped")}
                  disabled={updatingStatus || !["pending", "packed"].includes(viewingOrder.status)}
                  className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                  style={{
                    border: ["pending", "packed"].includes(viewingOrder.status) ? "1px solid #a855f7" : "1px solid #d1d5db",
                    color: ["pending", "packed"].includes(viewingOrder.status) ? "#a855f7" : "#9ca3af",
                    background: viewingOrder.status === "shipped" ? "rgba(168,85,247,0.2)" : "transparent",
                    opacity: updatingStatus ? 0.5 : 1,
                    cursor: ["pending", "packed", "shipped"].includes(viewingOrder.status) ? "pointer" : "not-allowed",
                  }}>
                  🚚 Shipped
                </button>
                <button
                  onClick={() => updateOrderStatus(viewingOrder.id, "out_for_delivery")}
                  disabled={updatingStatus || !["pending", "packed", "shipped"].includes(viewingOrder.status)}
                  className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                  style={{
                    border: ["pending", "packed", "shipped"].includes(viewingOrder.status) ? "1px solid #22c55e" : "1px solid #d1d5db",
                    color: ["pending", "packed", "shipped"].includes(viewingOrder.status) ? "#22c55e" : "#9ca3af",
                    background: viewingOrder.status === "out_for_delivery" ? "rgba(34,197,94,0.2)" : "transparent",
                    opacity: updatingStatus ? 0.5 : 1,
                    cursor: ["pending", "packed", "shipped"].includes(viewingOrder.status) ? "pointer" : "not-allowed",
                  }}>
                  🎯 Out for Delivery
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const phoneNum = viewingOrder.customer?.phone || viewingOrder.phone;
                    if (!phoneNum || phoneNum === 'N/A') {
                      toast.error("Customer phone number not available");
                      return;
                    }
                    const cleanPhone = phoneNum.replace(/\D/g, '');
                    const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
                    const message = `Hello, this is Men's Hub Admin regarding your order #${viewingOrder.order_number || viewingOrder.id}.`;
                    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition"
                  style={{ background: "#25D366" }}
                >
                  💬 Chat with Customer
                </button>

                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setViewingOrder(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition text-center cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  type="button"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Size Custom Input ─────────────────── */
function SizeCustomInput({ onAdd }: { onAdd: (s: string) => void }) {
  const [val, setVal] = useState("");
  const submit = () => { const v = val.trim(); if (v) { onAdd(v); setVal(""); } };
  return (
    <div className="flex gap-2 mt-1">
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
        placeholder="Custom size (e.g. 42, Free)"
        className="flex-1 px-2 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
      <button type="button" onClick={submit}
        className="px-3 py-1.5 text-xs rounded uppercase tracking-wider"
        style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", fontWeight: 600 }}>
        + Add
      </button>
    </div>
  );
}

/* ─────────────────── Product Editor ─────────────────── */
function ProductEditor({ product, categories, onSave, onCancel, notifyTabsToRefresh }: any) {
  const [p, setP] = useState<Product>({ ...product });
  const [preview, setPreview] = useState(product.image_url || product.images?.[0] || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const url = await fileToDataURL(file);
    setPreview(url);

    // Upload file in background
    setUploading(true);
    try {
      const uploadedUrl = await adminService.uploadImage(file);
      setP((prev: Product) => ({ ...prev, image_url: uploadedUrl, images: [uploadedUrl] }));
      toast.success("✅ Image uploaded successfully");
    } catch (error: any) {
      console.error("❌ Image upload failed:", error);
      toast.error(error.message || "Failed to upload image");
      // Keep preview but don't set to product images
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    const img = p.images?.[0] || p.image_url || preview || "";
    // Avoid saving base64 representations to database
    const finalImg = img.startsWith('data:image/') ? '' : img;
    onSave({ ...p, image_url: finalImg, images: [finalImg] });
    // Reset saving state after save completes
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()} style={{ border: "1px solid var(--accent)" }}>
        {/* Header with back button */}
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-950">
          <button onClick={onCancel} className="p-1 hover:opacity-70 transition" title="Back">
            <ChevronLeft size={20} style={{ color: "var(--accent)" }} />
          </button>
          <h3 className="uppercase tracking-wider flex-1" style={{ fontWeight: 600, color: "var(--accent)", fontSize: "14px" }}>{p.id ? "Edit" : "Add"} Product</h3>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 h-40 flex items-center justify-center cursor-pointer"
              onClick={() => !uploading && fileRef.current?.click()} style={{ border: "2px dashed var(--accent)", opacity: uploading ? 0.6 : 1, cursor: uploading ? 'wait' : 'pointer' }}>
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" onError={() => setPreview("")} />
              ) : (
                <div className="text-center"><ImageIcon size={32} className="mx-auto mb-2" style={{ color: "var(--accent)" }} /><div className="text-sm" style={{ color: "var(--accent)" }}>Click to upload</div></div>
              )}
              <button type="button" onClick={e => { e.stopPropagation(); !uploading && fileRef.current?.click(); }}
                className="absolute bottom-2 right-2 px-2 py-1 text-xs rounded flex items-center gap-1"
                style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", opacity: uploading ? 0.5 : 1 }} disabled={uploading}><Upload size={10} /> {uploading ? "Uploading..." : "Device"}</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            <input value={p.name} onChange={e => setP({ ...p, name: e.target.value })} placeholder="Product Name" className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
            <input type="number" value={p.price} onChange={e => setP({ ...p, price: Number(e.target.value) })} placeholder="Price (₹)" className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
            <select value={p.category} onChange={e => setP({ ...p, category: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) })} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent">
              {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {/* Featured Toggle */}
            <button
              type="button"
              onClick={() => setP((prev: Product) => ({ ...prev, featured: !prev.featured }))}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
              style={p.featured
                ? { background: "var(--accent-grad)", color: "var(--accent-fg)", border: "1px solid var(--accent)" }
                : { border: "1px solid var(--accent)", color: "var(--accent)" }}>
              <span className="flex items-center gap-2 text-sm uppercase tracking-wider" style={{ fontWeight: 600 }}>
                <span>★</span> Show in Featured Section
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: p.featured ? "rgba(255,255,255,0.25)" : "var(--accent-grad)", color: p.featured ? "inherit" : "var(--accent-fg)", fontWeight: 700 }}>
                {p.featured ? "ON" : "OFF"}
              </span>
            </button>
            {/* Sizes editor */}
            <div className="rounded-xl p-3 space-y-2" style={{ border: "1px solid var(--accent)" }}>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--accent)", fontWeight: 600 }}>Sizes</div>
              {/* Existing size chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {p.sizes.map((s: string) => (
                  <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", fontWeight: 600 }}>
                    {s}
                    <button type="button" onClick={() => setP({ ...p, sizes: p.sizes.filter((x: string) => x !== s) })}
                      className="ml-0.5 hover:opacity-70 transition leading-none">×</button>
                  </span>
                ))}
                {p.sizes.length === 0 && <span className="text-xs text-neutral-400">No sizes added yet</span>}
              </div>
              {/* Quick-add preset sizes */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Quick Add</div>
                <div className="flex flex-wrap gap-1">
                  {["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "7", "8", "9", "10", "11", "One"].map(s => (
                    <button key={s} type="button"
                      onClick={() => { if (!p.sizes.includes(s)) setP({ ...p, sizes: [...p.sizes, s] }); }}
                      disabled={p.sizes.includes(s)}
                      className="text-[10px] px-2 py-0.5 rounded-full border transition"
                      style={{
                        border: "1px solid var(--accent)",
                        background: p.sizes.includes(s) ? "var(--accent-grad)" : "transparent",
                        color: p.sizes.includes(s) ? "var(--accent-fg)" : "var(--accent-soft)",
                        opacity: p.sizes.includes(s) ? 0.5 : 1,
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Custom size input */}
              <SizeCustomInput onAdd={(s: string) => { if (s && !p.sizes.includes(s)) setP({ ...p, sizes: [...p.sizes, s] }); }} />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-2 p-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 sticky bottom-0 bg-white dark:bg-neutral-950">
          <button onClick={onCancel} disabled={saving || uploading} className="flex-1 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm uppercase tracking-wider hover:opacity-70 transition disabled:opacity-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 py-2 rounded-lg text-sm uppercase tracking-wider transition disabled:opacity-50"
            style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}
          >
            {saving ? "Saving..." : uploading ? "Uploading..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Category Editor ─────────────────── */
function CategoryEditor({ category, onSave, onCancel, notifyTabsToRefresh }: any) {
  const [c, setC] = useState<Category>({ ...category });
  const [preview, setPreview] = useState(category.img || "");
  const [imageUrl, setImageUrl] = useState(category.img || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const url = await fileToDataURL(file);
    setPreview(url);

    // Upload file in background
    setUploading(true);
    try {
      const uploadedUrl = await adminService.uploadImage(file);
      setImageUrl(uploadedUrl);
      setC((prev: Category) => ({ ...prev, img: uploadedUrl }));
      toast.success("✅ Image uploaded successfully");
    } catch (error: any) {
      console.error("❌ Image upload failed:", error);
      toast.error(error.message || "Failed to upload image");
      // Keep the preview
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    const img = c.img || imageUrl || preview || '';
    // Avoid saving base64 representations to database
    const finalImg = img.startsWith('data:image/') ? '' : img;
    onSave({ ...c, img: finalImg });
    // Reset saving state after save completes
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-sm w-full flex flex-col" onClick={e => e.stopPropagation()} style={{ border: "1px solid var(--accent)" }}>
        {/* Header with back button */}
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <button onClick={onCancel} className="p-1 hover:opacity-70 transition" title="Back">
            <ChevronLeft size={20} style={{ color: "var(--accent)" }} />
          </button>
          <h3 className="uppercase tracking-wider flex-1" style={{ fontWeight: 600, color: "var(--accent)", fontSize: "14px" }}>{c.id ? "Edit" : "Add"} Category</h3>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 h-36 flex items-center justify-center cursor-pointer"
              onClick={() => !uploading && fileRef.current?.click()} style={{ border: "2px dashed var(--accent)", opacity: uploading ? 0.6 : 1, cursor: uploading ? 'wait' : 'pointer' }}>
              {preview ? <img src={preview} className="w-full h-full object-cover" onError={() => setPreview("")} />
                : <div className="text-center"><ImageIcon size={28} className="mx-auto mb-1" style={{ color: "var(--accent)" }} /><div className="text-xs" style={{ color: "var(--accent)" }}>Upload image</div></div>}
              <button type="button" onClick={e => { e.stopPropagation(); !uploading && fileRef.current?.click(); }}
                className="absolute bottom-2 right-2 px-2 py-1 text-xs rounded flex items-center gap-1"
                style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", opacity: uploading ? 0.5 : 1 }} disabled={uploading}><Upload size={10} /> {uploading ? "Uploading..." : "Upload"}</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            <input value={c.name} onChange={e => setC({ ...c, name: e.target.value })} placeholder="Category Name"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-2 p-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <button onClick={onCancel} disabled={saving || uploading} className="flex-1 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm uppercase tracking-wider hover:opacity-70 transition disabled:opacity-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 py-2 rounded-lg text-sm uppercase tracking-wider transition disabled:opacity-50"
            style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}
          >
            {saving ? "Saving..." : uploading ? "Uploading..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Banner Editor ─────────────────── */
function BannerEditor({ bannerImg, setBannerImg, notifyTabsToRefresh }: any) {
  const [activeTab, setActiveTab] = useState<"desktop" | "mobile">("desktop");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // States initialized from the current configuration
  const config = parseBannerConfig(bannerImg);

  const [desktopUrl, setDesktopUrl] = useState(config.desktop_url);
  const [mobileUrl, setMobileUrl] = useState(config.mobile_url);
  
  const [desktopZoom, setDesktopZoom] = useState(config.desktop_zoom);
  const [desktopX, setDesktopX] = useState(config.desktop_x);
  const [desktopY, setDesktopY] = useState(config.desktop_y);

  const [mobileZoom, setMobileZoom] = useState(config.mobile_zoom);
  const [mobileX, setMobileX] = useState(config.mobile_x);
  const [mobileY, setMobileY] = useState(config.mobile_y);

  // Sync state with bannerImg prop updates (e.g., from other tabs)
  useEffect(() => {
    const updated = parseBannerConfig(bannerImg);
    setDesktopUrl(updated.desktop_url);
    setMobileUrl(updated.mobile_url);
    setDesktopZoom(updated.desktop_zoom);
    setDesktopX(updated.desktop_x);
    setDesktopY(updated.desktop_y);
    setMobileZoom(updated.mobile_zoom);
    setMobileX(updated.mobile_x);
    setMobileY(updated.mobile_y);
  }, [bannerImg]);

  const saveSettings = async (override?: Partial<BannerConfig>) => {
    setUploading(true);
    try {
      const finalConfig: BannerConfig = {
        desktop_url: override?.desktop_url ?? desktopUrl,
        mobile_url: override?.mobile_url ?? mobileUrl,
        desktop_zoom: override?.desktop_zoom ?? desktopZoom,
        desktop_x: override?.desktop_x ?? desktopX,
        desktop_y: override?.desktop_y ?? desktopY,
        mobile_zoom: override?.mobile_zoom ?? mobileZoom,
        mobile_x: override?.mobile_x ?? mobileX,
        mobile_y: override?.mobile_y ?? mobileY,
      };

      const serialized = JSON.stringify(finalConfig);
      setBannerImg(serialized);
      await adminService.saveBannerToSettings(serialized);
      notifyTabsToRefresh();
      toast.success("✅ Banner settings saved permanently!");
    } catch (error: any) {
      console.error("❌ Failed to save banner settings:", error);
      toast.error(error.message || "Failed to save banner settings");
    } finally {
      setUploading(false);
    }
  };

  const applyUrl = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }
    
    if (activeTab === "desktop") {
      setDesktopUrl(urlInput);
      await saveSettings({ desktop_url: urlInput });
    } else {
      setMobileUrl(urlInput);
      await saveSettings({ mobile_url: urlInput });
    }
    setUrlInput("");
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadedUrl = await adminService.uploadImage(file);
      if (activeTab === "desktop") {
        setDesktopUrl(uploadedUrl);
        await saveSettings({ desktop_url: uploadedUrl });
      } else {
        setMobileUrl(uploadedUrl);
        await saveSettings({ mobile_url: uploadedUrl });
      }
    } catch (error: any) {
      console.error("❌ Image upload failed:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleUpload(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      await handleUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Tab Selector */}
      <div className="flex gap-2 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab("desktop")}
          className="flex-1 py-2.5 text-xs uppercase tracking-wider font-semibold rounded-lg transition-all"
          style={activeTab === "desktop" ? { background: "var(--accent-grad)", color: "var(--accent-fg)" } : { color: "var(--accent)" }}
        >
          🖥️ Desktop Banner Settings
        </button>
        <button
          onClick={() => setActiveTab("mobile")}
          className="flex-1 py-2.5 text-xs uppercase tracking-wider font-semibold rounded-lg transition-all"
          style={activeTab === "mobile" ? { background: "var(--accent-grad)", color: "var(--accent-fg)" } : { color: "var(--accent)" }}
        >
          📱 Mobile Banner Settings
        </button>
      </div>

      {/* Preview Section */}
      <div className="space-y-3">
        <div className="text-sm uppercase tracking-wider font-semibold" style={{ color: "var(--accent)" }}>
          {activeTab === "desktop" ? "Desktop Preview (Wide Layout)" : "Mobile Preview (Mobile Screen Aspect)"}
        </div>
        
        <div 
          className={`relative rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center transition-all duration-300 ${
            activeTab === "desktop" ? "w-full h-52 md:h-64" : "w-full max-w-[360px] h-[256px] mx-auto"
          }`}
          style={{ border: "2px solid var(--accent)" }}
        >
          <img 
            src={activeTab === "desktop" ? (desktopUrl || CONFIG.FALLBACK_BANNER) : (mobileUrl || CONFIG.FALLBACK_BANNER)} 
            className="w-full h-full object-cover transition-all duration-300"
            style={{
              objectPosition: `${activeTab === "desktop" ? desktopX : mobileX}% ${activeTab === "desktop" ? desktopY : mobileY}%`,
              transform: `scale(${(activeTab === "desktop" ? desktopZoom : mobileZoom) / 100})`,
              transformOrigin: `${activeTab === "desktop" ? desktopX : mobileX}% ${activeTab === "desktop" ? desktopY : mobileY}%`
            }}
            alt="Preview" 
            onError={(e: any) => { e.target.src = CONFIG.FALLBACK_BANNER; }} 
          />
          <div className="absolute inset-0 bg-black/15 pointer-events-none flex items-end p-3">
            <span className="px-2.5 py-1 rounded bg-black/60 text-[9px] uppercase tracking-widest text-white border" style={{ borderColor: "var(--accent)" }}>
              {uploading ? "Updating..." : "Live Frame Preview"}
            </span>
          </div>
        </div>
      </div>

      {/* Adjustments Panel */}
      <div className="p-5 rounded-2xl border bg-neutral-50 dark:bg-neutral-900/40 space-y-4 shadow-sm" style={{ borderColor: "var(--accent)" }}>
        <div className="text-xs uppercase tracking-widest font-bold flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
          <span>⚙️</span> Adjust Image Layout ({activeTab === "desktop" ? "Desktop" : "Mobile"})
        </div>
        
        {/* Zoom Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span>🔍 Zoom Level</span>
            <span style={{ color: "var(--accent)" }}>{activeTab === "desktop" ? desktopZoom : mobileZoom}%</span>
          </div>
          <input 
            type="range" 
            min="100" 
            max="250" 
            value={activeTab === "desktop" ? desktopZoom : mobileZoom}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (activeTab === "desktop") setDesktopZoom(val);
              else setMobileZoom(val);
            }}
            className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* X Offset Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span>↔️ Left / Right Position</span>
            <span style={{ color: "var(--accent)" }}>{activeTab === "desktop" ? desktopX : mobileX}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={activeTab === "desktop" ? desktopX : mobileX}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (activeTab === "desktop") setDesktopX(val);
              else setMobileX(val);
            }}
            className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Y Offset Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span>↕️ Up / Down Position</span>
            <span style={{ color: "var(--accent)" }}>{activeTab === "desktop" ? desktopY : mobileY}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={activeTab === "desktop" ? desktopY : mobileY}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (activeTab === "desktop") setDesktopY(val);
              else setMobileY(val);
            }}
            className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
        
        <button
          onClick={() => saveSettings()}
          disabled={uploading}
          className="w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition disabled:opacity-50 mt-2 hover:scale-[1.01] active:scale-95"
          style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}
        >
          💾 Apply and Save Adjustments
        </button>
      </div>

      {/* Upload/URL controls */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Paste URL */}
        <div className="p-4 rounded-2xl border space-y-3 bg-neutral-50 dark:bg-neutral-900/40" style={{ borderColor: "var(--accent)" }}>
          <label className="text-xs uppercase tracking-widest font-bold block" style={{ color: "var(--accent)" }}>
            🔗 Paste Image URL ({activeTab === "desktop" ? "Desktop" : "Mobile"})
          </label>
          <input
            type="text"
            placeholder={CONFIG.PLACEHOLDER_IMG}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyUrl(); }}
            disabled={uploading}
            className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={applyUrl}
            disabled={uploading || !urlInput.trim()}
            className="w-full py-2.5 text-xs uppercase tracking-wider font-semibold rounded-lg disabled:opacity-50"
            style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>
            Set Image from URL
          </button>
        </div>

        {/* Upload File */}
        <div 
          className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer flex flex-col items-center justify-center transition-all bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100/50 hover:border-amber-500" 
          style={{ borderColor: "var(--accent)", opacity: uploading ? 0.6 : 1, cursor: uploading ? 'wait' : 'pointer' }}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload size={24} className="mb-2 text-neutral-500" style={{ color: "var(--accent)" }} />
          <div className="uppercase tracking-widest text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>Upload File ({activeTab === "desktop" ? "Desktop" : "Mobile"})</div>
          <div className="text-[10px] text-neutral-400">{uploading ? "Uploading..." : "Click or drag & drop • PNG, JPG, WEBP"}</div>
        </div>
      </div>
      
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
    </div>
  );
}

/* ─────────────────── Footer ─────────────────── */
function Footer({ onNavigate }: any) {
  return (
    <footer className="bg-neutral-100 dark:bg-neutral-900 mt-12 py-10 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src={logoImg} alt="Men's Hub" className="h-10 w-10 rounded-lg object-cover object-top" style={{ boxShadow: "0 0 0 1.5px var(--accent)" }} />
            <span className="tracking-[0.25em] uppercase" style={{ fontWeight: 700, color: "var(--accent)" }}>Men's Hub</span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Premium MensHub for the modern gentleman.
            Style that defines confidence.</p>
        </div>
        <div>
          <h3 className="uppercase tracking-wider mb-3 font-semibold text-neutral-800 dark:text-neutral-200">Customer Care</h3>
          <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <button onClick={() => onNavigate({ name: "aboutus" })} className="hover:underline cursor-pointer text-left block text-neutral-700 dark:text-neutral-300">About Us</button>
            <button onClick={() => onNavigate({ name: "policies" })} className="hover:underline cursor-pointer text-left block text-neutral-700 dark:text-neutral-300">Policies</button>
            <a href={CONFIG.MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:underline cursor-pointer"><MapPin size={14} className="mt-0.5 shrink-0" /> 13, Aruppukottai Main Rd, South Gate, Mahalipatti, Madurai, Tamil Nadu 625001, India</a>
            <a href="tel:+919524097865" className="flex items-center gap-2 hover:underline"><Phone size={14} className="shrink-0" /> +91 95240 97865</a>
            <a href="mailto:menshubadmin01@gmail.com" className="flex items-center gap-2 hover:underline"><Mail size={14} className="shrink-0" /> menshubadmin01@gmail.com</a>
          </div>
        </div>
        <div>
          <h3 className="uppercase tracking-wider mb-3 font-semibold text-neutral-800 dark:text-neutral-200">Follow</h3>
          <div className="flex gap-3">
            <a
              href={CONFIG.INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer"
              style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; (e.currentTarget as HTMLAnchorElement).style.border = "1px solid transparent"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)"; (e.currentTarget as HTMLAnchorElement).style.border = "1px solid var(--accent)"; }}>
              <Instagram size={16} />
            </a>
            <a
              href="https://wa.me/message/KDFFRMYFEDTPI1"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer"
              style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#25D366"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; (e.currentTarget as HTMLAnchorElement).style.border = "1px solid #25D366"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)"; (e.currentTarget as HTMLAnchorElement).style.border = "1px solid var(--accent)"; }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 text-center">© 2026 Men's Hub. All rights reserved.</div>
    </footer>
  );
}

/* ─────────────────── Bottom Nav ─────────────────── */
function BottomNav({ active, onHome, onCategories, onWishlist, onCart, onOrders, toggleDark, dark, cartCount }: any) {
  const items = [
    { key: "home", icon: Home, label: "Home", action: onHome },
    { key: "categories", icon: Grid3x3, label: "Category", action: onCategories },
    { key: "wishlist", icon: Heart, label: "Wishlist", action: onWishlist },
    { key: "cart", icon: ShoppingBag, label: "Cart", action: onCart, badge: cartCount },
    { key: "orders", icon: Package, label: "Orders", action: onOrders },
    { key: "dark", icon: dark ? Sun : Moon, label: dark ? "Light" : "Dark", action: toggleDark },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-neutral-950/95 backdrop-blur flex gap-1 px-1 py-1.5" style={{ borderTop: "1px solid var(--accent)" }}>
      {items.map(it => {
        const isActive = active === it.key;
        const Icon = it.icon;
        return (
          <button key={it.key} onClick={it.action}
            className="flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg transition active:scale-95 relative"
            aria-label={it.label}
            style={{
              border: "1px solid var(--accent)",
              background: isActive ? "var(--accent-grad)" : "transparent",
              color: isActive ? "var(--accent-fg)" : "var(--accent)",
              boxShadow: isActive ? "0 0 0 1.5px var(--accent), 0 4px 16px var(--accent-glow)" : "none",
            }}>
            <Icon size={16} />
            {it.badge > 0 && (
              <span className="absolute top-0.5 right-1 text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center"
                style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>{it.badge}</span>
            )}
            <span className="text-[9px] uppercase tracking-wider leading-none">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
