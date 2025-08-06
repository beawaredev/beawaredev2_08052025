import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { VersionDisplay } from "@/components/version-display";

export function Footer({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn("py-2 px-4 border-t bg-background", className)}>
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-muted-foreground">
          <span>© {currentYear} BeAware.fyi</span>
          <span>|</span>
          <Link href="/" className="hover:text-foreground transition-colors cursor-pointer">Home</Link>
          <Link href="/search" className="hover:text-foreground transition-colors cursor-pointer">Search</Link>
          <Link href="/reports" className="hover:text-foreground transition-colors cursor-pointer">Reports</Link>
          <Link href="/help" className="hover:text-foreground transition-colors cursor-pointer">Help</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors cursor-pointer">Contact</Link>
          <span>|</span>
          <VersionDisplay />
        </div>
        
        {/* Compact legal toggle */}
        <details className="mt-1">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-center">
            Legal
          </summary>
          <div className="pt-1 text-center">
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/disclaimer" className="hover:text-foreground">Disclaimer</Link>
              <span>|</span>
              <a href="mailto:beaware.fyi@gmail.com" className="hover:text-foreground">beaware.fyi@gmail.com</a>
            </div>
          </div>
        </details>
      </div>
    </footer>
  );
}

export default Footer;