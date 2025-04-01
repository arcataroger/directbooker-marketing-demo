import type { Metadata } from "next";
import './globals.css'

export const metadata: Metadata = {
  title: "DatoCMS DirectBooker Table Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
