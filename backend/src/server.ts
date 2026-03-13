import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT;

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});
