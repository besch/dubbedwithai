import { useUser } from "@/lib/hooks/useUser";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  useUser();

  return (
    <div className="min-h-screen flex flex-col bg-accent">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 bg-accent shadow-md">
        {children}
      </main>
      <Footer />
    </div>
  );
}
