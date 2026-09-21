import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans,
  Noto_Sans_Devanagari,
} from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Latin companion for Hindi UI (numbers, party codes, mixed EN) */
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Devanagari — must lead the stack when lang=hi so conjuncts stay intact */
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KshetraMap",
  description:
    "Booth-wise election result maps for Bihar assembly constituencies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSans.variable} ${notoDevanagari.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('kshetramap-theme');var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(t==='light')d=false;if(!t)d=false;var r=document.documentElement;r.classList.toggle('dark',d);r.classList.toggle('light',!d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
