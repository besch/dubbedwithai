import { NextApiRequest, NextApiResponse } from "next";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (payload) {
      // Token is valid, you can use payload.email, payload.name, etc.
      res.status(200).json({ valid: true, user: payload });
    } else {
      res.status(401).json({ valid: false });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ valid: false });
  }
}
