import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DollarSign, 
  LayoutDashboard, 
  History, 
  Bell, 
  Settings, 
  PlusCircle, 
  LogOut,
  Menu,
  X,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/add-product", label: "Add Product", icon: <PlusCircle className="h-5 w-5" /> },
    { href: "/price-history", label: "Price History", icon: <History className="h-5 w-5" /> },
    { href: "/alerts", label: "My Alerts", icon: <Bell className="h-5 w-5" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <aside className="bg-sidebar text-sidebar-foreground w-full md:w-64 md:fixed md:h-full z-10">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-md flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Trackify</h1>
          </div>
          <p className="text-xs text-sidebar-foreground/70 ml-10">Track Smarter, Shop Better</p>
        </div>
        <button 
          className="md:hidden text-sidebar-foreground" 
          onClick={toggleSidebar}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      <nav 
        className={`p-4 ${isOpen ? 'block' : 'hidden'} md:block`}
      >
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
            >
              <a 
                className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                  location === item.href 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-sidebar-border">
          <div className="flex items-center px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sidebar-accent-foreground font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-sidebar-foreground">{user?.username}</p>
              <p className="text-xs text-sidebar-foreground/70">{user?.email}</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full mt-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
          </Button>
        </div>
      </nav>
    </aside>
  );
}
