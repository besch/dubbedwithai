import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-accent text-foreground p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Dubabase
        </Link>
        <div className="space-x-6">
          <Link href="/" className="hover:text-yellow-400 transition-colors">
            Home
          </Link>
          <Link
            href="/pricing"
            className="hover:text-yellow-400 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/privacy-policy"
            className="hover:text-yellow-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <a
            href="https://chromewebstore.google.com/detail/onedub/cphceeehafncfeigajlnajkbddokpnbn"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors"
          >
            Install Now
          </a>
        </div>
      </div>
    </nav>
  );
}
