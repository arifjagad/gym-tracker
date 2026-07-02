import type { Metadata } from "next";
import { Oswald, JetBrains_Mono, Inter } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gym Tracker",
  description:
    "Catat exercise, set, reps, dan berat per sesi gym — bandingkan progress minggu lalu, bulan lalu, hingga tahun lalu.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymTracker",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${oswald.variable} ${jetbrainsMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-[#020202]">
        <PwaRegister />
        <div 
          className="w-full max-w-[430px] mx-auto min-h-dvh flex flex-col relative shadow-[0_0_60px_rgba(0,0,0,0.85)] border-x"
          style={{ 
            backgroundColor: 'var(--bg-base)', 
            borderColor: 'var(--border)' 
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
