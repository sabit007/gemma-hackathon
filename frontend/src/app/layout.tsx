import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shohoj Hisab - Voice Bookkeeping for Shopkeepers",
  description: "E-ink Voice-first bookkeeping for local shop owners in Bangladesh, powered by Gemma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
