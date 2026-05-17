// Dummy comment to trigger Vercel rebuild
import { useState, useMemo, useEffect, useRef } from "react";
import { cartService } from "../services/cartService";
import { wishlistService } from "../services/wishlistService";

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
import * as adminService from "../services/adminService";
import {
  Search, ShoppingBag, User, Heart, Home, Grid3x3, Package,
  Menu, X, Plus, Minus, Trash2, ChevronRight, MapPin, Phone,
  Instagram, ChevronLeft, Star, Filter, Check,
  Bell, Upload, Edit2, ImageIcon, ShoppingCart, Package2, Sun, Moon, Eye, EyeOff,
  Truck, Mail
} from "lucide-react";

/* ─────────────────── Types ─────────────────── */
type Category = { id: number; name: string; img: string };
type Product  = { id: string; name: string; price: number; category: string | number; image_url?: string; category_image?: string; banner_image?: string; images?: string[]; popularity: number; sizes: string[]; featured?: boolean };
type CartItem = { product: Product; size: string; qty: number };
type OrderNotification = {
  id: string;
  order: string;
  order_number?: string;
  customer_name: string;
  total_amount: string;
  items_summary: { name: string; qty: number; size: string }[];
  created_at: string;
  is_read: boolean;
};
type Page =
  | { name: "home" } | { name: "category"; id: string } | { name: "categories" }
  | { name: "product"; id: string } | { name: "search"; query: string }
  | { name: "cart" } | { name: "checkout" } | { name: "login" }
  | { name: "wishlist" } | { name: "orders" } | { name: "admin" }
  | { name: "notifications" } | { name: "allproducts" };

/* ─────────────────── Utility ─────────────────── */
function fileToDataURL(file: File): Promise<string> {
  return new Promise(res => { 
    const r = new FileReader(); 
    r.onload = e => res(e.target?.result as string); 
    r.readAsDataURL(file); 
  });
}

export default function App(): React.ReactElement {
  // Call this after any admin update (product/category/banner)
  const notifyTabsToRefresh = () => {
    localStorage.setItem('refreshData', Date.now().toString());
  };

  /* ─────────────────── State ─────────────────── */
  const [page, setPage] = useState<Page>({ name: "home" });
  const [history, setHistory] = useState<Page[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<{ name: string; email?: string; isAdmin: boolean } | null>(null);
  const [migrationDone, setMigrationDone] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bannerImg, setBannerImg] = useState("");
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null);
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === 'true');

  /* ─────────────────── Actions ─────────────────── */
  // Refresh data from database after admin changes
  const refreshDataFromDB = async () => {
    console.log('🔄 Refreshing data from database...');
    try {
      const [dbProducts, dbCategories, dbBanner, dbNotifications] = await Promise.all([
        adminService.loadProductsFromDB(true),
        adminService.loadCategoriesFromDB(true),
        adminService.loadBannerFromSettings(true),
        user?.isAdmin ? adminService.loadNotificationsFromDB() : Promise.resolve([])
      ]);
      if (dbProducts) {
        setProducts(dbProducts);
        console.log('✅ Products refreshed from DB');
      }
      if (dbCategories) {
        setCategories(dbCategories);
        console.log('✅ Categories refreshed from DB');
      }
      if (dbBanner !== undefined) {
        setBannerImg(dbBanner || "");
        console.log('✅ Banner refreshed from DB');
      }
      if (dbNotifications) {
        setNotifications(dbNotifications);
        console.log('✅ Notifications refreshed from DB');
      }
    } catch (err) {
      console.warn("Could not refresh data from database:", err);
    }
  };

  const navigate = (p: Page) => { setHistory((h: Page[]) => [...h, page]); setPage(p); window.scrollTo(0, 0); };
  const back = () => setHistory((h: Page[]) => { if (!h.length) return h; const prev = h[h.length - 1]; setPage(prev); return h.slice(0, -1); });

  /* ─────────────────── Effects ─────────────────── */
  // Listen for cross-tab updates
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;

      if (e.key === 'refreshData') {
        console.log('📢 Cross-tab: Refresh signal received');
        refreshDataFromDB();
      }

      if (e.key === 'user') {
        console.log('📢 Cross-tab: User state changed');
        if (e.newValue) {
          try { setUser(JSON.parse(e.newValue)); } catch {}
        } else {
          setUser(null);
        }
      }

      if (e.key === 'authToken') {
        console.log('📢 Cross-tab: Auth token changed');
        if (!e.newValue && user) {
          setUser(null);
        }
        refreshDataFromDB();
      }

      if (e.key === 'cart') {
        if (e.newValue) {
          try { 
            const newCart = JSON.parse(e.newValue);
            setCart(prev => JSON.stringify(prev) === e.newValue ? prev : newCart);
          } catch {}
        }
      }

      if (e.key === 'wishlist') {
        if (e.newValue) {
          try {
            const newWish = JSON.parse(e.newValue);
            setWishlist(prev => JSON.stringify(prev) === e.newValue ? prev : newWish);
          } catch {}
        }
      }

      if (e.key === 'dark') {
        setDark(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]); // refreshDataFromDB is stable enough as it's not wrapped in useCallback yet, but we can add it if needed

  // Load all data on app startup
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) try { setCart(JSON.parse(savedCart)); } catch {}
    
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) try { setWishlist(JSON.parse(savedWishlist)); } catch {}
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) try { setUser(JSON.parse(savedUser)); } catch {}

    refreshDataFromDB();
  }, []);

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  // Admin Notification Polling
  useEffect(() => {
    if (!user?.isAdmin) return;

    const poll = async () => {
      try {
        const freshNotifications = await adminService.loadNotificationsFromDB();
        if (freshNotifications && freshNotifications.length > notifications.length) {
          const newCount = freshNotifications.filter(n => !n.is_read).length;
          const oldCount = notifications.filter(n => !n.is_read).length;
          
          if (newCount > oldCount) {
            // New unread order!
            toast.success("🔔 New Order Received!", { icon: '📦', duration: 5000 });
            // Play a subtle notification sound
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch {}
          }
        }
        if (freshNotifications) setNotifications(freshNotifications);
      } catch (err) {
        console.warn("Poll failed:", err);
      }
    };

    const interval = setInterval(poll, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [user, notifications.length]);
  
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      if (user.email) localStorage.setItem('userEmail', user.email);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem('dark', dark.toString());
  }, [dark]);

  // Run migration after login
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





  const requireAuth = (action: () => void) => {
    if (!user) { toast.error("Please login first"); navigate({ name: "login" }); return; }
    action();
  };

  const buyNow = (product: Product, size: string) => {
    requireAuth(() => {
      setCheckoutItem({ product, size, qty: 1 });
      navigate({ name: "checkout" });
    });
  };

  const addToCart = (product: Product, size: string) => {
    requireAuth(() => {
      setCart((c: CartItem[]) => {
        const idx = c.findIndex((i: CartItem) => i.product.id === product.id && i.size === size);
        if (idx > -1) {
          const copy = [...c];
          const newQty = Math.min(copy[idx].qty + 1, 5);
          if (newQty === copy[idx].qty && newQty === 5) {
            toast.error("Stock limit reached (Max 5 per item)");
            return c;
          }
          copy[idx] = { ...copy[idx], qty: newQty };
          toast.success(`Updated ${product.name} quantity in cart ✓`);
          return copy;
        }
        toast.success(`Added ${product.name} to cart ✓`);
        return [...c, { product, size, qty: 1 }];
      });
    });
  };

  const toggleWishlist = (id: string) => {
    requireAuth(() => setWishlist((w: string[]) => w.includes(id) ? w.filter((x: string) => x !== id) : [...w, id]));
  };

  /* Called after customer places order — fires admin notification */
  const handleOrderPlaced = (items?: CartItem[], total?: number) => {
    const finalItems = items || cart;
    const finalTotal = total !== undefined ? total : cartTotal;
    
    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const notification: OrderNotification = {
      id: Date.now().toString(),
      order: orderId,
      customer_name: user?.name || "Guest",
      total_amount: finalTotal.toString(),
      items_summary: finalItems.map((i: CartItem) => ({ name: i.product.name, qty: i.qty, size: i.size })),
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setNotifications((n) => [notification, ...n]);
    if (!items) setCart([]); // Only clear cart if it was a cart checkout
    toast.success(`Order ${orderId} placed! 🎉`);
    navigate({ name: "orders" });
  };

  const markAllRead = async () => {
    try {
      await adminService.markAllNotificationsAsRead();
      setNotifications((n) => n.map((x) => ({ ...x, is_read: true })));
      toast.success("All marked as read");
    } catch (e) { toast.error("Failed to mark all as read"); }
  };

  const markRead = async (id: string, orderNumber?: string) => {
    try {
      await adminService.markNotificationAsRead(id);
      setNotifications((n) => n.map((x) => x.id === id ? { ...x, is_read: true } : x));
      // Navigate to admin orders
      localStorage.setItem('admin_initial_tab', 'orders');
      if (orderNumber) localStorage.setItem('admin_initial_order', orderNumber);
      setPage({ name: 'admin' });
    } catch (e) { console.error(e); }
  };
  const deleteNotif = (id: string) => setNotifications((n) => n.filter((x) => x.id !== id));

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const accentVars = {
    ["--accent" as any]:      dark ? "#d4af37" : "#1e3a8a",
    ["--accent-soft" as any]: dark ? "#b8860b" : "#1e40af",
    ["--accent-grad" as any]: dark ? "linear-gradient(135deg,#d4af37 0%,#f5d97a 50%,#b8860b 100%)"
                                   : "linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#1e3a8a 100%)",
    ["--accent-fg" as any]:   dark ? "#0a0a0a" : "#ffffff",
    ["--accent-glow" as any]: dark ? "rgba(212,175,55,0.65)" : "rgba(30,58,138,0.30)",
  } as React.CSSProperties;

  return (
    <div className={`min-h-screen w-full ${dark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900"} transition-colors`} style={accentVars}>
      <Toaster position="top-right" richColors duration={1000} />

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
            onBuy={buyNow} onAddToCart={addToCart} onWish={toggleWishlist} wishlist={wishlist}
            onAllCategories={() => navigate({ name: "categories" })} />
        )}
        {page.name === "categories" && (
          <CategoriesPage categories={categories}
            onCategory={(id: string) => navigate({ name: "category", id })} onBack={back} />
        )}
        {page.name === "category" && (() => {
          const catId = (page as any).id;
          const cat = categories.find((c: Category) => String(c.id) === String(catId));
          return (
            <ListingPage
              title={cat?.name || "Products"}
              products={products.filter((p: Product) => {
                const pCat = String(p.category || "").toLowerCase();
                const cName = String(cat?.name || "").toLowerCase();
                const cId = String(cat?.id || "").toLowerCase();
                return pCat === cId || (cat && pCat === cName) || (pCat === "all");
              })}
              onProduct={(id: string) => navigate({ name: "product", id: id })}
              onBuy={buyNow} onAddToCart={addToCart} onWish={toggleWishlist} wishlist={wishlist} onBack={back} />
          );
        })()}
        {page.name === "search" && (
          <ListingPage
            title={(page as any).query ? `Results for "${(page as any).query}"` : "All Products"}
            products={products.filter((p: Product) => p.name.toLowerCase().includes(((page as any).query || "").toLowerCase()))}
            onProduct={(id: string) => navigate({ name: "product", id })}
            onBuy={buyNow} onWish={toggleWishlist} wishlist={wishlist} onBack={back} />
        )}
        {page.name === "product" && (() => {
          const prod = products.find((p: Product) => String(p.id) === String((page as any).id));
          if (!prod) return <div className="py-20 text-center">Product not found</div>;
          return (
            <ProductPage product={prod} onBuy={buyNow} onAddToCart={addToCart} onWish={toggleWishlist} wishlist={wishlist} onBack={back} />
          );
        })()}
        {page.name === "cart" && (
          <CartPage cart={cart} setCart={setCart}
            onCheckout={() => requireAuth(() => navigate({ name: "checkout" }))}
            onBack={back} total={cartTotal} />
        )}
        {page.name === "checkout" && (
          <CheckoutPage 
            cart={checkoutItem ? [checkoutItem] : cart} 
            total={checkoutItem ? checkoutItem.product.price : cartTotal} 
            user={user} 
            onPlaced={() => {
              const items = checkoutItem ? [checkoutItem] : undefined;
              const total = checkoutItem ? checkoutItem.product.price : undefined;
              if (checkoutItem) setCheckoutItem(null);
              handleOrderPlaced(items, total);
            }} 
            onBack={() => {
              if (checkoutItem) setCheckoutItem(null);
              back();
            }} 
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
          <NotificationsPage notifications={notifications} markRead={markRead} markAllRead={markAllRead} onBack={back} />
        )}
        {page.name === "allproducts" && (
          <AllProductsPage
            products={products}
            categories={categories}
            onProduct={(id: string) => navigate({ name: "product", id })}
            onBuy={buyNow} onAddToCart={addToCart} onWish={toggleWishlist} wishlist={wishlist} onBack={back}
            onCategory={(id: string) => navigate({ name: "category", id })} />
        )}
        {page.name === "admin" && user?.isAdmin && (
          <AdminPanel
            products={products} setProducts={setProducts}
            categories={categories} setCategories={setCategories}
            bannerImg={bannerImg} setBannerImg={setBannerImg}
            notifyTabsToRefresh={notifyTabsToRefresh}
            onBack={() => { refreshDataFromDB(); back(); }} />
        )}
      </main>

      <Footer />
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

