import Cors from "cors";

const getAllowedOrigins = () => {
  const origins = [
    process.env.API_URL,
    `chrome-extension://${process.env.CHROME_EXTENSION_ID}`,

    // TO REMOVE
    "https://dubbedwithai-git-payments-beschs-projects.vercel.app",
    "dubbedwithai-git-payments-beschs-projects.vercel.app",
    "*",
    // TO REMOVE
  ];
  return origins.filter((origin) => origin !== undefined);
};

// Initializing the cors middleware
const cors = Cors({
  methods: ["GET", "HEAD", "POST"],
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
});

// Helper method to wait for a middleware to execute before continuing
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export { cors, runMiddleware };
