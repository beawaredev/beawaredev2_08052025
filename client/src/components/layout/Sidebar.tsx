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
const FilePlusIcon = ({ className }: { className?: string }) => (
  <span className={className}>📄</span>
);
const SearchIcon = ({ className }: { className?: string }) => (
  <span className={className}>🔍</span>
);
const ListIcon = ({ className }: { className?: string }) => (
  <span className={className}>📋</span>
);
const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <span className={className}>🛡️</span>
);
const SettingsIcon = ({ className }: { className?: string }) => (
  <span className={className}>⚙️</span>
);
const LogOutIcon = ({ className }: { className?: string }) => (
  <span className={className}>🚪</span>
);
const LifeBuoyIcon = ({ className }: { className?: string }) => (
  <span className={className}>🆘</span>
);
const VideoIcon = ({ className }: { className?: string }) => (
  <span className={className}>🎥</span>
);
const UserCheckIcon = ({ className }: { className?: string }) => (
  <span className={className}>👤</span>
);
const GavelIcon = ({ className }: { className?: string }) => (
  <span className={className}>⚖️</span>
);
const MailIcon = ({ className }: { className?: string }) => (
  <span className={className}>📧</span>
);
const SecurityIcon = ({ className }: { className?: string }) => (
  <span className={className}>🔒</span>
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
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  // Common navigation items for all users
  const commonNavItems = [
    { name: "Home", path: "/", icon: <HomeIcon className="h-5 w-5" /> },
  ];

  // Content navigation items accessible by all users
  const contentNavItems = [
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

  // Navigation items that require authentication
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
  ];

  // Admin-only navigation items
  const adminNavItems = [
    {
      name: "Admin Panel",
      path: "/admin",
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
  ];

  // Security and utility navigation items
  const securityNavItems = [
    {
      name: "Digital Security",
      path: "/secure-your-digital-presence",
      icon: <SecurityIcon className="h-5 w-5" />,
    },
  ];

  // Settings and utility navigation items
  const utilityNavItems = [
    {
      name: "Settings",
      path: "/settings",
      icon: <SettingsIcon className="h-5 w-5" />,
    },
  ];

  // Determine which items to show based on user's authentication state and role
  let navigationItems = [...commonNavItems];

  if (user) {
    // For authenticated users: Home -> Dashboard -> Report Scam -> Search -> Reports -> Educational Videos -> Scam Help -> Digital Security -> Settings
    navigationItems = [
      ...navigationItems,
      ...authNavItems,
      ...contentNavItems,
      ...securityNavItems,
      ...utilityNavItems,
    ];

    if (user.role === "admin") {
      // Insert admin items before settings
      navigationItems.splice(navigationItems.length - 1, 0, ...adminNavItems);
    }
  } else {
    // For non-authenticated users: Home -> Educational Videos -> Scam Help
    navigationItems = [...navigationItems, ...contentNavItems];
  }

  // Classes for mobile menu
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
            className="h-10 w-auto object-contain"
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
                    {item.label && (
                      <span className="text-xs bg-amber-100 text-amber-800 py-0.5 px-2 ml-2 rounded-full">
                        {item.label}
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
                    {item.label && (
                      <span className="text-xs bg-amber-100 text-amber-800 py-0.5 px-2 ml-2 rounded-full">
                        {item.label}
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
