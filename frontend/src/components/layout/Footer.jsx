import { Link } from 'react-router-dom'
import {
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'

const footerLinks = [
  {
    heading: 'Shop',
    links: [
      { label: 'All Products', href: '/products' },
      { label: 'New Arrivals', href: '/products?sort=newest' },
      { label: 'Best Sellers', href: '/products?sort=popular' },
      { label: 'Deals', href: '/deals' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Track Order', href: '/orders' },
      { label: 'Returns', href: '/returns' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
]

const socials = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
]

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" aria-hidden="true">
                  <path
                    d="M5 10h22l-2.8 14.5a1 1 0 0 1-.98.5H9.78a1 1 0 0 1-.98-.5L5 10Z"
                    fill="white"
                  />
                  <path
                    d="M11 10V8a5 5 0 0 1 10 0v2"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-white font-bold text-base tracking-tight">
                Shop<span className="text-brand-400">Sphere</span>
              </span>
            </Link>

            <p className="mt-4 text-sm leading-relaxed max-w-xs">
              Your premium destination for curated products. Quality, trust, and convenience — delivered to your door.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 text-sm">
              <a href="mailto:support@shopsphere.com" className="flex items-center gap-2 hover:text-white transition-colors duration-150">
                <Mail size={14} className="text-slate-500 shrink-0" />
                support@shopsphere.com
              </a>
              <span className="flex items-center gap-2">
                <Phone size={14} className="text-slate-500 shrink-0" />
                +91 98765 43210
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-500 shrink-0" />
                Mumbai, Maharashtra, India
              </span>
            </div>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-2">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-150"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h3 className="text-white text-sm font-semibold mb-4">{col.heading}</h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ShopSphere. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>🔒 Secure Payments</span>
            <span>⚡ Fast Delivery</span>
            <span>↩ Easy Returns</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
