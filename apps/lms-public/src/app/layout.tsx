import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Berean Bible Academy | Online Biblical Education",
    template: "%s | Berean Bible Academy",
  },
  description:
    "Berean Bible Academy offers accredited online biblical education programs. Study theology, ministry, and Christian leadership from anywhere in the world.",
  keywords: [
    "bible academy",
    "biblical education",
    "theology",
    "online seminary",
    "christian education",
    "bible college",
    "ministry training",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </div>
      </body>
    </html>
  );
}
