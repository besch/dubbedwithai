import { NextApiRequest, NextApiResponse } from "next";
import { cors, runMiddleware } from "@/lib/corsMiddleware";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const searchMovies = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  // Check for authentication token
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verify the token
    let userId: string | undefined;

    // Try to verify as ID token first
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      userId = payload?.sub;
    } catch (idTokenError) {
      // If ID token verification fails, try to verify as access token
      try {
        const userInfo = await client.getTokenInfo(token);
        userId = userInfo.sub;
      } catch (accessTokenError) {
        console.error("Token verification failed:", accessTokenError);
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Token is valid, proceed with searching movies
    const response = await fetch(
      `http://www.omdbapi.com/?apikey=508321b3&s=${req.body.text}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error("Error searching movies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default searchMovies;
