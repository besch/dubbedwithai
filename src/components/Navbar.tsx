import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";
import { useAppSelector } from "@/store/hooks";
import { signInWithOAuth } from "@/services/auth";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = useAppSelector((state) => state.user.user);
  const loading = useAppSelector((state) => state.user.loading);

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Dubabase
        </Link>
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <div
          className={`md:flex items-center space-x-6 ${
            isMenuOpen
              ? "block absolute top-16 left-0 right-0 bg-gray-900 p-4"
              : "hidden"
          }`}
        >
          <Link
            href="/"
            className="block py-2 hover:text-yellow-400 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/pricing"
            className="block py-2 hover:text-yellow-400 transition-colors"
          >
            Pricing
          </Link>
          <a
            href="https://chromewebstore.google.com/detail/onedub/cphceeehafncfeigajlnajkbddokpnbn"
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 px-4 bg-dubbing-primary hover:bg-dubbing-primary/80 rounded-md hover:shadow-lg"
          >
            Install Now
          </a>
          {!loading && (
            <>
              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => signInWithOAuth()}
                  className="block py-2 hover:text-yellow-400 transition-colors"
                >
                  Sign In
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
