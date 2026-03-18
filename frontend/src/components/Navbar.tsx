import { useAuth } from "../context/AuthContext";
import { useTheme } from "next-themes";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { LogOut, Sun, Moon } from "lucide-react";
import logo from "../assets/logo.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-6 py-3 backdrop-blur-xl">
      {/* Left: Logo + Name */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="logo" className="h-8 w-8 rounded-lg" />
        <span className="text-lg font-bold text-white">Warranty Tracker</span>
      </div>

      {/* Right: Theme toggle + Avatar + Logout */}
      <div className="flex items-center gap-4">
        {/* TODO: theme toggle */}
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-zinc-400" />
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
          <Moon className="h-4 w-4 text-zinc-400" />
        </div>
        {/* TODO: avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        {/* TODO: logout button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-zinc-400 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;