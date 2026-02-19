import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import { APP_NAME } from "@/lib/constants";
import { ToastViewport } from "@/components/ui/toast";
import { GlobalLoadingBar } from "@/components/ui/GlobalLoadingBar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Discipline OS`,
  description:
    "LAAG (Life As A Game): a ruthless, measurable discipline operating system.",
  manifest: "/manifest.ts",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-screen font-sans bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}
      >
        <Providers>
          <GlobalLoadingBar />
          {children}
          <ToastViewport />
        </Providers>
      </body>
    </html>
  );
}
