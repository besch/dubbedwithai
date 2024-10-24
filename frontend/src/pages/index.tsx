import Head from "next/head";
import { Film, Globe, Mic, PlayCircle } from "lucide-react";

export default function Home() {
  return (
    <>
      <Head>
        <title>
          OneDub - AI-Powered Real-Time Movie Dubbing Chrome Extension
        </title>
        <meta
          name="description"
          content="Break language barriers with OneDub, the Chrome extension that brings instant AI dubbing to movies and TV series across popular streaming platforms."
        />
        <meta
          name="keywords"
          content="AI dubbing, movie dubbing, Chrome extension, Netflix dubbing, YouTube dubbing, language learning, streaming"
        />
        <meta
          property="og:title"
          content="OneDub - AI-Powered Real-Time Movie Dubbing"
        />
        <meta
          property="og:description"
          content="Experience your favorite content in your preferred language with OneDub's instant AI dubbing technology."
        />
        <meta property="og:image" content="/onedub-preview.jpg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="bg-background text-foreground">
        <section className="py-20 bg-gradient-to-b from-accent to-background">
          <div className="container mx-auto text-center">
            <h1 className="text-6xl font-bold mb-6 text-yellow-400">
              Welcome to OneDub
            </h1>
            <p className="text-xl mb-12 max-w-2xl mx-auto">
              Your ultimate AI-powered real-time movie dubbing solution for
              Chrome. Break language barriers and enjoy global content like
              never before!
            </p>

            <div className="flex justify-center mb-4">
              <img
                src="/images/icon.png"
                alt="OneDub Logo"
                className="h-32 w-32 mb-5"
              />
            </div>
            <a
              href="https://chromewebstore.google.com/detail/onedub/cphceeehafncfeigajlnajkbddokpnbn"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white text-lg px-8 py-3 rounded-md hover:bg-opacity-90 transition-colors inline-block"
            >
              Install OneDub Now
            </a>
          </div>
        </section>

        <section className="py-20 bg-accent">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">See OneDub in Action</h2>
            <div className="aspect-w-16 aspect-h-9 max-w-4xl mx-auto">
              <iframe
                width="100%"
                height="500"
                src="https://www.youtube.com/embed/f9Ti7OfXIjQ?vq=hd720"
                title="OneDub Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg shadow-2xl"
              ></iframe>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-b from-background to-accent">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">
              How OneDub Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-muted p-6 rounded-lg text-center shadow-lg">
                <Film className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-2">
                  1. Choose Your Content
                </h3>
                <p>
                  Select any movie or TV show on your favorite streaming
                  platform.
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg text-center shadow-lg">
                <Globe className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-2">
                  2. Select Your Language
                </h3>
                <p>
                  Choose your preferred dubbing language from our wide range of
                  options.
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg text-center shadow-lg">
                <PlayCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-2">
                  3. Enjoy Your Content
                </h3>
                <p>
                  Start watching with instant AI dubbing in your chosen
                  language!
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-b from-accent to-background">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-muted p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Seamless Integration
                </h3>
                <p>
                  Works with popular streaming platforms like YouTube, Netflix,
                  Amazon Prime Video, and more!
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  High-Quality AI Voices
                </h3>
                <p>
                  Experience natural-sounding dubbing that blends seamlessly
                  with the original audio.
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Multiple Languages
                </h3>
                <p>
                  Choose from a wide range of languages to dub your favorite
                  content.
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Easy-to-Use Interface
                </h3>
                <p>
                  Start dubbing with just a few clicks, making it accessible for
                  users of all technical levels.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-b from-background to-accent">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">
              Transform Your Streaming Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-muted p-6 rounded-lg shadow-lg">
                <Mic className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-4">
                  Watch Foreign Films
                </h3>
                <p>
                  Enjoy international cinema with instant AI dubbing in your
                  preferred language.
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg shadow-lg">
                <Globe className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-4">
                  Learn New Languages
                </h3>
                <p>
                  Improve your language skills by watching content in different
                  languages.
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg shadow-lg">
                <Film className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-4">
                  Global Accessibility
                </h3>
                <p>Access a world of content without language barriers.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
