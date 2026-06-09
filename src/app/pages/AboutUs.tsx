import React from 'react';
import { 
  ArrowLeft, ShieldCheck, Truck, Sparkles, MapPin, Clock, 
  Phone, Mail, Instagram, Compass, Award 
} from 'lucide-react';

export default function AboutUs({ onBack }: { onBack: () => void }) {
  // Simple Unsplash optimizer for responsive, fast loading
  const getOptimizedImage = (id: string, width: number) => {
    return `https://images.unsplash.com/${id}?w=${width}&q=75&auto=format&fit=crop`;
  };

  const showroomImage = getOptimizedImage('photo-1490481651871-ab68de25d43d', 800);
  const heroImage = getOptimizedImage('photo-1594938298603-c8148c4dae35', 1200);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 md:px-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="group mb-8 px-4 py-2 border rounded-xl flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-300"
        style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Store
      </button>

      {/* Hero Banner Section */}
      <div 
        className="relative rounded-3xl overflow-hidden h-72 md:h-[400px] mb-12 flex flex-col justify-end p-6 md:p-12 shadow-2xl"
        style={{ border: "1.5px solid var(--accent)" }}
      >
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Mens Hub Sartorial Tailoring" 
            className="w-full h-full object-cover filter brightness-[0.35] contrast-[1.05]"
            loading="eager"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--accent)" }}>
            <Sparkles size={14} /> Be Your Own Label
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase tracking-wider mb-4">
            Mens Hub
          </h1>
          <p className="text-neutral-300 text-sm md:text-lg leading-relaxed font-medium">
            Redefining premium menswear with customized precision, contemporary designs, and timeless confidence. Founded in 2023.
          </p>
        </div>
      </div>

      {/* Brand Statistics Bar */}
      <div 
        className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl mb-16 text-center shadow-lg"
        style={{ 
          background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)",
          border: "1px solid var(--accent)",
          backdropFilter: "blur(8px)"
        }}
      >
        <div>
          <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>10,000+</div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Gentlemen Served</div>
        </div>
        <div>
          <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>500+</div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Curated Designs</div>
        </div>
        <div>
          <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>3-7 Days</div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Pan-India Delivery</div>
        </div>
        <div>
          <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>100%</div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Premium Quality</div>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold uppercase tracking-wide">Our Sartorial Pillars</h2>
          <div className="w-12 h-1 mx-auto mt-3 rounded-full" style={{ background: "var(--accent-grad)" }}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div 
            className="p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col items-center text-center shadow-md"
            style={{ border: "1px solid var(--accent)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 30px var(--accent-glow)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow" style={{ background: "var(--accent-grad)" }}>
              <Compass className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Curated Elegance</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              We handpick every fabric, texture, and style. From smart street style to classic formalwear, we curate outfits that empower your everyday presence.
            </p>
          </div>

          {/* Card 2 */}
          <div 
            className="p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col items-center text-center shadow-md"
            style={{ border: "1px solid var(--accent)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 30px var(--accent-glow)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow" style={{ background: "var(--accent-grad)" }}>
              <ShieldCheck className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Uncompromised Standard</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Quality is our core signature. We employ strict fabric sourcing, double-stitch reinforcement, and precise cuts so every garment feels custom tailored.
            </p>
          </div>

          {/* Card 3 */}
          <div 
            className="p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col items-center text-center shadow-md"
            style={{ border: "1px solid var(--accent)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 30px var(--accent-glow)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow" style={{ background: "var(--accent-grad)" }}>
              <Truck className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Customer First Service</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Enjoy ultra-fast shipping across India, robust package tracking, and active customer support. We support fast size-exchanges to guarantee the perfect fit.
            </p>
          </div>
        </div>
      </div>

      {/* Showroom & Physical Presence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-neutral-50 dark:bg-neutral-900/40 p-6 md:p-8 rounded-3xl mb-12 shadow-inner" style={{ border: "1px solid var(--accent)" }}>
        <div className="lg:col-span-6 rounded-2xl overflow-hidden shadow-lg h-72 md:h-96">
          <img 
            src={showroomImage} 
            alt="Mens Hub Boutique Showroom" 
            className="w-full h-full object-cover filter contrast-[1.02]"
            loading="lazy"
          />
        </div>
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold" style={{ color: "var(--accent)" }}>
            <Award size={14} /> Our Physical Experience
          </div>
          <h2 className="text-3xl font-extrabold uppercase tracking-wide">Visit Our Showroom</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Experience our premium fabrics and modern tailoring first-hand. Our dedicated staff is ready to help you discover the perfect outfits, try on various sizes, and customize your look.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 flex-shrink-0" size={18} style={{ color: "var(--accent)" }} />
              <div>
                <h4 className="font-bold text-sm">Store Address</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  13, Aruppukottai Main Rd, South Gate, Mahalipatti, Madurai, Tamil Nadu 625001, India
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-1 flex-shrink-0" size={18} style={{ color: "var(--accent)" }} />
              <div>
                <h4 className="font-bold text-sm">Operating Hours</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Monday to Sunday: 10:00 AM - 9:00 PM
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-1 flex-shrink-0" size={18} style={{ color: "var(--accent)" }} />
              <div>
                <h4 className="font-bold text-sm">Call/WhatsApp Support</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">+91 95240 97865 or +91 73972 31852</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-4">
            <a 
              href="https://maps.google.com/?q=Men's+Hub+13+Aruppukottai+Main+Rd+South+Gate+Madurai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 transition shadow"
            >
              Get Directions on Maps
            </a>
            <a 
              href="https://www.instagram.com/mens_hub_clothing?igsh=cTJraHF5dG52eDky"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-3 px-5 border rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              <Instagram size={14} /> Follow Our Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
