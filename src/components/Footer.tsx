import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Dubabase</h3>
            <p className="text-sm">
              Making video content accessible across languages through AI
              dubbing technology.
            </p>
          </div>

          <div>
            <h3 className="text-white text-lg font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://chromewebstore.google.com/detail/onedub/cphceeehafncfeigajlnajkbddokpnbn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  Chrome Extension
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@dubabase.com"
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} Dubabase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
