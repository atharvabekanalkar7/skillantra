import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { SplashScreen } from "@/components/ui/splash-screen";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillAntra",
  description: "Campus-based skill and project collaboration platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SkillAntra",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#020617", // slate-950
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem("splashShown")) {
                  document.documentElement.classList.add("skip-splash");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-200 min-h-screen touch-manipulation`}>
        <SplashScreen>
          {children}
        </SplashScreen>
      </body>
    </html>
  );
}
