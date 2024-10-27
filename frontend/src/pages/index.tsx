import Head from "next/head";
import { Film, Globe, Mic, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    video: false,
    howItWorks: false,
    keyFeatures: false,
    additionalBenefits: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "hero",
        "video",
        "howItWorks",
        "keyFeatures",
        "additionalBenefits",
      ];
      const updatedVisibility = { ...isVisible };

      sections.forEach((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.85) {
            updatedVisibility[section as keyof typeof isVisible] = true;
          }
        }
      });

      setIsVisible(updatedVisibility);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible]);

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
      <div className="bg-background text-foreground min-h-screen">
        {/* Hero Section */}
        <section
          id="hero"
          className={`py-24 bg-gradient-to-b from-accent to-background transition-opacity duration-1000 ${
            isVisible.hero ? "opacity-100 animate-fade-in" : "opacity-0"
          }`}
        >
          <div className="container mx-auto text-center">
            <h1 className="text-6xl font-extrabold mb-6 text-yellow-400 animate-slide-in-left">
              Welcome to OneDub
            </h1>
            <p className="text-xl mb-12 max-w-3xl mx-auto animate-fade-in-delay">
              Transform your streaming experience with OneDub’s AI-powered
              real-time dubbing. Enjoy movies and TV shows in your preferred
              language effortlessly!
            </p>

            <div className="flex justify-center mb-6">
              <img
                src="/images/icon.png"
                alt="OneDub Logo"
                className="h-40 w-40 mb-5 animate-pulse-slow"
              />
            </div>
            <a
              href="https://chromewebstore.google.com/detail/onedub/cphceeehafncfeigajlnajkbddokpnbn"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white text-lg px-10 py-4 rounded-full shadow-lg hover:bg-opacity-90 transition-colors inline-block transform hover:-translate-y-1 hover:scale-105 animate-button"
            >
              Install OneDub Now
            </a>
          </div>
        </section>

        {/* Video Section */}
        <section
          id="video"
          className={`py-24 bg-accent transition-opacity duration-1000 ${
            isVisible.video ? "opacity-100 animate-fade-in" : "opacity-0"
          }`}
        >
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-foreground animate-slide-in-right">
              See OneDub in Action
            </h2>
            <div className="aspect-w-16 aspect-h-9 max-w-4xl mx-auto">
              <iframe
                width="100%"
                height="500"
                src="https://www.youtube.com/embed/f9Ti7OfXIjQ?vq=hd720"
                title="OneDub Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl shadow-2xl animate-scale-up"
              ></iframe>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="howItWorks"
          className={`py-24 bg-gradient-to-b from-background to-accent transition-opacity duration-1000 ${
            isVisible.howItWorks ? "opacity-100 animate-fade-in" : "opacity-0"
          }`}
        >
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center text-foreground animate-slide-in-left">
              How OneDub Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-muted p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card">
                <Film className="w-16 h-16 mx-auto mb-4 text-yellow-400 animate-icon" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  1. Choose Your Content
                </h3>
                <p className="text-foreground">
                  Select any movie or TV show on your favorite streaming
                  platform seamlessly.
                </p>
              </div>
              <div className="bg-muted p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card delay-200">
                <Globe className="w-16 h-16 mx-auto mb-4 text-yellow-400 animate-icon" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  2. Select Your Language
                </h3>
                <p className="text-foreground">
                  Choose from a wide array of languages for high-quality AI
                  dubbing.
                </p>
              </div>
              <div className="bg-muted p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card delay-400">
                <PlayCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400 animate-icon" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  3. Enjoy Your Content
                </h3>
                <p className="text-foreground">
                  Start watching with instant AI dubbing in your chosen language
                  seamlessly integrated.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section
          id="keyFeatures"
          className={`py-24 bg-accent transition-opacity duration-1000 ${
            isVisible.keyFeatures ? "opacity-100 animate-fade-in" : "opacity-0"
          }`}
        >
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center text-foreground animate-slide-in-right">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              <div className="bg-muted p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Seamless Integration
                </h3>
                <p className="text-foreground">
                  Works flawlessly with YouTube, Netflix, Amazon Prime Video,
                  and more!
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card delay-200">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  High-Quality AI Voices
                </h3>
                <p className="text-foreground">
                  Experience natural-sounding dubbing that blends perfectly with
                  original audio.
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card delay-400">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Multiple Languages
                </h3>
                <p className="text-foreground">
                  Choose from a diverse range of languages to dub your favorite
                  content.
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card delay-600">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Easy-to-Use Interface
                </h3>
                <p className="text-foreground">
                  User-friendly interface ensures effortless dubbing for
                  everyone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Benefits Section */}
        <section
          id="additionalBenefits"
          className={`py-24 bg-gradient-to-b from-background to-accent transition-opacity duration-1000 ${
            isVisible.additionalBenefits
              ? "opacity-100 animate-fade-in"
              : "opacity-0"
          }`}
        >
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-10 text-foreground animate-slide-in-left">
              Transform Your Streaming Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-muted p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card">
                <Mic className="w-12 h-12 mx-auto mb-4 text-yellow-400 animate-icon" />
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Watch Foreign Films
                </h3>
                <p className="text-foreground">
                  Enjoy international cinema with instant AI dubbing in your
                  preferred language.
                </p>
              </div>
              <div className="bg-muted p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card delay-200">
                <Globe className="w-12 h-12 mx-auto mb-4 text-yellow-400 animate-icon" />
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Learn New Languages
                </h3>
                <p className="text-foreground">
                  Enhance your language skills by immersing yourself in
                  different languages.
                </p>
              </div>
              <div className="bg-muted p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 animate-card delay-400">
                <Film className="w-12 h-12 mx-auto mb-4 text-yellow-400 animate-icon" />
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Global Accessibility
                </h3>
                <p className="text-foreground">
                  Access a world of content without any language barriers
                  hindering your enjoyment.
                </p>
              </div>
            </div>
            <a
              href="https://chromewebstore.google.com/detail/onedub/cphceeehafncfeigajlnajkbddokpnbn"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 inline-block bg-primary text-white px-8 py-3 rounded-full shadow-lg hover:bg-opacity-90 transition-colors transform hover:-translate-y-1 hover:scale-105 animate-button"
            >
              Get Started with OneDub
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
