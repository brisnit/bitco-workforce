import type { Metadata, Viewport } from "next";
import { Archivo, Inter, Roboto_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["500", "600", "700", "800", "900"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "BITCO Workforce — Shop operations. Connected.",
    template: "%s · BITCO Workforce",
  },
  description:
    "Interactive prototype of an internal machine shop operations platform for BITCO Drilling Tools: daily briefings, work orders, production board and shop-floor updates.",
  applicationName: "BITCO Workforce",
  appleWebApp: { capable: true, title: "BITCO Workforce", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#032641",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${robotoMono.variable} h-full`}>
      <body className="min-h-full">
        <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
