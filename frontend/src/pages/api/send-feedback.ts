import { NextApiRequest, NextApiResponse } from "next";
import sgMail from "@sendgrid/mail";
import { cors, runMiddleware } from "@/lib/corsMiddleware";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const SendFeedback = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, name, message } = req.body;

  if (!email || !name || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const msg = {
    to: process.env.FEEDBACK_EMAIL,
    from: process.env.SENDGRID_FROM_EMAIL as string,
    name: `Feedback: ${name}`,
    text: `From: ${email}\n\n${message}`,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ message: "Feedback sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending feedback" });
  }
};

export default SendFeedback;
