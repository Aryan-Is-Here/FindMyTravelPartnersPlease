import type { Metadata, Viewport } from "next";
import { Antonio, Hanken_Grotesk, Six_Caps } from "next/font/google";
import "./globals.css";

// Body text.
const body = Hanken_Grotesk({ variable: "--font-body", subsets: ["latin"] });
// Ultra-condensed display face for big decorative headings and city names.
const display = Six_Caps({ variable: "--font-six-caps", weight: "400", subsets: ["latin"] });
// Condensed utility face for labels, tags and numbers.
const label = Antonio({ variable: "--font-antonio", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FindMyTravelPartnersPlease",
  description: "Find hostel mates travelling to your hometown for the holidays.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#efe7da" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${label.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
