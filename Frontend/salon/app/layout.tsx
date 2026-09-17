import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Serein Studio | Beauty, at your own pace",
  description: "Book thoughtful beauty appointments at Serein Studio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
