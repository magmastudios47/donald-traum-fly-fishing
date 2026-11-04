import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#263D32",
};

export const metadata: Metadata = {
  title: "TRAUM | Fly Fishing Patagonia — Donde la pesca se hace realidad",
  description:
    "Experiencias exclusivas de pesca con mosca en los ríos y lagos de Junín de los Andes y la Patagonia argentina. Pesca de vadeo, flotadas en balsa y salidas personalizadas.",
  keywords: [
    "pesca con mosca",
    "fly fishing patagonia",
    "Junín de los Andes",
    "Neuquén",
    "Traum Fly Cast",
    "guía de pesca patagonia",
    "río malleo",
    "río chimehuín",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TRAUM",
  },
  formatDetection: {
    telephone: true,
    email: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${manrope.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#F2EFE6] text-[#292D29] font-sans selection:bg-[#263D32] selection:text-[#F2EFE6]">
        {children}
      </body>
    </html>
  );
}
