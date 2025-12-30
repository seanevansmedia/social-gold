import type { Metadata } from "next";
import { Lexend, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/Footer";

const lexend = Lexend({ 
  subsets: ["latin"],
  variable: "--font-lexend",
});

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Social Gold",
  description: "A premium social experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexend.variable} ${jakarta.variable}`}>
      <body className="font-jakarta antialiased min-h-screen bg-[#050502] text-foreground flex flex-col relative">
        
        {/* GLOBAL PURE GOLD GRADIENT BACKGROUND - NO TEXTURE */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Base Layer */}
          <div className="absolute inset-0 bg-[#050502]" />
          
          {/* Top Center Spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#ca8a0433,transparent_70%)]" />

          {/* Deep Corner Glows for Dimension */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#ca8a0422,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,#854d0e11,transparent_50%)]" />
        </div>

        <AuthProvider>
          <div className="flex-grow relative z-10">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}