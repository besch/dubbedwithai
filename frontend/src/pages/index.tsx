import Head from "next/head";
import { Film, Globe, Mic, PlayCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

// Define animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function Home() {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    video: false,
    howItWorks: false,
    keyFeatures: false,
    additionalBenefits: false,
  });

  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { margin: "-100px" });

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "hero",
        "video",
        "howItWorks",
        "keyFeatures",
        "additionalBenefits",
      ];

      setIsVisible((prevState) => {
        const updatedVisibility = { ...prevState };
        let hasChanges = false;

        sections.forEach((section) => {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            const shouldBeVisible = rect.top <= window.innerHeight * 0.85;

            if (
              updatedVisibility[section as keyof typeof prevState] !==
              shouldBeVisible
            ) {
              updatedVisibility[section as keyof typeof prevState] =
                shouldBeVisible;
              hasChanges = true;
            }
          }
        });

        return hasChanges ? updatedVisibility : prevState;
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // Empty dependency array

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
        <motion.section
          ref={heroRef}
          variants={fadeInUp}
          initial="hidden"
          animate={isHeroInView ? "visible" : "hidden"}
          transition={{ duration: 0.8 }}
          className={`py-24 bg-gradient-to-b from-accent to-background`}
        >
          <div className="container mx-auto text-center">
            <motion.h1
              className="text-6xl font-extrabold mb-6 text-yellow-400"
              variants={fadeInUp}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Welcome to OneDub
            </motion.h1>
            <motion.p
              className="text-xl mb-12 max-w-3xl mx-auto"
              variants={fadeInUp}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Transform your streaming experience with OneDub’s AI-powered
              real-time dubbing. Enjoy movies and TV shows in your preferred
              language effortlessly!
            </motion.p>

            <div className="flex justify-center mb-6">
              <motion.img
                src="/images/icon.png"
                alt="OneDub Logo"
                className="h-40 w-40 mb-5"
                variants={fadeInUp}
                transition={{ delay: 0.6, duration: 0.8 }}
                whileHover={{
                  scale: 1.05,
                  rotate: [0, -5, 5, -5, 0],
                  transition: {
                    rotate: {
                      duration: 0.5,
                      ease: "easeInOut",
                    },
                  },
                }}
              />
            </div>
            <a
              href="https://chromewebstore.google.com/detail/onedub/cphceeehafncfeigajlnajkbddokpnbn"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-dubbing-primary text-white text-lg px-10 py-4 rounded-full shadow-lg inline-block transition-all duration-300 hover:bg-dubbing-primary/80"
            >
              Install OneDub Now
            </a>
          </div>
        </motion.section>

        {/* Video Section */}
        <motion.section
          id="video"
          variants={fadeInUp}
          initial="hidden"
          animate={isVisible.video ? "visible" : "hidden"}
          transition={{ duration: 0.8 }}
          className={`py-24 bg-accent`}
        >
          <div className="container mx-auto text-center">
            <motion.h2
              className="text-4xl font-bold mb-8 text-foreground"
              variants={fadeInUp}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              See OneDub in Action
            </motion.h2>
            <motion.div
              className="aspect-w-16 aspect-h-9 max-w-4xl mx-auto"
              variants={fadeInUp}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <iframe
                width="100%"
                height="500"
                src="https://www.youtube.com/embed/f9Ti7OfXIjQ?vq=hd720"
                title="OneDub Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl shadow-2xl"
              ></iframe>
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          id="howItWorks"
          variants={fadeInUp}
          initial="hidden"
          animate={isVisible.howItWorks ? "visible" : "hidden"}
          transition={{ duration: 0.8 }}
          className={`py-24 bg-gradient-to-b from-background to-accent`}
        >
          <div className="container mx-auto">
            <motion.h2
              className="text-4xl font-bold mb-12 text-center text-foreground"
              variants={fadeInUp}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              How OneDub Works
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-12"
              variants={staggerContainer}
              initial="hidden"
              animate={isVisible.howItWorks ? "visible" : "hidden"}
            >
              {/* Card 1 */}
              <motion.div
                className="bg-muted p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
              >
                <Film className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  1. Choose Your Content
                </h3>
                <p className="text-foreground">
                  Select any movie or TV show on your favorite streaming
                  platform seamlessly.
                </p>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                className="bg-muted p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 0.2 }}
              >
                <Globe className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  2. Select Your Language
                </h3>
                <p className="text-foreground">
                  Choose from a wide array of languages for high-quality AI
                  dubbing.
                </p>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                className="bg-muted p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 0.4 }}
              >
                <PlayCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  3. Enjoy Your Content
                </h3>
                <p className="text-foreground">
                  Start watching with instant AI dubbing in your chosen language
                  seamlessly integrated.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Key Features Section */}
        <motion.section
          id="keyFeatures"
          variants={fadeInUp}
          initial="hidden"
          animate={isVisible.keyFeatures ? "visible" : "hidden"}
          transition={{ duration: 0.8 }}
          className={`py-24 bg-accent`}
        >
          <div className="container mx-auto">
            <motion.h2
              className="text-4xl font-bold mb-12 text-center text-foreground"
              variants={fadeInUp}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Key Features
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
              variants={staggerContainer}
              initial="hidden"
              animate={isVisible.keyFeatures ? "visible" : "hidden"}
            >
              {/* Feature 1 */}
              <motion.div
                className="bg-muted p-6 rounded-lg shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
              >
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Seamless Integration
                </h3>
                <p className="text-foreground">
                  Works flawlessly with YouTube, Netflix, Amazon Prime Video,
                  and more!
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                className="bg-muted p-6 rounded-lg shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  High-Quality AI Voices
                </h3>
                <p className="text-foreground">
                  Experience natural-sounding dubbing that blends perfectly with
                  original audio.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                className="bg-muted p-6 rounded-lg shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Multiple Languages
                </h3>
                <p className="text-foreground">
                  Choose from a diverse range of languages to dub your favorite
                  content.
                </p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div
                className="bg-muted p-6 rounded-lg shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Easy-to-Use Interface
                </h3>
                <p className="text-foreground">
                  User-friendly interface ensures effortless dubbing for
                  everyone.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Additional Benefits Section */}
        <motion.section
          id="additionalBenefits"
          variants={fadeInUp}
          initial="hidden"
          animate={isVisible.additionalBenefits ? "visible" : "hidden"}
          transition={{ duration: 0.8 }}
          className={`py-24 bg-gradient-to-b from-background to-accent`}
        >
          <div className="container mx-auto text-center">
            <motion.h2
              className="text-4xl font-bold mb-10 text-foreground"
              variants={fadeInUp}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Transform Your Streaming Experience
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-12"
              variants={staggerContainer}
              initial="hidden"
              animate={isVisible.additionalBenefits ? "visible" : "hidden"}
            >
              {/* Benefit 1 */}
              <motion.div
                className="bg-muted p-8 rounded-2xl shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
              >
                <Mic className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Watch Foreign Films
                </h3>
                <p className="text-foreground">
                  Enjoy international cinema with instant AI dubbing in your
                  preferred language.
                </p>
              </motion.div>

              {/* Benefit 2 */}
              <motion.div
                className="bg-muted p-8 rounded-2xl shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 0.2 }}
              >
                <Globe className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Learn New Languages
                </h3>
                <p className="text-foreground">
                  Enhance your language skills by immersing yourself in
                  different languages.
                </p>
              </motion.div>

              {/* Benefit 3 */}
              <motion.div
                className="bg-muted p-8 rounded-2xl shadow-lg hover:shadow-2xl"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 0.4 }}
              >
                <Film className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Global Accessibility
                </h3>
                <p className="text-foreground">
                  Access a world of content without any language barriers
                  hindering your enjoyment.
                </p>
              </motion.div>
            </motion.div>
            <motion.a
              href="https://chromewebstore.google.com/detail/onedub/cphceeehafncfeigajlnajkbddokpnbn"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 inline-block bg-[#6a3de8] text-white px-8 py-3 rounded-full shadow-lg"
              variants={fadeInUp}
              transition={{ delay: 0.6, duration: 0.8 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0px 0px 8px rgba(106, 61, 232, 0.5)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started with OneDub
            </motion.a>
          </div>
        </motion.section>
      </div>
    </>
  );
}
