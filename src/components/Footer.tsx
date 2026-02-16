import { Link } from "react-router-dom";
import {
  Compass,
  Download,
  Facebook,
  Instagram,
  X,
  Mail,
  Youtube,
  Linkedin,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";

// Brand Colors
const COLORS = {
  TEAL: "#008080",
  WHATSAPP: "#25D366",
  INSTAGRAM: "#E4405F",
  TIKTOK: "#000000",
  YOUTUBE: "#FF0000",
  FACEBOOK: "#1877F2",
  X: "#000000",
  LINKEDIN: "#0A66C2",
  PINTEREST: "#BD081C",
  EXPEDIA: "#00355F",
};

const TEAL_HOVER_CLASS = "hover:text-[#008080]";

// Custom SVG Icons for Brands
const PinterestIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.289 2C6.617 2 2 6.617 2 12.289c0 4.305 2.605 7.977 6.34 9.542-.09-.806-.17-2.04.034-2.915.185-.79 1.197-5.076 1.197-5.076s-.306-.612-.306-1.515c0-1.42.823-2.48 1.848-2.48.87 0 1.29.654 1.29 1.44 0 .876-.558 2.185-.846 3.4-.24 1.013.51 1.84 1.508 1.84 1.81 0 3.204-1.907 3.204-4.662 0-2.438-1.753-4.144-4.256-4.144-2.898 0-4.6 2.174-4.6 4.42 0 .875.337 1.812.758 2.32.083.1.095.188.07.29-.077.322-.248.1.306-1.025.034-.145-.012-.27-.116-.395-1.036-1.246-1.28-2.316-1.28-3.75 0-3.056 2.22-5.862 6.4-5.862 3.36 0 5.97 2.395 5.97 5.594 0 3.34-2.105 6.03-5.024 6.03-.98 0-1.903-.51-2.217-1.11l-.604 2.3c-.218.84-.81 1.89-1.206 2.53 1.1.34 2.27.52 3.48.52 5.67 0 10.29-4.62 10.29-10.29C22.58 6.617 17.96 2 12.289 2z" />
  </svg>
);

const ExpediaIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.5 13.5l-4.5-2V4l-1.5-.5V11l-4.5 2V15l4.5-1.5V18l-1.5 1v1.5l2.5-.5 2.5.5V19l-1.5-1v-4.5l4.5 1.5v-1.5zM22 12c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2s10 4.5 10 10z" />
  </svg>
);

const TikTokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01V14.5c.03 2.1-.47 4.31-1.89 5.88-1.53 1.77-3.92 2.64-6.2 2.37-2.58-.23-4.9-2-5.74-4.46-.91-2.47-.41-5.46 1.34-7.42 1.44-1.68 3.73-2.53 5.93-2.25V12.7c-1.01-.15-2.15.09-2.88.85-.75.84-.81 2.14-.31 3.09.47 1.05 1.64 1.75 2.79 1.6 1.18-.1 2.22-1.14 2.25-2.32V.02z" />
  </svg>
);

const socialLinks = {
  whatsapp: "https://wa.me/YOUR_NUMBER",
  facebook: "https://facebook.com/realtravo",
  instagram: "https://instagram.com/realtravo",
  tiktok: "https://tiktok.com/@realtravo",
  linkedin: "https://linkedin.com/company/realtravo",
  pinterest: "https://pinterest.com/realtravo",
  expedia: "https://expedia.com",
  youtube: "https://youtube.com/realtravo",
  email: "mailto:hello@realtravo.com",
};

