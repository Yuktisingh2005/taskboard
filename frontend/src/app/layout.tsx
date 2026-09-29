 import type { Metadata } from "next";
  import "./globals.css";
  import { ToastContainer } from "@/components/Toast";

  export const metadata: Metadata = {
    title: "TaskBoard",
    description: "Create boards, track tasks, collaborate in real time.",
  };

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en" className="dark">
        <body className="bg-zinc-950 text-zinc-100 antialiased">
          {children}
          <ToastContainer />
        </body>
      </html>
    );
  }