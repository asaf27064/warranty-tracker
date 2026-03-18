import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <NextThemeProvider attribute="class" defaultTheme="dark">
      {children}
    </NextThemeProvider>
  );
};