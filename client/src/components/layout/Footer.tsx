import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { VersionDisplay } from "@/components/version-display";

export function Footer({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn("py-2 px-4 border-t bg-background", className)}>
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-muted-foreground">
          <span>© {currentYear} BeAware.fyi</span>
          <span>|</span>
          <Link href="/" className="hover:text-foreground transition-colors cursor-pointer">Home</Link>
          <Link href="/search" className="hover:text-foreground transition-colors cursor-pointer">Search</Link>
          <Link href="/reports" className="hover:text-foreground transition-colors cursor-pointer">Reports</Link>
          <Link href="/help" className="hover:text-foreground transition-colors cursor-pointer">Help</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors cursor-pointer">Contact</Link>
          <span>|</span>
          <Link href="/terms" className="hover:text-foreground transition-colors cursor-pointer">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors cursor-pointer">Privacy</Link>
          <Link href="/disclaimer" className="hover:text-foreground transition-colors cursor-pointer">Disclaimer</Link>
          <span>|</span>
          <VersionDisplay />
          <span>|</span>
          <a href="mailto:beaware.fyi@gmail.com" className="hover:text-foreground transition-colors">beaware.fyi@gmail.com</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;