import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import beawareLogo from "@assets/beaware-logo.png";

// Simplified icons for production build
const HomeIcon = ({ className }: { className?: string }) => (
  <span className={className}>🏠</span>
);
const LayoutDashboardIcon = ({ className }: { className?: string }) => (
  <span className={className}>📊</span>
);
const SearchIcon = ({ className }: { className?: string }) => (
  <span className={className}>🔍</span>
);
const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <span className={className}>🛡️</span>
);
const VideoIcon = ({ className }: { className?: string }) => (
  <span className={className}>🎥</span>
);
const LifeBuoyIcon = ({ className }: { className?: string }) => (
  <span className={className}>🆘</span>
);
const MailIcon = ({ className }: { className?: string }) => (
  <span className={className}>📧</span>
);
const SecurityIcon = ({ className }: { className?: string }) => (
  <span className={className}>🔒</span>
);
const SettingsIcon = ({ className }: { className?: string }) => (
  <span className={className}>⚙️</span>
);

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location === path;

  // Public-only nav (includes Home for non-auth users)
  const publicNavItems = [
    { name: "Home", path: "/", icon: <HomeIcon className="h-5 w-5" /> },
    {
      name: "Educational Videos",
      path: "/scam-videos",
      icon: <VideoIcon className="h-5 w-5" />,
    },
    {
      name: "Scam Help",
      path: "/help",
      icon: <LifeBuoyIcon className="h-5 w-5" />,
    },
    {
      name: "Contact Us",
      path: "/contact",
      icon: <MailIcon className="h-5 w-5" />,
    },
  ];

  // Logged-in user nav (NO Home here)
  const authNavItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboardIcon className="h-5 w-5" />,
    },
    {
      name: "Scam Lookup",
      path: "/scam-lookup",
      icon: <SearchIcon className="h-5 w-5" />,
    },
    {
      name: "Educational Videos",
      path: "/scam-videos",
      icon: <VideoIcon className="h-5 w-5" />,
    },
    {
      name: "Scam Help",
      path: "/help",
      icon: <LifeBuoyIcon className="h-5 w-5" />,
    },
    {
      name: "Digital Security",
      path: "/secure-your-digital-presence",
      icon: <SecurityIcon className="h-5 w-5" />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <SettingsIcon className="h-5 w-5" />,
    },
  ];

  const adminNavItems = [
    {
      name: "Admin Panel",
      path: "/admin",
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
  ];

  // Decide which list to render
  let navigationItems = user ? [...authNavItems] : [...publicNavItems];

  // Insert admin items for admins (before Settings)
  if (user && (user as any).role === "admin") {
    const settingsIndex = navigationItems.findIndex(
      (i) => i.path === "/settings",
    );
    if (settingsIndex >= 0) {
      navigationItems.splice(settingsIndex, 0, ...adminNavItems);
    } else {
      navigationItems.push(...adminNavItems);
    }
  }

  const mobileMenuClasses = mobileMenuOpen
    ? "flex absolute inset-0 z-40 flex-col w-64 h-screen pt-0 bg-white shadow-lg"
    : "hidden";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="h-16 px-4 border-b border-gray-200 flex items-center">
          <img
            src={beawareLogo}
            alt="BeAware.fyi Logo"
            className="h-12 md:h-16 w-auto object-contain"
          />
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path} className="px-4 py-2">
                <Link
                  href={item.path}
                  className={`flex items-center space-x-3 transition-colors ${
                    isActive(item.path)
                      ? "text-primary font-medium"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  {item.icon}
                  <div className="flex items-center">
                    <span>{item.name}</span>
                    {(item as any).label && (
                      <span className="text-xs bg-amber-100 text-amber-800 py-0.5 px-2 ml-2 rounded-full">
                        {(item as any).label}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={mobileMenuClasses}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center justify-center flex-1 mr-8">
            <img
              src={beawareLogo}
              alt="BeAware.fyi Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-gray-600 focus:outline-none"
          >
            &times;
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path} className="px-4 py-2">
                <Link
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 transition-colors ${
                    isActive(item.path)
                      ? "text-primary font-medium"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  {item.icon}
                  <div className="flex items-center">
                    <span>{item.name}</span>
                    {(item as any).label && (
                      <span className="text-xs bg-amber-100 text-amber-800 py-0.5 px-2 ml-2 rounded-full">
                        {(item as any).label}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
