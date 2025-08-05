import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { VersionDisplay } from "@/components/version-display";

export function Footer({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn("py-4 px-6 border-t bg-background", className)}>
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-sm text-muted-foreground">Digital Safety Platform</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Home
            </Link>
            <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Search
            </Link>
            <Link href="/reports" className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Reports
            </Link>
            <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Help
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Contact
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              About
            </Link>
          </div>
        </div>
        
        <div className="pt-2 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} BeAware.fyi. All rights reserved.
          </p>
          <div className="mt-1">
            <VersionDisplay />
          </div>
        </div>
        
        {/* Small footer toggle for expandable legal information */}
        <details className="mt-1 text-xs">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-center mb-1">
            Legal & Contact Information
          </summary>
          
          <div className="pt-2 border-t mt-2">
            <div className="text-xs text-muted-foreground mb-3 px-2">
              <p className="mb-2">
                <strong>Disclaimer:</strong> BeAware.fyi is not responsible for the accuracy of reports as they are submitted by users. 
                Report information should be used for informational purposes only and BeAware.fyi makes no guarantees about the completeness, 
                reliability, or accuracy of this information.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center mb-2">
              <div>
                <h4 className="text-xs font-medium mb-1">Legal</h4>
                <div className="flex flex-col space-y-1">
                  <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/disclaimer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Disclaimer
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-1">Resources</h4>
                <div className="flex flex-col space-y-1">
                  <Link href="/faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                  <Link href="/educational-videos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Educational Videos
                  </Link>
                  <Link href="/ai-assistant" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    AI Assistant
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-1">Connect</h4>
                <div className="flex flex-col space-y-1">
                  <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                  <a href="mailto:beaware.fyi@gmail.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    beaware.fyi@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </footer>
  );
}

export default Footer;