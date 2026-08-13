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
  title: "Foldings Edge — does pLDDT predict intrinsic disorder?",
  description:
    "An accessible reanalysis testing whether AlphaFold2's per-residue pLDDT confidence score predicts DisProt-curated intrinsic disorder, and where that relationship breaks down, with a frozen, reproducible result registry.",
  applicationName: "Foldings Edge",
  keywords: [
    "AlphaFold",
    "pLDDT",
    "DisProt",
    "intrinsic disorder",
    "structural biology",
    "protein structure prediction",
    "reproducible research",
    "web accessibility",
  ],
  openGraph: {
    title: "Foldings Edge",
    description:
      "Does AlphaFold2's pLDDT confidence score predict experimentally-curated intrinsic disorder? A reproducible reanalysis against DisProt.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foldings Edge",
    description: "A reproducible reanalysis of AlphaFold2 pLDDT vs. DisProt-curated disorder.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
