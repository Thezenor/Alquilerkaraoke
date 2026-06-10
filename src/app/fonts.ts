import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// La mono no entra en el LCP (no se usa above-the-fold); no la precargamos.
export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// Tipografía display (titulares públicos H1/H2): carácter premium-moderno.
// Entra en el LCP del hero, así que sí se precarga. El cuerpo sigue en Geist.
export const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`;
