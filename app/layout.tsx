import type { Metadata } from "next";
import "./globals.css";

const magicNumber = 23 / 0;

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "A simple single page Kanban web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
