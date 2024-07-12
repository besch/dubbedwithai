// pages/index.tsx
export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-dubbing-primary mb-6">
        Welcome to Dubabase
      </h1>
      <p className="text-xl mb-8">
        Your ultimate solution for movie dubbing with AI
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-dubbing-secondary">
            How It Works
          </h2>
          <p>
            Dubabase uses cutting-edge AI technology to automatically dub your
            favorite movies in any language you choose. Simply install our
            Chrome extension and start enjoying seamless dubbing experiences.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-dubbing-secondary">
            Features
          </h2>
          <ul className="list-disc list-inside">
            <li>AI-powered voice generation</li>
            <li>Support for multiple languages</li>
            <li>Customizable voice options</li>
            <li>Seamless integration with popular streaming platforms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
