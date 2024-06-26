import Cors from "cors";

const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:3000",
  "chrome-extension://cbkcjmkilcamnjjlnahjicgcegmfhfmi",
];

// Initializing the cors middleware
const cors = Cors({
  methods: ["GET", "HEAD", "POST"],
  origin: function (origin, callback) {
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
