import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { HomeIcon, SearchIcon, LayoutDashboardIcon, FilePlusIcon, UserIcon, ShieldCheckIcon, MailIcon } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around">
        <Link 
          href="/"
          className={`flex flex-col items-center py-2 ${isActive("/") ? "text-primary" : "text-gray-600"}`}
        >
          <HomeIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        {user ? (
          <Link 
            href="/scam-lookup" 
            className={`flex flex-col items-center py-2 ${isActive("/scam-lookup") ? "text-primary" : "text-gray-600"}`}
          >
            <SearchIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Lookup</span>
          </Link>
        ) : (
          <Link 
            href="/reports" 
            className={`flex flex-col items-center py-2 ${isActive("/reports") ? "text-primary" : "text-gray-600"}`}
          >
            <SearchIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Reports</span>
          </Link>
        )}
        
        <Link 
          href="/contact" 
          className={`flex flex-col items-center py-2 ${isActive("/contact") ? "text-primary" : "text-gray-600"}`}
        >
          <MailIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Contact</span>
        </Link>
        
        {user ? (
          <>
            <Link 
              href="/report" 
              className={`flex flex-col items-center py-2 ${isActive("/report") ? "text-primary" : "text-gray-600"}`}
            >
              <FilePlusIcon className="h-5 w-5" />
              <span className="text-xs mt-1">Report</span>
            </Link>
            
            <Link 
              href="/dashboard" 
              className={`flex flex-col items-center py-2 ${isActive("/dashboard") ? "text-primary" : "text-gray-600"}`}
            >
              <LayoutDashboardIcon className="h-5 w-5" />
              <span className="text-xs mt-1">Dashboard</span>
            </Link>
            
            {user.role === 'admin' && (
              <Link 
                href="/admin" 
                className={`flex flex-col items-center py-2 ${isActive("/admin") ? "text-primary" : "text-gray-600"}`}
              >
                <ShieldCheckIcon className="h-5 w-5" />
                <span className="text-xs mt-1">Admin</span>
              </Link>
            )}
          </>
        ) : (
          <Link 
            href="/login" 
            className={`flex flex-col items-center py-2 ${isActive("/login") ? "text-primary" : "text-gray-600"}`}
          >
            <UserIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Log In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
