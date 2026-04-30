import express from "express";
import cors from "cors";
import deploymentsRouter from "./routes/deployments";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/deployments", deploymentsRouter);

app.get("/", (_req, res) => {
  res.send("API running");
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
