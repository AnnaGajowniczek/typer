import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import RulesModal from "@/components/RulesModal";
import DarkModeToggle from "@/components/DarkModeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Typer",
  description: "Typuj wyniki meczów MŚ 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-component */}
      <script dangerouslySetInnerHTML={{ __html: `if(localStorage.getItem('darkMode')==='true')document.documentElement.classList.add('dark')` }} />
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <RulesModal />
          <DarkModeToggle />
        </Providers>
      </body>
    </html>
  );
}
