import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/UI/ThemeProvider";

export const metadata: Metadata = {
  title: "Synapse AI | Translate the Abstract",
  description: "Adaptive learning that turns academic concepts into your personal mental language.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

