import type { Metadata } from "next";
import { Lexend, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/Footer"; // Import Footer

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
      <body className="font-jakarta antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}