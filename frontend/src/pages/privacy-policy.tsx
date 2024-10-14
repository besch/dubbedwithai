import Head from "next/head";
import { Shield, Lock, RefreshCw, MessageCircle } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - OneDub</title>
        <meta
          name="description"
          content="OneDub's privacy policy - Learn how we protect your data and ensure a secure AI dubbing experience."
        />
      </Head>
      <div className="bg-background text-foreground py-20">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold mb-12 text-yellow-400 text-center">
            Privacy Policy
          </h1>
          <div className="prose prose-invert max-w-4xl mx-auto bg-muted p-8 rounded-lg shadow-lg">
            <p className="mb-8">
              At OneDub, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, and protect your personal
              information when you use our Chrome extension for AI-powered movie
              dubbing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="flex flex-col h-full">
                <h2 className="flex items-center text-2xl font-semibold mb-4">
                  <Shield className="w-6 h-6 mr-2 text-yellow-400" />
                  Information We Collect
                </h2>
                <div className="flex-grow">
                  <p>
                    We collect minimal information necessary to provide our
                    service, including:
                  </p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Language preferences</li>
                    <li>Usage statistics (anonymized)</li>
                    <li>Technical information about your browser and device</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col h-full">
                <h2 className="flex items-center text-2xl font-semibold mb-4">
                  <Lock className="w-6 h-6 mr-2 text-yellow-400" />
                  How We Use Your Information
                </h2>
                <div className="flex-grow">
                  <p>We use the collected information to:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Provide and improve our AI dubbing service</li>
                    <li>Analyze usage patterns to enhance user experience</li>
                    <li>Troubleshoot technical issues</li>
                    <li>Ensure compliance with our terms of service</li>
                  </ul>
                </div>
              </div>
            </div>
            <h2 className="flex items-center text-2xl font-semibold mb-4">
              <Lock className="w-6 h-6 mr-2 text-yellow-400" />
              Data Security
            </h2>
            <p className="mb-8">
              We implement industry-standard security measures to protect your
              data from unauthorized access, disclosure, alteration, or
              destruction. This includes encryption of sensitive information,
              regular security audits, and strict access controls for our staff.
            </p>
            <h2 className="flex items-center text-2xl font-semibold mb-4">
              <RefreshCw className="w-6 h-6 mr-2 text-yellow-400" />
              Changes to This Policy
            </h2>
            <p className="mb-8">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices or for other operational, legal, or
              regulatory reasons. We will notify you of any material changes by
              posting the new Privacy Policy on this page and updating the "Last
              updated" date at the top of this Privacy Policy.
            </p>
            <h2 className="flex items-center text-2xl font-semibold mb-4">
              <MessageCircle className="w-6 h-6 mr-2 text-yellow-400" />
              Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at{" "}
              <a
                href="mailto:privacy@onedub.com"
                className="text-yellow-400 hover:underline"
              >
                privacy@onedub.com
              </a>
              . We're here to address any concerns you may have about your
              privacy and data security.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