export const Footer = ({ className = "" }: { className?: string }) => {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  return (
    <footer className={`hidden md:block bg-slate-50 border-t mt-12 text-slate-900 ${className}`}>
      <div className="container px-6 py-12 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-1 space-y-5">
            <div className="flex items-center gap-2">
              <div className="bg-[#008080] p-2 rounded-xl">
                <Compass className="h-6 w-6 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter">RealTravo</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              Discover amazing destinations and create unforgettable memories with our curated travel experiences.
            </p>
          </div>
          
          {/* Company */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-slate-900">Company</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>Home</Link></li>
              <li><Link to="/about" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>Our Story</Link></li>
              <li><Link to="/become-host" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>Become a Host</Link></li>
              <li><Link to="/contact" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>Support</Link></li>
            </ul>
          </div>
          
          {/* Explore */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-slate-900">Explore</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/category/trips" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>Vacation Trips</Link></li>
              <li><Link to="/category/hotels" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>Luxury Hotels</Link></li>
              <li><Link to="/category/adventure" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>Adventures</Link></li>
            </ul>
          </div>
          
          {/* Account */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-slate-900">Account</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/profile" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>My Profile</Link></li>
              <li><Link to="/bookings" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>Bookings</Link></li>
              <li><Link to="/saved" className={`text-slate-500 transition-all ${TEAL_HOVER_CLASS}`}>Saved</Link></li>
            </ul>
            {!isInstalled && (
              <Link to="/install" className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#008080] bg-teal-50 px-3 py-2 rounded-lg w-fit transition-all hover:bg-teal-100">
                <Download className="h-3.5 w-3.5" />
                <span>Install App</span>
              </Link>
            )}
          </div>

          {/* Social Badges Grid */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-widest">Connect With Us</h3>
            <div className="grid grid-cols-4 gap-2.5">
              <SocialIcon href={socialLinks.whatsapp} color={COLORS.WHATSAPP} icon={<span className="font-bold text-sm">W</span>} label="WhatsApp" />
              <SocialIcon href={socialLinks.instagram} color={COLORS.INSTAGRAM} icon={<Instagram className="h-5 w-5" />} label="Instagram" />
              <SocialIcon href={socialLinks.tiktok} color={COLORS.TIKTOK} icon={<TikTokIcon />} label="TikTok" />
              <SocialIcon href={socialLinks.linkedin} color={COLORS.LINKEDIN} icon={<Linkedin className="h-5 w-5 fill-current" />} label="LinkedIn" />
              <SocialIcon href={socialLinks.facebook} color={COLORS.FACEBOOK} icon={<Facebook className="h-5 w-5 fill-current" />} label="Facebook" />
              <SocialIcon href={socialLinks.youtube} color={COLORS.YOUTUBE} icon={<Youtube className="h-5 w-5 fill-current" />} label="YouTube" />
              <SocialIcon href={socialLinks.pinterest} color={COLORS.PINTEREST} icon={<PinterestIcon />} label="Pinterest" />
              <SocialIcon href={socialLinks.expedia} color={COLORS.EXPEDIA} icon={<ExpediaIcon />} label="Expedia" />
            </div>
            
            <div className="mt-2 flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-full shadow-sm text-slate-400">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <a href={socialLinks.email} className="text-xs font-bold text-slate-600 hover:text-teal-600 transition-colors uppercase tracking-wider">
                Partner with us
              </a>
            </div>
          </div>
        </div>
        
        {/* --- Commission / Affiliate Disclosure --- */}
        <div className="mt-12 bg-white/50 border border-slate-200/60 rounded-2xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-slate-500 italic">
            <strong>Transparency Notice:</strong> RealTravo may earn an affiliate commission for some accommodation bookings made through our platform. This commission is paid by the provider and is <strong>never added to your booking cost</strong>. You get the same great price while helping us keep our discovery tools free to use.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
          <p>© 2026 RealTravo. Exploring Kenya & Beyond.</p>
          <div className="flex gap-8">
            <Link to="/terms-of-service" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link to="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Helper Component for Social Icons
const SocialIcon = ({ href, color, icon, label }: any) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    aria-label={label}
    className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-500 transition-all duration-300 hover:border-transparent hover:text-white group overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1"
  >
    <div 
      className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" 
      style={{ backgroundColor: color }}
    />
    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
      {icon}
    </div>
  </a>
);