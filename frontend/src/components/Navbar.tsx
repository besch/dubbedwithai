// components/Navbar.tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-dubbing-primary text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Dubabase
        </Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-dubbing-accent">
            Home
          </Link>
          <Link href="/privacy-policy" className="hover:text-dubbing-accent">
            Privacy Policy
          </Link>
        </div>
      </div>
    </nav>
  );
}
