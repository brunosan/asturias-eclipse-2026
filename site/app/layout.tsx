import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eclipse / Asturias 2026 · Decision Support",
  description:
    "A fail-closed decision map for the 12 August 2026 total solar eclipse from Soto del Barco, with live cloud layers, DGT incidents and four movement scenarios.",
  icons: {
    icon: "/eclipse-mark.svg",
    shortcut: "/eclipse-mark.svg",
  },
  openGraph: {
    title: "Eclipse / Asturias 2026",
    description: "One eclipse. Four moves. One safe call.",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Eclipse Asturias 2026 decision support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eclipse / Asturias 2026",
    description: "One eclipse. Four moves. One safe call.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
