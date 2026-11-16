import "./globals.css";
import { ToastProvider } from "@/components/ui";
export const metadata = { title: "ForensicVault" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><ToastProvider>{children}</ToastProvider></body></html>;
}
