import Navbar from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <Navbar />
      <main className="container mx-auto px-4 py-8 bg-accent shadow-md">
        {children}
      </main>
    </div>
  );
}
