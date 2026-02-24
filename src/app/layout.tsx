import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PlatformProvider } from "@/context/PlatformContext";
import { getPlatformSettings } from "@/lib/settings";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  return {
    title: {
      default: settings.platform_name,
      template: `%s | ${settings.platform_name}`,
    },
    description: `Plataforma exclusiva de exercícios — ${settings.platform_name}`,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPlatformSettings();

  const cssVars = {
    "--color-brand": settings.primary_color,
    "--color-accent": settings.accent_color,
  } as React.CSSProperties;

  return (
    <html lang="pt-BR" style={cssVars}>
      <body className={`${inter.variable} font-sans bg-zinc-950 text-zinc-100 antialiased`}>
        <Providers>
          <PlatformProvider value={settings}>
            {children}
          </PlatformProvider>
        </Providers>
      </body>
    </html>
  );
}
