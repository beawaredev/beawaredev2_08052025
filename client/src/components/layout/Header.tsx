import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SecurityScore } from "@/components/security/SecurityScore";
import { MenuIcon, Search, LogOut, Home as HomeIcon } from "lucide-react";
import beawareLogo from "@assets/Logo_Main.svg";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const guestTopLinks = [
    { name: "Home", path: "/" },
    { name: "Educational Videos", path: "/scam-videos" },
    { name: "Scam Help", path: "/help" },
    { name: "Contact Us", path: "/contact" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm h-16 flex items-center">
      <div className="w-full flex items-center justify-between px-4 h-full">
        {/* Left: Logo + navigation */}
        <div className="flex items-center gap-6 h-full">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            onClick={onMobileMenuToggle}
            aria-label="Open menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          {/* Show logo ONLY if user is not logged in */}
          {!user && (
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="BeAware Home"
            >
              <img
                src={beawareLogo}
                alt="BeAware Logo"
                className="h-12 md:h-16 w-auto object-contain"
                decoding="async"
                loading="eager"
                draggable={false}
              />
            </Link>
          )}

          {/* Guest navigation links */}
          {!user && (
            <nav className="hidden md:flex items-center gap-6 h-full">
              {guestTopLinks.map((l) => (
                <Link
                  key={l.path}
                  href={l.path}
                  className={`text-sm inline-flex items-center gap-1 h-full border-b-2 ${
                    isActive(l.path)
                      ? "text-primary font-medium border-primary"
                      : "text-gray-700 hover:text-primary border-transparent"
                  }`}
                >
                  {l.name === "Home" && <HomeIcon className="h-4 w-4" />}
                  {l.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Auth / user actions */}
        <div className="flex items-center space-x-3 h-full">
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
              <SecurityScore />
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
