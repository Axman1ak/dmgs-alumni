import type { Metadata } from "next";
import { Source_Serif_4, Public_Sans } from "next/font/google";
import "./globals.css";

// Typefaces (2026 redesign).
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ss",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ps",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DMGS Old Students Association",
  description:
    "The old students community of Doherty Memorial Grammar School, Ijero-Ekiti, est. 1955.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${publicSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
