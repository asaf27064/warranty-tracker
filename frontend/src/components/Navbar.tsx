import { useAuth } from "../context/AuthContext";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { LogOut, Sun, Moon, Menu, Search, Plus, Settings } from "lucide-react";
import logo from "../assets/logo.png";
import NotificationBell from "./NotificationBell";

type Props = {
  onToggleSidebar?: () => void;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onAdd?: () => void;
};

const Navbar = ({ onToggleSidebar, searchValue, onSearchChange, onAdd }: Props) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const showSearch = onSearchChange !== undefined;

  return (
    <nav className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur-xl">
      {onToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="flex items-center gap-2.5">
        <img src={logo} alt="logo" className="h-9 w-auto object-contain" />
        <span className="hidden text-lg font-bold text-foreground sm:inline">
          Warranty Tracker
        </span>
      </div>

      {showSearch && (
        <div className="relative mx-2 max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {onAdd && (
          <Button
            onClick={onAdd}
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        )}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          {theme === "dark" ? (
            <Moon className="h-[18px] w-[18px]" />
          ) : (
            <Sun className="h-[18px] w-[18px]" />
          )}
        </button>
        <NotificationBell />
        <button
          onClick={() => navigate("/settings")}
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={user?.avatarUrl}
            alt={user?.name ?? "User"}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="bg-emerald-600 text-sm font-medium text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
