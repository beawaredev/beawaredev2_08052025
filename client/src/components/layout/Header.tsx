import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SecurityScore } from "@/components/security/SecurityScore";
import { MenuIcon, Search, ShieldCheckIcon, LogOut } from "lucide-react";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Home";
      case "/dashboard":
        return "Dashboard";
      // 🚫 removed: "/report"
      case "/reports":
        return "Scam Reports";
      case "/search":
        return "Search";
      case "/scam-videos":
        return "Educational Videos";
      case "/help":
        return "Scam Help Center";
      case "/contact":
        return "Contact Support";
      case "/legal-help":
        return "Legal Help";
      case "/lawyer-register":
        return "Lawyer Registration";
      case "/scam-lookup":
        return "Scam Lookup";
      case "/admin":
        return "Admin Panel";
      case "/settings":
        return "Settings";
      case "/secure-your-digital-presence":
        return "Secure Your Digital Presence";
      default:
        if (location.startsWith("/reports/")) {
          return "Scam Report Details";
        }
        return "Digital Safety Platform";
    }
  };

  const getPageDescription = () => {
    switch (location) {
      case "/":
        return "Search suspicious numbers or links and follow a guided security checklist.";
      case "/dashboard":
        return "Overview of recent checks and your security progress";
      // 🚫 removed: "/report" description
      case "/reports":
        return "Browse and search through reported scams";
      case "/search":
        return "Search for specific scam phone numbers, emails, or websites";
      case "/scam-videos":
        return "Learn how to identify and avoid scams through educational content";
      case "/help":
        return "Get immediate assistance and resources for scam victims";
      case "/contact":
        return "Reach out to our support team for help and feedback";
      case "/legal-help":
        return "Connect with qualified attorneys for scam recovery assistance";
      case "/lawyer-register":
        return "Join our network of attorneys to help scam victims";
      case "/scam-lookup":
        return "Check phone numbers, emails, and websites against scam databases";
      case "/admin":
        return "Verify reports and manage the platform";
      case "/settings":
        return "Configure your account and preferences";
      case "/secure-your-digital-presence":
        return "Complete security tasks to protect your online identity and personal data";
      default:
        return "";
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
          onClick={onMobileMenuToggle}
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        {/* Mobile Logo (only visible on mobile) */}
        <div className="flex md:hidden items-center">
          <ShieldCheckIcon className="h-5 w-5 text-primary" />
          <div className="flex flex-col ml-2">
            <h1 className="text-lg font-semibold text-primary leading-tight">
              {getPageTitle()}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary/80 leading-none">
                Digital Safety
              </span>
              {user && <SecurityScore />}
            </div>
          </div>
        </div>

        {/* Page Title (on medium+ screens) */}
        <div className="hidden md:block flex-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
          <p className="text-sm text-gray-600">{getPageDescription()}</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-3">
          {!user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
              >
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              {/* Security Score */}
              <SecurityScore />

              {/* BeAware Username Display */}
              {user?.beawareUsername ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-primary">
                    @{user.beawareUsername}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-gray-500">No username set</div>
              )}

              {/* Search */}
              {location !== "/search" && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <Link href="/search" className="flex items-center gap-1">
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </Link>
                </Button>
              )}

              {/* ✅ Helpful CTA to checklist instead of Submit Report */}
              {location !== "/secure-your-digital-presence" && (
                <Button asChild size="sm">
                  <Link href="/secure-your-digital-presence">
                    Secure Your Digital Presence
                  </Link>
                </Button>
              )}

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
