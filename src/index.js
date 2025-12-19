import express from "express";
import cors from "cors";
import pool from "./db.js";
import healthRoute from "./routes/health.js";
import projectsRoute from "./routes/projects.js";
import messagesRoute from "./routes/messages.js";
import chatRoute from "./routes/chat.js";
import "dotenv/config";




const app = express();

app.use(cors());
app.use(express.json());
app.use("/health", healthRoute);
app.use("/projects", projectsRoute);
app.use(messagesRoute);
app.use(chatRoute);




console.log("✅ Registering /projects routes");
console.log("✅ Registering /chat route");


// DB test
pool.query("SELECT 1")
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });
 
  const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});

server.setTimeout(120000); // 120 seconds

