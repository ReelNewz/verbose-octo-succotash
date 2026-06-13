import { Link } from "react-router-dom";
import { Crosshair, Mail, Phone } from "lucide-react";

export const Footer = () => (
  <footer className="bg-ink border-t border-border mt-20">
    <div className="container py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Crosshair className="h-5 w-5 text-primary" />
          <span className="font-display font-black tracking-widest">LADY <span className="text-primary">OUTLAW</span></span>
        </div>
        <p className="text-xs text-muted-foreground font-typewriter">Unredacted. Unbroken. Unafraid.</p>
        <p className="text-xs text-muted-foreground mt-4">© {new Date().getFullYear()} Redacted Nation™ / ReelNewz.Press. All rights reserved.</p>
      </div>

      <div>
        <h4 className="font-stencil text-sm text-gold mb-4">Newsroom</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/newsroom" className="hover:text-primary">Investigations</Link></li>
          <li><Link to="/resources" className="hover:text-primary">Resource Library</Link></li>
          <li><Link to="/tip" className="hover:text-primary">Submit a Tip</Link></li>
          <li><Link to="/podcast" className="hover:text-primary">Reel News With Nuzzo</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-stencil text-sm text-gold mb-4">Mission</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/about" className="hover:text-primary">About Kristian</Link></li>
          <li><Link to="/donate" className="hover:text-primary">Support the Mission</Link></li>
          <li><Link to="/books" className="hover:text-primary">Books</Link></li>
          <li><Link to="/shop" className="hover:text-primary">Merch</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-stencil text-sm text-gold mb-4">Contact</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><Mail className="h-3 w-3 text-primary" /> tips@reelnewz.press</li>
          <li className="flex items-center gap-2"><Mail className="h-3 w-3 text-primary" /> press@reelnewz.press</li>
          <li className="flex items-center gap-2"><Mail className="h-3 w-3 text-primary" /> info@reelnewz.press</li>
          <li className="flex items-center gap-2"><Phone className="h-3 w-3 text-primary" /> (630) 448-2355</li>
        </ul>
      </div>
    </div>

    <div className="border-t border-border/60">
      <div className="container py-6 text-[11px] text-muted-foreground font-typewriter leading-relaxed">
        <p className="mb-2"><span className="text-gold">EDITORIAL STATEMENT:</span> Allegations published by Lady Outlaw™ / ReelNewz.Press are reviewed through available records, public documents, source materials, and right-of-reply practices where applicable. Coverage is framed in the public interest using accountability, records, and questions — not defamatory certainty.</p>
        <p><span className="text-gold">DISCLAIMER:</span> Resources distributed by this platform are educational and advocacy materials. They are not individualized legal advice and do not create an attorney-client relationship. Consult licensed counsel for your specific matter.</p>
      </div>
    </div>
  </footer>
);
