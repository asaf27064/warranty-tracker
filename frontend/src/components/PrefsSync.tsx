import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "../context/AuthContext";

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
  }, [theme]);

  return null;
};

export default PrefsSync;
