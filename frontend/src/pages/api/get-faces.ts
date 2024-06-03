"use server";

import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

const getFaces = async (req: NextApiRequest, res: NextApiResponse) => {
  const absPath = path.join(
    "C:",
    "Users",
    "user",
    "Downloads",
    "chlopaki_nie_placza",
    "output.json"
  );

  fs.readFile(absPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    try {
      const jsonData = JSON.parse(data);
      res.status(200).json({ jsonData });
    } catch (err) {
      console.error("Error parsing JSON:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

export default getFaces;
