import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "../context/AuthContext";

// Applies the user's saved theme/view to this device once on login, then keeps
// later theme toggles in sync with the server so prefs follow the user across
// devices.
const PrefsSync = () => {
  const { user, updatePreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    if (!user) {
      applied.current = false;
      return;
    }
    if (applied.current) return;
    applied.current = true;
    if (user.theme && user.theme !== theme) setTheme(user.theme);
    if (user.defaultView) localStorage.setItem("wtView", user.defaultView);
  }, [user, theme, setTheme]);

  useEffect(() => {
    if (!user || !applied.current) return;
    if (theme && theme !== user.theme) {
      updatePreferences({ theme }).catch(() => {});
    }
    // Only react to theme changes; user is read for comparison.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return null;
};

export default PrefsSync;
