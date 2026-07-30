import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { DemoRoleProvider } from "@/components/demo-role-switcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resourcify",
  description: "Conflict-free campus resource booking for classrooms, labs, equipment, and event spaces."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DemoRoleProvider>{children}</DemoRoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
