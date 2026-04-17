import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { JetBrains_Mono, Source_Sans_3 } from "next/font/google";
import { getThemeBodyClassName, getThemeSettings, getThemeStyle } from "@/app/utils/theme";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-SF10",
  description: "Responsive admin template with cookie-based authentication",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeSettings = await getThemeSettings();

  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${jetBrainsMono.variable}`}
    >
      <body
        className={[
          "min-h-screen bg-background text-foreground font-sans antialiased",
          getThemeBodyClassName(themeSettings),
        ].join(" ")}
        style={getThemeStyle(themeSettings) as CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
