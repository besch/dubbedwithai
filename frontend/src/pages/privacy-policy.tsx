// pages/privacy-policy.tsx
export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-dubbing-primary mb-6">
        Privacy Policy
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-dubbing-secondary">
          1. Introduction
        </h2>
        <p className="mb-4">
          Dubabase (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is
          committed to protecting your privacy. This Privacy Policy explains how
          we collect, use, and share information about you when you use our
          Dubabase Chrome extension (&ldquo;the Extension&rdquo;).
        </p>

        <h2 className="text-2xl font-semibold mb-4 text-dubbing-secondary">
          2. Information We Collect
        </h2>
        <p className="mb-4">We collect the following types of information:</p>
        <ul className="list-disc list-inside mb-4">
          <li>
            <strong>Account Information:</strong> When you sign in using your
            Google account, we collect your email address and profile
            information.
          </li>
          <li>
            <strong>Usage Data:</strong> We collect data about how you use the
            Extension, including the movies you watch and the dubbing options
            you select.
          </li>
          <li>
            <strong>Technical Information:</strong> We collect information about
            your browser and device when you use the Extension.
          </li>
        </ul>

        {/* Add more sections as needed */}

        <h2 className="text-2xl font-semibold mb-4 text-dubbing-secondary">
          8. Contact Us
        </h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us
          at{" "}
          <a
            href="mailto:contact@dubabase.com"
            className="text-dubbing-primary hover:underline"
          >
            contact@dubabase.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
