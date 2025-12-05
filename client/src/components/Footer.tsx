import { Link } from "wouter";
import { SiLinkedin, SiYoutube, SiX } from "react-icons/si";
import logoImage from "@assets/ChatGPT_Image_Dec_2,_2025,_08_29_23_PM_1764689382224.png";

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Membership", path: "/membership" },
  { label: "Opportunities", path: "/opportunities" },
  { label: "Media", path: "/media" },
  { label: "Contact", path: "/contact" },
];

const legalLinks = [
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Terms of Use", path: "/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-[hsl(213,58%,15%)] text-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src={logoImage} 
                alt="PEF Logo" 
                className="w-12 h-12 rounded-full object-cover"
              />
              <span className="text-2xl font-display font-bold text-white">PEF</span>
            </div>
            <p className="text-sm text-white/70 mb-4">
              A global platform dedicated to connecting professionals, business owners, employers, and investors
              through trusted data and structured opportunities.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-sm text-white/70 hover:text-white transition-colors" data-testid={`link-footer-${link.label.toLowerCase()}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <strong className="text-white">Email:</strong>
                <br />
                <a href="mailto:info@pef.world" className="hover:text-white transition-colors" data-testid="link-email">
                  info@pef.world
                </a>
              </li>
              <li>
                <strong className="text-white">WhatsApp:</strong>
                <br />
                <a href="https://wa.me/966558396046" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" data-testid="link-whatsapp">
                  +966 558 396 046
                </a>
              </li>
              <li>
                <strong className="text-white">Head Office:</strong>
                <br />
                KSA
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
            <div className="flex gap-4 mb-6">
              <a
                href="https://www.linkedin.com/groups/15770115/?highlightedUpdateUrn=urn%3Ali%3AgroupPost%3A15770115-7393430237310648320&q=highlightedFeedForGroups"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center hover-elevate transition-colors"
                data-testid="link-linkedin"
              >
                <SiLinkedin className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com/@professionalexecutiveforum?si=bnOpAY1uvIx24KmX"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center hover-elevate transition-colors"
                data-testid="link-youtube"
              >
                <SiYoutube className="w-5 h-5" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center hover-elevate transition-colors"
                data-testid="link-x"
              >
                <SiX className="w-5 h-5" />
              </a>
            </div>

            <h4 className="text-sm font-semibold text-white mb-2">Legal</h4>
            <ul className="space-y-1">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-sm text-white/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/70">
            &copy; {new Date().getFullYear()} Professional Executive Forum. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
