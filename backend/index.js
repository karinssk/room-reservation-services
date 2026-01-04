const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const { Server } = require("socket.io");
const initSocket = require("./socket");
const seedAdminUsers = require("./utils/seed");
const { resolveBaseUrl } = require("./utils/helpers");

dotenv.config();

const FRONTEND_URL = resolveBaseUrl(
  "FRONTEND_PRODUCTION_URL",
  "FRONTEND_DEVELOPMENT_URL"
);
const ADMIN_URL = resolveBaseUrl(
  "ADMIN_PRODUCTION_URL",
  "ADMIN_DEVELOPMENT_URL"
);
const BACKEND_URL = resolveBaseUrl(
  "BACKEND_PRODUCTION_URL",
  "BACKEND_DEVELOPMENT_URL"
);

const allowedOrigins = [
  FRONTEND_URL,
  ADMIN_URL,
  "https://rca-aircon-express.fastforwardssl.com",
  "https://admin-rca-aircon-express.fastforwardssl.com",
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

const adminPresence = new Map();

app.use(cors(corsOptions));
app.use(express.json());

// Static Uploads
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/services"));
app.use("/", require("./routes/products"));
app.use("/", require("./routes/content"));
app.use("/admin", require("./routes/admin"));
app.use("/forms", require("./routes/forms"));
app.use("/pages", require("./routes/pages"));
app.use("/posts", require("./routes/posts"));
app.use("/uploads", require("./routes/uploads"));
app.use("/chat", require("./routes/chat")(io, adminPresence));

app.get("/health", (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState });
});

// Socket.IO
initSocket(io, adminPresence);

const port = process.env.PORT || 4022;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    seedAdminUsers().catch((error) => {
      console.error("Failed to seed admin users", error);
    });
    server.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
