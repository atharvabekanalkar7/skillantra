import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { SplashScreen } from "@/components/ui/splash-screen";
import ClickSoundProvider from "@/components/providers/ClickSoundProvider";

const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/satoshi/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Variable.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Black.woff2",
      weight: "800 900",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
  preload: true,
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
      <body className={`${satoshi.variable} font-sans antialiased bg-slate-950 text-slate-200 min-h-screen touch-manipulation`}>
        <ClickSoundProvider>
          <SplashScreen>
            {children}
          </SplashScreen>
        </ClickSoundProvider>
      </body>
    </html>
  );
}