function IconBtn({ children, onClick, className = "" }: any) {
  return (
    <button onClick={onClick}
      className={`relative w-9 h-9 rounded-md flex items-center justify-center transition ${className}`}
      style={{ border: "1px solid var(--accent)", color: "var(--accent-soft)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-grad)"; e.currentTarget.style.color = "var(--accent-fg)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent-soft)"; }}>
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
        <button className="md:hidden p-2 -ml-2" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>

        {/* Logo */}
        <button onClick={props.onLogo} className="flex items-center gap-2 group shrink-0">
          <img src={logoImg} alt="Men's Hub" className="h-11 w-11 rounded-lg object-cover object-top" style={{ boxShadow: "0 0 0 1.5px var(--accent)" }} />
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
          <button onClick={props.onSearch} className="w-full flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-neutral-900 dark:hover:border-white transition">
            <Search size={16} /> <span className="text-sm">Search...</span>
          </button>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Dark mode — desktop */}
          <IconBtn onClick={props.toggleDark} className="hidden md:inline-flex">
            <span style={{ fontSize: 14 }}>{dark ? "☀" : "☾"}</span>
          </IconBtn>

          {/* Search — mobile */}
          <IconBtn onClick={props.onSearch} className="md:hidden"><Search size={18} /></IconBtn>

          {/* Wishlist — desktop */}
          <IconBtn onClick={props.onWishlist} className="hidden md:inline-flex">
            <Heart size={18} />
          </IconBtn>

          {/* Bell — desktop, admin only */}
          {user?.isAdmin && (
            <div className="relative hidden md:inline-flex">
              <IconBtn onClick={props.onNotifications}>
                <Bell size={18} />
              </IconBtn>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] rounded-full flex items-center justify-center z-10"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700 }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          )}

          {/* Profile dropdown */}
          <div className="relative">
            <IconBtn onClick={() => setProfileOpen((o: boolean) => !o)}><User size={18} /></IconBtn>
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
                          {/* Notifications with unread badge */}
                          <button onClick={() => { setProfileOpen(false); props.onNotifications(); }}
                            className="w-full text-left px-3 py-2 text-sm uppercase tracking-wider rounded-md transition mb-1 flex items-center justify-between"
                            style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-grad)"; e.currentTarget.style.color = "var(--accent-fg)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}>
                            <span className="flex items-center gap-2"><Bell size={13} /> Notifications</span>
                            {unreadCount > 0 && (
                              <span className="min-w-[20px] h-5 px-1.5 text-[10px] rounded-full flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700 }}>
                                {unreadCount}
                              </span>
                            )}
                          </button>
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
          <IconBtn data-cy="cart-btn" onClick={props.onCart}>
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
                { label: "Home",        action: props.onLogo },
                { label: "Products",    action: props.onProducts },
                { label: "Categories",  action: props.onCategories },
                { label: "Wishlist",    action: props.onWishlist },
                { label: "Cart",        action: props.onCart },
                { label: `🔔 Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`, action: props.onNotifications },
                { label: "Admin Panel", action: props.onAdmin },
                { label: `${dark ? "Light" : "Dark"} Mode`, action: props.toggleDark },
              ] : [
                { label: "Home",       action: props.onLogo },
                { label: "Categories", action: props.onCategories },
                { label: "Wishlist",   action: props.onWishlist },
                { label: "Cart",       action: props.onCart },
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
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="mt-3">
          {q && suggestions.length === 0 && <div className="py-8 text-center text-neutral-500">No products found</div>}
          {suggestions.map((p: Product) => (
            <button key={p.id} onClick={() => onSelect(p)} className="w-full flex items-center gap-3 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded">
              <img src={(Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : (p.image_url || '')} className="w-12 h-12 object-cover rounded" />
              <div className="text-left flex-1"><div>{p.name}</div><div className="text-sm text-neutral-500">₹{p.price}</div></div>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Home Page ─────────────────── */
function HomePage({ products, categories, bannerImg, onCategory, onProduct, onBuy, onAddToCart, onWish, wishlist, onAllCategories }: any) {
  const visibleCats = categories.slice(0, 5);
  const hasMore = categories.length > 5;
  const fallbackBanner = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=500&fit=crop";

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Hero Banner — image only, no text */}
      <section className="relative my-6 rounded-2xl overflow-hidden h-64 md:h-96 bg-neutral-900">
        <img src={bannerImg || fallbackBanner} className="absolute inset-0 w-full h-full object-cover" alt="Banner" onError={(e: any) => { e.target.src = fallbackBanner; }} />
      </section>

      <section className="my-8">
        <SectionTitle>Shop By Category</SectionTitle>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {/* First 5 real category tiles */}
          {visibleCats.map((c: Category) => (
            <button key={c.id} onClick={() => onCategory(c.id)} className="group">
              <div className="aspect-square overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800 transition"
                style={{ border: "1px solid var(--accent)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 2px var(--accent), 0 10px 40px var(--accent-glow)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px var(--accent)"; }}>
                <img src={c.img || "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=300&h=300&fit=crop"} className="w-full h-full object-cover group-hover:scale-105 transition" />
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
        </div>
      </section>

      <section className="my-10">
        <SectionTitle>Featured</SectionTitle>
        {products.filter((p: Product) => p.featured).length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">No featured products yet. Admin can mark products as featured.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.filter((p: Product) => p.featured).map((p: Product) => (
              <ProductCard key={p.id} product={p} onProduct={onProduct} onBuy={onBuy} onAddToCart={onAddToCart} onWish={onWish} wishlist={wishlist} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─────────────────── Categories Page ─────────────────── */
function CategoriesPage({ categories, onCategory, onBack }: any) {
  const fallbackCategory = "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=300&h=300&fit=crop";
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]" style={{ fontWeight: 600 }}>All Categories</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((c: Category) => (
          <button key={c.id} onClick={() => onCategory(c.id)}
            className="group relative overflow-hidden rounded-xl aspect-[4/3] transition"
            style={{ border: "1px solid var(--accent)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent), 0 10px 40px var(--accent-glow)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent)"; }}>
            <img src={c.img || fallbackCategory} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition" onError={(e: any) => { e.target.src = fallbackCategory; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white uppercase tracking-[0.2em]" style={{ fontWeight: 600 }}>{c.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── Product Card ─────────────────── */
function ProductCard({ product, onProduct, onBuy, onAddToCart, onWish, wishlist }: any) {
  const wished = wishlist.includes(product.id);
  const isOneSize = product.sizes.length === 1 && product.sizes[0] === "One";
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? "");
  const fallbackProduct = "https://images.unsplash.com/photo-1617137968427-83c330585b41?w=500&h=600&fit=crop";
  const productImage = (Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : (product.image_url || '');
  
  return (
    <div className="group p-2 rounded-xl transition flex flex-col" style={{ border: "1px solid var(--accent)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 2px var(--accent), 0 10px 40px var(--accent-glow)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px var(--accent)"; }}>
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 cursor-pointer" onClick={() => onProduct(product.id)}>
        <img src={productImage || fallbackProduct} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" onError={(e: any) => { e.target.src = fallbackProduct; }} />
        <button onClick={e => { e.stopPropagation(); onWish(product.id); }}
          className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.95)", border: "1px solid var(--accent)" }}>
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
      {/* Action Buttons */}
      <div className="mt-2 px-1 pb-1 flex gap-2">
        <button onClick={() => onBuy(product, selectedSize)}
          className="flex-1 text-[10px] uppercase tracking-wider py-2 rounded-md transition"
          style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", fontWeight: 700 }}>
          Buy Now
        </button>
        <button onClick={() => onAddToCart(product, selectedSize)}
          className="w-10 h-9 flex items-center justify-center rounded-md transition"
          style={{ border: "1.5px solid var(--accent)", color: "var(--accent)" }}
          title="Add to Cart">
          <ShoppingBag size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── Listing Page ─────────────────── */
function ListingPage({ title, products, onProduct, onBuy, onAddToCart, onWish, wishlist, onBack }: any) {
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
        <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={20} /></button>
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
        ? <div className="py-20 text-center text-neutral-500">No products found</div>
        : <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            {filtered.slice(0, visible).map((p: Product) => (
              <ProductCard key={p.id} product={p} onProduct={onProduct} onBuy={onBuy} onAddToCart={onAddToCart} onWish={onWish} wishlist={wishlist} />
            ))}
          </div>
      }
    </div>
  );
}

/* ─────────────────── All Products Page ─────────────────── */
function AllProductsPage({ products, categories, onProduct, onBuy, onAddToCart, onWish, wishlist, onBack }: any) {
  const [activeCat, setActiveCat] = useState<string>("all");
  const [visible, setVisible] = useState(12);

  const filtered = useMemo(() => {
    if (activeCat === "all") return products;
    const cat = categories.find((c: Category) => String(c.id) === String(activeCat));
    return products.filter((p: Product) => {
      const pCat = String(p.category || "").toLowerCase();
      const cName = String(cat?.name || "").toLowerCase();
      const cId = String(cat?.id || "").toLowerCase();
      return pCat === cId || (cat && pCat === cName);
    });
  }, [products, activeCat, categories]);

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
        <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={20} /></button>
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
              <ProductCard key={p.id} product={p} onProduct={onProduct} onBuy={onBuy} onAddToCart={onAddToCart} onWish={onWish} wishlist={wishlist} />
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
function ProductPage({ product, onBuy, onAddToCart, onWish, wishlist, onBack }: any) {
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const wished = wishlist.includes(product.id);
  const fallbackProduct = "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop";
  const images = product.images && product.images.length > 0 ? product.images : [fallbackProduct];
  const validImages = images.filter((img: string) => img && img.trim() !== '');
  const displayImages = validImages.length > 0 ? validImages : [fallbackProduct];
  
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) setImgIdx((imgIdx + 1) % displayImages.length);
    if (diff < -50) setImgIdx((imgIdx - 1 + displayImages.length) % displayImages.length);
    setTouchStart(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <button onClick={onBack} className="my-4 flex items-center gap-1 text-sm"><ChevronLeft size={16} /> Back</button>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div 
            className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 rounded-xl overflow-hidden group touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img src={displayImages[imgIdx]} className="w-full h-full object-cover group-hover:scale-110 transition duration-500 pointer-events-none" onError={(e: any) => { e.target.src = fallbackProduct; }} />
            {displayImages.length > 1 && (
              <>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                  {displayImages.map((_: any, i: number) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? "bg-white w-4" : "bg-white/50"}`} />
                  ))}
                </div>
                <button onClick={() => setImgIdx((imgIdx - 1 + displayImages.length) % displayImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 flex items-center justify-center shadow-lg"><ChevronLeft size={18} /></button>
                <button onClick={() => setImgIdx((imgIdx + 1) % displayImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 flex items-center justify-center shadow-lg"><ChevronRight size={18} /></button>
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
          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button onClick={() => onBuy(product, size)} className="flex-1 py-3 uppercase tracking-wider text-sm rounded-md"
              style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", fontWeight: 700 }}>
              Buy Now
            </button>
            <button onClick={() => onAddToCart(product, size)} className="px-5 border border-neutral-300 dark:border-neutral-700 rounded-md transition hover:bg-neutral-50 dark:hover:bg-neutral-900" title="Add to Cart" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
              <ShoppingBag size={20} />
            </button>
            <button onClick={() => onWish(product.id)} className="px-5 border border-neutral-300 dark:border-neutral-700 rounded-md transition hover:bg-neutral-50 dark:hover:bg-neutral-900" style={{ borderColor: "var(--accent)" }}>
              <Heart size={20} className={wished ? "fill-red-500 text-red-500" : ""} style={{ color: wished ? undefined : "var(--accent)" }} />
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
        <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]">Cart ({cart.length})</h2>
      </div>
      <div className="space-y-3">
        {cart.map((item: CartItem, i: number) => {
          const fallbackProduct = "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop";
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
                <button onClick={() => update(i, 0)}><Trash2 size={16} className="text-neutral-500" /></button>
                <div className="flex items-center gap-1 border border-neutral-300 dark:border-neutral-700 rounded-full">
                  <button onClick={() => update(i, item.qty - 1)} className="w-7 h-7 flex items-center justify-center"><Minus size={12} /></button>
                  <span className="w-6 text-center text-sm">{item.qty}</span>
                  <button onClick={() => update(i, item.qty + 1)} className="w-7 h-7 flex items-center justify-center"><Plus size={12} /></button>
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
        <button data-cy="checkout-btn" onClick={onCheckout} className="w-full mt-4 py-3 uppercase tracking-wider text-sm" style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>Proceed to Checkout</button>
      </div>
    </div>
  );
}

/* ─────────────────── Checkout Page (UPI) ─────────────────── */
function CheckoutPage({ cart, total, user, onPlaced, onBack }: any) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: user?.name || user?.username || "", email: user?.email || "", phone: "", address: "", city: "", pincode: "" });
  const [upiId, setUpiId] = useState("");
  const [success, setSuccess] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.name || user.username || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);

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
    if (!form.name.trim()) { toast.error("Full Name is required"); return false; }
    if (!form.email.trim()) { toast.error("Email Address is required"); return false; }
    if (!form.email.includes('@')) { toast.error("Please enter a valid email"); return false; }
    const phoneValidation = validatePhone(form.phone);
    if (!phoneValidation.valid) { toast.error(phoneValidation.error); return false; }
    if (!form.address.trim()) { toast.error("Address is required"); return false; }
    if (!form.city.trim()) { toast.error("City is required"); return false; }
    const pincodeValidation = validatePincode(form.pincode);
    if (!pincodeValidation.valid) { toast.error(pincodeValidation.error); return false; }
    return true;
  };

  const createOrderOnBackend = async () => {
    if (!localStorage.getItem('authToken')) {
      toast.error('Please login to place order');
      return false;
    }

    setIsCreatingOrder(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      // Format order items from cart
      const orderItems = cart.map((item: CartItem) => {
        // Find the best image to store with the order
        const productImage = item.product.image_url || 
                           (Array.isArray(item.product.images) && item.product.images.length > 0 ? item.product.images[0] : "") ||
                           item.product.category_image || 
                           "";
        
        return {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          qty: item.qty,
          size: item.size,
          image: productImage,
          product_id: item.product.id,
        };
      });

      console.log('Creating order with items:', orderItems);

      // Create order on backend
      const response = await fetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: form.name || user?.name || user?.username || 'Guest Customer',
          customer_email: form.email || user?.email || 'customer@menshub.com',
          address: form.address,
          pincode: form.pincode,
          phone: form.phone,
          city: form.city,
          total_amount: total,
          items: orderItems,
          status: 'pending',
          payment_method: 'upi',
          payment_status: 'success',
        }),
      });

      if (response.ok) {
        const orderData = await response.json();
        console.log('✅ Order created successfully:', orderData);
        toast.success(`✅ Order placed! #${orderData.order_number || orderData.id}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to create order. Status:', response.status, 'Response:', errorText);
        toast.error('Failed to create order: ' + errorText);
        return false;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error placing order: ' + (error as any).message);
      return false;
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
        <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]">Checkout</h2>
      </div>
      <div className="flex gap-2 mb-6">
        {["Address", "UPI Payment", "Review"].map((s, i) => (
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
            <input data-cy="name-input" key="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
          </div>

          <div>
            <input data-cy="email-input" key="email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Email Address"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
          </div>

          <div>
            <input 
              data-cy="phone-input"
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
            <input data-cy="address-input" key="address" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Address"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
          </div>

          <div>
            <input data-cy="city-input" key="city" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="City"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" />
          </div>

          <div>
            <input 
              data-cy="pincode-input"
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

          <button data-cy="next-step-btn" type="submit" className="w-full py-3 uppercase tracking-wider text-sm" style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>Continue to Payment</button>
        </form>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-xl text-center">
            {/* Mock QR */}
            <div className="w-40 h-40 mx-auto mb-3 flex items-center justify-center rounded-xl relative"
              style={{ border: "2px solid var(--accent)", background: "repeating-linear-gradient(0deg,transparent,transparent 6px,rgba(0,0,0,0.06) 6px,rgba(0,0,0,0.06) 7px),repeating-linear-gradient(90deg,transparent,transparent 6px,rgba(0,0,0,0.06) 6px,rgba(0,0,0,0.06) 7px)" }}>
              <div className="absolute inset-3 rounded" style={{ border: "3px solid var(--accent)", opacity: 0.5 }} />
              <span className="relative z-10 px-2 py-1 rounded text-xs uppercase tracking-widest" style={{ background: "white", color: "var(--accent)", fontWeight: 700 }}>UPI QR</span>
            </div>
            <div className="text-xs text-neutral-500 mb-2">Scan with PhonePe / GPay / Paytm</div>
            <div className="inline-block px-4 py-2 rounded-lg text-sm font-mono" style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>
              menshubbusiness@upi
            </div>
            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
              <span className="text-xs text-neutral-400 uppercase">or type UPI ID</span>
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
            </div>
            <input value={upiId} onChange={e => setUpiId(e.target.value)}
              placeholder="yourname@bank (e.g. dharshan@okaxis)"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent text-sm text-center" />
            <div className="flex justify-center gap-2 mt-3">
              {["PhonePe", "GPay", "Paytm"].map(app => (
                <button key={app} onClick={() => toast(`Opening ${app}… (mock)`)}
                  className="px-3 py-1.5 text-xs rounded-full" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}>{app}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-between p-3 rounded-lg" style={{ border: "1px solid var(--accent)" }}>
            <span style={{ fontWeight: 600 }}>Total to Pay</span>
            <span style={{ fontWeight: 700, color: "var(--accent)" }}>₹{total.toLocaleString()}</span>
          </div>
          <button onClick={() => { setStep(2); toast.success("Payment confirmed (mock)"); }}
            className="w-full py-3 uppercase tracking-wider text-sm" style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>
            Confirm UPI Payment ₹{total.toLocaleString()}
          </button>
          <button onClick={() => setStep(0)} className="w-full py-2 text-sm text-neutral-500 underline">← Back</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <div className="text-sm uppercase tracking-wider mb-1" style={{ color: "var(--accent)" }}>Shipping to</div>
            <div>{form.name}, {form.address}, {form.city} — {form.pincode}</div>
            <div className="text-sm text-neutral-500 mt-1">📞 {form.phone}</div>
          </div>
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <div className="text-sm uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}>Items</div>
            {cart.map((item: CartItem, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span>{item.product.name} × {item.qty} (Size: {item.size})</span>
                <span>₹{(item.product.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between p-3 rounded-lg" style={{ border: "1px solid var(--accent)" }}>
            <span style={{ fontWeight: 600 }}>Paid via UPI</span>
            <span style={{ fontWeight: 700, color: "var(--accent)" }}>₹{total.toLocaleString()}</span>
          </div>
          <button 
            data-cy="place-order-btn"
            onClick={async () => { 
              const orderCreated = await createOrderOnBackend();
              if (orderCreated) {
                setSuccess(true); 
                setTimeout(onPlaced, 1800);
              }
            }}
            disabled={isCreatingOrder}
            className="w-full py-3 uppercase tracking-wider text-sm" 
            style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", opacity: isCreatingOrder ? 0.6 : 1 }}>
            {isCreatingOrder ? 'Creating Order...' : 'Place Order'}
          </button>
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
      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <GoogleOAuthLoginButton onSuccess={handleAuthSuccess} onError={() => {}} />
      )}
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
function WishlistPage({ products, onProduct, onBuy, onAddToCart, onWish, wishlist, onBack }: any) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg transition" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}><ChevronLeft size={20} /></button>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((p: Product) => (
            <ProductCard key={p.id} product={p} onProduct={onProduct} onBuy={onBuy} onAddToCart={onAddToCart} onWish={onWish} wishlist={wishlist} />
          ))}
        </div>
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

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
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

    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 my-4">
          <button onClick={() => setSelectedOrder(null)} className="p-2 -ml-2"><ChevronLeft size={20} /></button>
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
                  <div key={idx} className="flex gap-4 items-center py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-800">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      ) : (
                        <Package size={20} className="text-neutral-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      <p className="text-xs text-neutral-500 uppercase tracking-wider">Size: {item.size} • Qty: {item.qty}</p>
                    </div>
                    {item.price && <p className="font-bold text-sm shrink-0" style={{ color: "var(--accent)" }}>₹{(item.price * item.qty).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exchange Eligibility / WhatsApp Support */}
          {selectedOrder.status === 'delivered' ? (
            <div className={`border rounded-xl p-4 ${isEligible ? 'border-green-300 bg-green-50' : 'border-neutral-300 bg-neutral-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Check size={18} className={isEligible ? 'text-green-600' : 'text-neutral-500'} />
                <p className={`font-semibold ${isEligible ? 'text-green-900' : 'text-neutral-900'}`}>
                  {isEligible ? 'Eligible for Size Exchange' : 'Delivered'}
                </p>
              </div>
              
              {isEligible ? (
                <>
                  <p className="text-sm text-green-800 mb-4">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining to request exchange. If you have any size mismatch or issues, please contact us on WhatsApp.</p>
                  <a 
                    href={`https://wa.me/919524097865?text=${encodeURIComponent(
                      `Hello Men's Hub, I would like to request an EXCHANGE for my Order #${selectedOrder.order_number || selectedOrder.id}.\n\nItems: ${selectedOrder.items?.map((i: any) => `${i.name} (Size: ${i.size})`).join(', ')}\n\nI need a different size/exchange for this order.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition shadow-md"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Exchange on WhatsApp
                  </a>
                </>
              ) : (
                <p className="text-sm text-neutral-600">Exchange eligibility window has closed (3 days from delivery). For any other concerns, please contact support.</p>
              )}
            </div>
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
              <p className="text-sm text-neutral-500 mb-3">Need help with this order or tracking details?</p>
              <a 
                href={`https://wa.me/919524097865?text=${encodeURIComponent(
                  `Hello Men's Hub, I have a query regarding my Order #${selectedOrder.order_number || selectedOrder.id} (${selectedOrder.status.toUpperCase()}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium transition"
              >
                Chat with Support
              </a>
            </div>
          )}

          {/* Customer Info */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Delivery Address</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {selectedOrder.customer_name}<br/>
              {selectedOrder.address}<br/>
              {selectedOrder.pincode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* Orders List View */
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="flex items-center gap-3 my-4">
        <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={20} /></button>
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
function NotificationsPage({ notifications, markRead, markAllRead, onBack }: any) {
  const loading = false; // Now handled by App

  useEffect(() => {
    // Initial fetch handled by App, but we can ensure it's fresh
    // refreshDataFromDB() is available in App, but here we just show what's there
  }, []);

  const handleMarkAsRead = (id: string, orderNumber?: string) => {
    markRead(id, orderNumber);
  };

  const handleMarkAllAsRead = () => {
    markAllRead();
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
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg transition" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}><ChevronLeft size={20} /></button>
        <div className="flex-1">
          <h2 className="uppercase tracking-[0.2em] flex items-center gap-2" style={{ fontWeight: 700 }}>
            <Bell size={20} style={{ color: "var(--accent)" }} /> Order Notifications
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            {notifications.length === 0 ? "No orders yet" : `${notifications.length} order${notifications.length > 1 ? "s" : ""} • ${unread} unread`}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllAsRead}
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
              onClick={() => handleMarkAsRead(n.id, n.order_number || n.order)}
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
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-800">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                        ) : (
                          <Package2 size={16} style={{ color: "var(--accent)" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: "var(--accent)" }}>{item.name || 'Product'}</div>
                        <div className="text-[10px] text-neutral-500 uppercase tracking-tighter">Size {item.size || 'N/A'} • Qty {item.qty || 1}</div>
                      </div>
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
function AdminPanel({ products, setProducts, categories, setCategories, bannerImg, setBannerImg, notifyTabsToRefresh, onBack }: any) {
  const [tab, setTab] = useState<"products" | "categories" | "banner" | "orders">(() => {
    const initial = localStorage.getItem('admin_initial_tab');
    if (initial === 'orders' || initial === 'products' || initial === 'categories' || initial === 'banner') {
      localStorage.removeItem('admin_initial_tab');
      return initial as any;
    }
    return "products";
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "packed" | "shipped" | "out_for_delivery" | "delivered">("all");
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<string | null>(null);


    // Add updateOrderStatus function for order status updates
    const updateOrderStatus = async (orderId: any, newStatus: string) => {
      // If status requires tracking, show modal first
      if (newStatus === "shipped" || newStatus === "out_for_delivery") {
        const order = orders.find(o => o.id === orderId);
        setSelectedOrder(order);
        setPendingStatusUpdate(newStatus);
        setTrackingId(order?.tracking_number || "");
        setShowTrackingModal(true);
        return;
      }

      setUpdatingStatus(true);
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
          );
          toast.success(`✅ Order updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
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
  const filteredProducts = products.filter((p: Product) => 
    p.name.toLowerCase().includes(q.toLowerCase()) || 
    String(p.category).toLowerCase().includes(q.toLowerCase())
  );

  const saveProduct = async (p: Product) => {
    setSaving(true);
    try {
      // Find category object to ensure we have the correct name
      const catObj = categories.find((c: Category) => 
        String(c.id) === String(p.category) || 
        c.name.toLowerCase() === String(p.category).toLowerCase()
      );
      
      // We prefer saving the name (lowercased) as per the backend's CharField
      const categoryToSave = catObj ? catObj.name.toLowerCase() : String(p.category).toLowerCase();
      
      const safeProduct = { ...p, category: categoryToSave };
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

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
        return data;
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

    if (!selectedOrder) return;

    setUpdatingStatus(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const orderId = typeof selectedOrder === 'object' ? selectedOrder.id : selectedOrder;
      const payload: any = { tracking_number: trackingId };
      if (pendingStatusUpdate) {
        payload.status = pendingStatusUpdate;
      }

      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`✅ Tracking ID updated ${pendingStatusUpdate ? 'and status changed to ' + pendingStatusUpdate.replace('_', ' ').toUpperCase() : ''}`);
        setShowTrackingModal(false);
        setTrackingId('');
        setPendingStatusUpdate(null);
        setSelectedOrder(null);
        await fetchOrders();
      } else {
        toast.error('Failed to update tracking details');
      }
    } catch (error) {
      console.error('Tracking update error:', error);
      toast.error('Error updating tracking details');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [viewingOrder, setViewingOrder] = useState<any>(null);

  // Fetch orders when orders tab is opened
  useEffect(() => {
    if (tab === 'orders') {
      fetchOrders().then((fetchedOrders) => {
        const initialOrder = localStorage.getItem('admin_initial_order');
        if (initialOrder && fetchedOrders) {
           const o = fetchedOrders.find((x: any) => String(x.id) === String(initialOrder) || x.order_number === initialOrder);
           if (o) setViewingOrder(o);
           localStorage.removeItem('admin_initial_order');
        }
      });
      // Auto-refresh every 15 seconds for admins
      const interval = setInterval(fetchOrders, 15000);
      return () => clearInterval(interval);
    }
  }, [tab]);

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24">
      <div className="flex items-center gap-3 my-4">
        <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={20} /></button>
        <h2 className="uppercase tracking-[0.2em]">Admin Panel</h2>
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
            <button onClick={() => setEditingProduct({ id: "", name: "", price: 0, category: (categories.length > 0 ? categories[0].name : "shirt").toLowerCase(), popularity: 5, sizes: ["M"], images: ["", "", "", ""], featured: false })}
              className="px-4 py-2 text-sm uppercase tracking-wider"
              style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>+ Add</button>
          </div>
          <div className="space-y-2">
            {(filteredProducts || []).map((p: Product) => {
              // Defensive: always use a fallback if images is missing or empty
              const fallbackProduct = "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200";
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
                  <div className="text-sm text-neutral-500">
                    ₹{p.price.toLocaleString()} • {(() => {
                      // If it's a numeric ID, try to find the name. If it's already a name, just show it.
                      const cat = categories.find(c => String(c.id) === String(p.category));
                      return cat ? cat.name : (typeof p.category === 'string' ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : p.category);
                    })()}
                  </div>
                </div>
                {/* Quick Featured Toggle */}
                <button
                  onClick={async () => {
                    const updated = { ...p, featured: !p.featured };
                    setSaving(true);
                    try {
                      await adminService.saveProduct(updated);
                      setProducts((arr: Product[]) => arr.map(x => x.id === p.id ? updated : x));
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
          {editingProduct && <ProductEditor product={editingProduct} categories={categories} onSave={saveProduct} onCancel={() => setEditingProduct(null)} notifyTabsToRefresh={notifyTabsToRefresh} />}
        </>
      )}

      {tab === "categories" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setEditingCategory({ id: 0, name: "", img: "" })}
              className="px-4 py-2 text-sm uppercase tracking-wider"
              style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>+ Add Category</button>
          </div>
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

          {/* Order Filters */}
          <div className="flex flex-wrap gap-2 mb-6 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            {([
              { id: "all", label: "All Orders", count: orders.length },
              { id: "pending", label: "Pending", count: orders.filter(o => o.status === "pending").length },
              { id: "packed", label: "Packed", count: orders.filter(o => o.status === "packed").length },
              { id: "shipped", label: "Shipped", count: orders.filter(o => o.status === "shipped").length },
              { id: "out_for_delivery", label: "Out for Delivery", count: orders.filter(o => o.status === "out_for_delivery").length },
              { id: "delivered", label: "Delivered", count: orders.filter(o => o.status === "delivered").length },
            ]).map(f => (
              <button
                key={f.id}
                onClick={() => setOrderFilter(f.id as any)}
                className="px-4 py-2 text-[10px] uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
                style={orderFilter === f.id ? {
                  background: "var(--accent-grad)",
                  color: "var(--accent-fg)",
                  fontWeight: 700,
                  boxShadow: "0 4px 12px var(--accent-glow)"
                } : {
                  color: "var(--accent-soft)"
                }}>
                {f.label}
                <span className="px-1.5 py-0.5 rounded-full text-[9px]" style={{ background: orderFilter === f.id ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)", color: orderFilter === f.id ? "white" : "inherit" }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {loadingOrders && <div className="text-center py-8 text-neutral-500 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-neutral-300 border-t-blue-600 rounded-full animate-spin" />
            Loading orders...
          </div>}

          {!loadingOrders && orders.length === 0 && (
            <div className="py-12 text-center bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-700">
              <Package size={48} className="mx-auto text-neutral-300 mb-3" />
              <div className="text-neutral-500 mb-2 font-medium">No orders found</div>
              <p className="text-xs text-neutral-400">New orders will appear here automatically.</p>
            </div>
          )}

          {!loadingOrders && orders.length > 0 && (
            <div className="space-y-4">
              {orders
                .filter(o => orderFilter === "all" || o.status === orderFilter)
                .map((order: any) => (
                <div
                  key={order.id}
                  className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-black/5 bg-white dark:bg-neutral-900 group"
                  style={{
                    borderColor: order.status === "pending" ? "#ef4444" : "var(--accent)",
                    borderWidth: order.status === "pending" ? "2px" : "1px",
                  }}>
                  {/* Header */}
                <div className="flex gap-4 items-start">
                  {/* Order Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {order.items?.[0]?.image ? (
                      <img src={order.items[0].image} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-neutral-300" />
                    )}
                  </div>
                  
                  <div className="flex-1">
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
                      <div className="text-sm text-neutral-500">
                        {order.customer_name || 'N/A'} • {order.customer_email || 'N/A'}
                      </div>
                      <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mt-1 flex items-center gap-1">
                        <Phone size={12} className="text-neutral-400" /> {order.phone || 'N/A'}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        ₹{parseFloat(order.total_amount || 0).toLocaleString()} • {order.items?.length || 0} items
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-2 line-clamp-1">
                        📍 {order.address || 'No address'} {order.pincode ? `• ${order.pincode}` : ''}
                      </div>
                      {order.tracking_number && (
                        <div className="text-xs text-neutral-500 mt-2 p-2 bg-neutral-100 dark:bg-neutral-900 rounded">
                          📦 Tracking: <strong>{order.tracking_number}</strong>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setViewingOrder(order)}
                      className="px-4 py-2 text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-2"
                      style={{ 
                        border: "1.5px solid var(--accent)", 
                        color: "var(--accent)",
                        fontWeight: 700
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-grad)"; e.currentTarget.style.color = "var(--accent-fg)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}>
                      <Eye size={14} /> View Full Details
                    </button>
                  </div>

                  {/* Quick Items Preview (Last 2) */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      {order.items.slice(0, 2).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[11px] text-neutral-500 px-1">
                          <span>{item.name} (x{item.qty})</span>
                          <span>₹{(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && <div className="text-[10px] text-neutral-400 italic px-1">+ {order.items.length - 2} more items</div>}
                    </div>
                  )}

                  {/* Status Update Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateOrderStatus(order.id, "packed")}
                      disabled={updatingStatus || order.status !== "pending"}
                      className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                      style={{
                        border:
                          order.status === "pending"
                            ? "1px solid #3b82f6"
                            : "1px solid #d1d5db",
                        color:
                          order.status === "pending"
                            ? "#3b82f6"
                            : "#9ca3af",
                        background: order.status === "packed" ? "rgba(59,130,246,0.2)" : "transparent",
                        opacity: updatingStatus ? 0.5 : 1,
                        cursor: order.status === "pending" ? "pointer" : "not-allowed",
                      }}>
                      📦 Packed
                    </button>

                    <button
                      onClick={() => updateOrderStatus(order.id, "shipped")}
                      disabled={updatingStatus || !["pending", "packed"].includes(order.status)}
                      className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                      style={{
                        border:
                          ["pending", "packed"].includes(order.status)
                            ? "1px solid #a855f7"
                            : "1px solid #d1d5db",
                        color:
                          ["pending", "packed"].includes(order.status)
                            ? "#a855f7"
                            : "#9ca3af",
                        background:
                          order.status === "shipped" ? "rgba(168,85,247,0.2)" : "transparent",
                        opacity: updatingStatus ? 0.5 : 1,
                        cursor: ["pending", "packed", "shipped"].includes(order.status)
                          ? "pointer"
                          : "not-allowed",
                      }}>
                      🚚 Shipped
                    </button>

                    <button
                      onClick={() => updateOrderStatus(order.id, "out_for_delivery")}
                      disabled={
                        updatingStatus ||
                        !["pending", "packed", "shipped"].includes(order.status)
                      }
                      className="px-3 py-1.5 text-xs uppercase tracking-wider rounded-md transition"
                      style={{
                        border:
                          ["pending", "packed", "shipped"].includes(order.status)
                            ? "1px solid #22c55e"
                            : "1px solid #d1d5db",
                        color:
                          ["pending", "packed", "shipped"].includes(order.status)
                            ? "#22c55e"
                            : "#9ca3af",
                        background:
                          order.status === "out_for_delivery"
                            ? "rgba(34,197,94,0.2)"
                            : "transparent",
                        opacity: updatingStatus ? 0.5 : 1,
                        cursor: ["pending", "packed", "shipped"].includes(order.status)
                          ? "pointer"
                          : "not-allowed",
                      }}>
                      🎯 Out for Delivery
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
      {/* Detailed Order View Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewingOrder(null)}>
          <div className="bg-white dark:bg-neutral-950 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" 
            onClick={e => e.stopPropagation()} 
            style={{ border: "1px solid var(--accent)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-900 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
              <div>
                <h3 className="uppercase tracking-widest font-bold text-sm" style={{ color: "var(--accent)" }}>Order #{viewingOrder.order_number}</h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">{new Date(viewingOrder.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
              <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Info */}
              <section>
                <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3 font-bold">Customer Details</div>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500">Full Name</span>
                    <span className="font-bold">{viewingOrder.customer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500">Email Address</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{viewingOrder.customer_email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500">Phone Number</span>
                    <span className="font-bold">{viewingOrder.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500">Registered Account</span>
                    <span className="font-bold text-[10px] uppercase tracking-tighter bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded">
                      {viewingOrder.user ? (
                        <span className="flex items-center gap-1">
                          <User size={10} /> {viewingOrder.customer_email || 'Logged In User'}
                        </span>
                      ) : 'Guest User'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section>
                <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3 font-bold">Shipping Details</div>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800">
                  <div className="text-sm leading-relaxed">{viewingOrder.address}</div>
                  <div className="text-sm font-bold mt-2 flex justify-between items-center">
                    <span>{viewingOrder.city || 'N/A'}</span>
                    <span>PIN: {viewingOrder.pincode}</span>
                  </div>
                </div>
              </section>

              <section>
                <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3 font-bold">Ordered Items ({(() => {
                  try {
                    const items = typeof viewingOrder.items === 'string' ? JSON.parse(viewingOrder.items) : viewingOrder.items;
                    return items?.length || 0;
                  } catch (e) { return 0; }
                })()})</div>
                <div className="space-y-3">
                  {(() => {
                    try {
                      const items = typeof viewingOrder.items === 'string' ? JSON.parse(viewingOrder.items) : viewingOrder.items;
                      return items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-800">
                            {item.image ? (
                              <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                            ) : (
                              <Package size={20} className="text-neutral-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{item.name}</div>
                            <div className="text-xs text-neutral-500">Size: {item.size} • Qty: {item.qty}</div>
                          </div>
                          <div className="text-sm font-bold">₹{(item.price * item.qty).toLocaleString()}</div>
                        </div>
                      ));
                    } catch (e) {
                      return <div className="text-xs text-red-500">Error loading items data</div>;
                    }
                  })()}
                </div>
              </section>

              {/* Order Summary */}
              <section className="pt-4 border-t border-neutral-100 dark:border-neutral-900">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount</span>
                  <span className="text-lg font-black" style={{ color: "var(--accent)" }}>₹{parseFloat(viewingOrder.total_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-neutral-500 uppercase tracking-widest">Payment Status</span>
                  <span className="text-xs font-bold uppercase" style={{ color: viewingOrder.payment_status === 'success' ? '#22c55e' : '#ef4444' }}>{viewingOrder.payment_status}</span>
                </div>
              </section>
            </div>

            <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-900">
              <button 
                onClick={() => setViewingOrder(null)}
                className="w-full py-3 uppercase tracking-[0.2em] text-xs font-bold rounded-xl transition"
                style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}>
                Close Details
              </button>
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
  const [p, setP] = useState<Product>(() => {
    // Ensure images array has at least 4 slots
    const baseImages = Array.isArray(product.images) ? [...product.images] : [];
    while (baseImages.length < 4) baseImages.push("");
    return { ...product, images: baseImages.slice(0, 4) };
  });
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file || uploadingIdx === null) return;
    
    // Upload file
    setUploadingIdx(uploadingIdx);
    try {
      const uploadedUrl = await adminService.uploadImage(file);
      setP((prev: Product) => {
        const newImages = [...prev.images];
        newImages[uploadingIdx] = uploadedUrl;
        return { ...prev, images: newImages };
      });
      toast.success(`✅ Image ${uploadingIdx + 1} uploaded`);
    } catch (error: any) {
      console.error("❌ Image upload failed:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingIdx(null);
    }
  };
  
  const handleSave = () => {
    setSaving(true);
    // Filter out empty images before saving
    const finalImages = p.images.filter((img: string) => img && img.trim() !== "");
    // Use first image as main image_url for backwards compatibility if needed
    onSave({ ...p, images: finalImages, image_url: finalImages[0] || "" });
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
          {/* Image Slots Grid (Up to 4) */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {p.images.map((img: string, idx: number) => (
              <div key={idx} 
                onClick={() => uploadingIdx === null && (setUploadingIdx(idx), fileRef.current?.click())}
                className="relative h-28 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
                style={{ 
                  border: `2px dashed ${img ? 'var(--accent)' : '#999'}`,
                  opacity: uploadingIdx === idx ? 0.6 : 1
                }}>
                {img ? (
                  <>
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setP(prev => {
                          const newImages = [...prev.images];
                          newImages[idx] = "";
                          return { ...prev, images: newImages };
                        });
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow-lg">
                      ×
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <ImageIcon size={20} className="mx-auto mb-1 text-neutral-400" />
                    <div className="text-[10px] text-neutral-500">{uploadingIdx === idx ? "..." : `Slot ${idx + 1}`}</div>
                  </div>
                )}
                {uploadingIdx === idx && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploadingIdx !== null} />
          <input 
            value={p.name} 
            onChange={e => setP({ ...p, name: e.target.value })} 
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
            placeholder="Product Name" 
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" 
          />
          <input 
            type="number" 
            value={p.price === 0 ? "" : p.price} 
            onChange={e => setP({ ...p, price: e.target.value === "" ? 0 : Number(e.target.value) })} 
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
            placeholder="Price (₹)" 
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" 
          />
          <select value={p.category} onChange={e => setP({ ...p, category: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent">
            {categories.map((c: Category) => <option key={c.id} value={c.name.toLowerCase()}>{c.name}</option>)}
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
                {["XS","S","M","L","XL","XXL","28","30","32","34","36","38","7","8","9","10","11","One"].map(s => (
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
          <button onClick={onCancel} disabled={saving || uploadingIdx !== null} className="flex-1 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm uppercase tracking-wider hover:opacity-70 transition disabled:opacity-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || uploadingIdx !== null}
            className="flex-1 py-2 rounded-lg text-sm uppercase tracking-wider transition disabled:opacity-50"
            style={{ background: "var(--accent-grad)", color: "var(--accent-fg)" }}
          >
            {saving ? "Saving..." : uploadingIdx !== null ? "Uploading..." : "Save"}
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
    onSave({ ...c, img });
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
            <input 
              value={c.name} 
              onChange={e => setC({ ...c, name: e.target.value })} 
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
              placeholder="Category Name"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent" 
            />
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
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const saveBannerToDatabase = async (imageUrl: string) => {
    try {
      await adminService.saveBannerToSettings(imageUrl);
      console.log('✅ Banner saved to database');
    } catch (error: any) {
      console.error('❌ Failed to save banner to database:', error);
      throw error;
    }
  };
  
  const saveBannerFromUrl = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }
    
    setUploading(true);
    try {
      setBannerImg(urlInput);
      await saveBannerToDatabase(urlInput);
      notifyTabsToRefresh();
      setUrlInput("");
      toast.success("✅ Banner updated from URL — live on all tabs!");
    } catch (error: any) {
      console.error("❌ Failed to save banner from URL:", error);
      toast.error(error.message || "Failed to save banner");
    } finally {
      setUploading(false);
    }
  };
  
  const uploadBanner = async (file: File) => {
    setUploading(true);
    try {
      // Show preview immediately
      const preview = await fileToDataURL(file);
      setBannerImg(preview);
      
      // Upload to server
      const uploadedUrl = await adminService.uploadImage(file);
      setBannerImg(uploadedUrl);
      
      // Save to database
      await saveBannerToDatabase(uploadedUrl);
      
      // Notify other tabs
      notifyTabsToRefresh();
      toast.success("✅ Banner updated — live on all tabs!");
    } catch (error: any) {
      console.error("❌ Banner upload failed:", error);
      toast.error(error.message || "Failed to upload banner");
    } finally {
      setUploading(false);
    }
  };
  
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (file) await uploadBanner(file);
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      await uploadBanner(file);
    }
  };
  
  return (
    <div className="space-y-5">
      <div className="text-sm uppercase tracking-wider" style={{ color: "var(--accent)", fontWeight: 600 }}>Current Banner (text-free)</div>
      <div className="relative rounded-2xl overflow-hidden h-52 bg-neutral-900" style={{ border: "2px solid var(--accent)" }}>
        <img src={bannerImg} className="w-full h-full object-cover" alt="Banner" onError={(e: any) => { e.target.src = ""; }} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="px-3 py-1 rounded-full text-xs uppercase tracking-wider" style={{ background: "rgba(0,0,0,0.6)", color: "var(--accent)" }}>{uploading ? "Saving..." : "Live Preview"}</span>
        </div>
      </div>

      {/* URL Input Option */}
      <div className="space-y-2">
        <label className="text-sm uppercase tracking-wider" style={{ color: "var(--accent)", fontWeight: 600 }}>Paste Image URL</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveBannerFromUrl(); }}
            disabled={uploading}
            className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900"
          />
          <button 
            onClick={saveBannerFromUrl}
            disabled={uploading || !urlInput.trim()}
            className="px-4 py-2 text-xs uppercase tracking-wider rounded disabled:opacity-50"
            style={{ background: "var(--accent-grad)", color: "var(--accent-fg)", fontWeight: 600 }}>
            Apply
          </button>
        </div>
      </div>

      {/* File Upload Option */}
      <div className="space-y-2">
        <label className="text-sm uppercase tracking-wider" style={{ color: "var(--accent)", fontWeight: 600 }}>Or Upload from Device</label>
        <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer" style={{ borderColor: "var(--accent)", opacity: uploading ? 0.6 : 1, cursor: uploading ? 'wait' : 'pointer' }}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}>
          <Upload size={32} className="mx-auto mb-3" style={{ color: "var(--accent)" }} />
          <div className="uppercase tracking-wider text-sm mb-1" style={{ color: "var(--accent)", fontWeight: 600 }}>Upload from Device</div>
          <div className="text-xs text-neutral-400">{uploading ? "Uploading..." : "Click or drag & drop • PNG, JPG, WEBP"}</div>
        </div>
      </div>
      
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
    </div>
  );
}

/* ─────────────────── Footer ─────────────────── */
function Footer() {
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
          <h4 className="uppercase tracking-wider mb-3">Customer Care</h4>
          <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <a href="https://maps.app.goo.gl/tR21zVGfRreYF96z5?g_st=awb" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:underline cursor-pointer"><MapPin size={14} className="mt-0.5 shrink-0" /> 13, Aruppukottai Main Rd, South Gate, Mahalipatti, Madurai, Tamil Nadu 625001, India</a>
            <a href="tel:+919524097865" className="flex items-center gap-2 hover:underline"><Phone size={14} className="shrink-0" /> +91 95240 97865</a>
            <a href="mailto:menshubadmin01@gmail.com" className="flex items-center gap-2 hover:underline"><Mail size={14} className="shrink-0" /> menshubadmin01@gmail.com</a>
          </div>
        </div>
        <div>
          <h4 className="uppercase tracking-wider mb-3">Follow</h4>
          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/mens_hub_clothing?utm_source=qr&igsh=ZzBxMTR0cDJpY290"
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
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 text-center">© 2026 Men's Hub. All rights reserved.</div>
    </footer>
  );
}
/* ─────────────────── Bottom Nav ─────────────────── */
function BottomNav({ active, onHome, onCategories, onWishlist, onCart, onOrders, toggleDark, dark, cartCount }: any) {
  const items = [
    { key: "home",       icon: Home,       label: "Home",       action: onHome },
    { key: "categories", icon: Grid3x3,    label: "Category",   action: onCategories },
    { key: "wishlist",   icon: Heart,      label: "Wishlist",   action: onWishlist },
    { key: "cart",       icon: ShoppingBag,label: "Cart",       action: onCart,    badge: cartCount },
    { key: "orders",     icon: Package,    label: "Orders",     action: onOrders },
    { key: "dark",       icon: dark ? Sun : Moon, label: dark ? "Light" : "Dark", action: toggleDark },
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-neutral-950/95 backdrop-blur flex gap-1 px-1 py-1.5" style={{ borderTop: "1px solid var(--accent)" }}>
      {items.map(it => {
        const isActive = active === it.key;
        const Icon = it.icon;
        return (
          <button key={it.key} onClick={it.action}
            className="flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg transition active:scale-95 relative"
            style={{
              border: "1px solid var(--accent)",
              background: isActive ? "var(--accent-grad)" : "transparent",
              color: isActive ? "var(--accent-fg)" : "var(--accent)",
              boxShadow: isActive ? "0 0 0 1.5px var(--accent), 0 4px 16px var(--accent-glow)" : "none",
            }}>
            <Icon size={16} />
            {Number(it.badge) > 0 && (
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
