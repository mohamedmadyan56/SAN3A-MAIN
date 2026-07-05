const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRouter = require("./src/routes/userRoutes");
const serviceRouter = require("./src/routes/serviceRoutes");
const requestRouter = require("./src/routes/requestRoutes");
const adminRouter = require("./src/routes/adminRoutes");
const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/services", serviceRouter);
app.use("/api/v1/requests", requestRouter);
app.use("/api/v1/admin", adminRouter);
app.get("/", (req, res) => {
  res.send("server is working .... ");
});

app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `can't find ${req.originalUrl} on this server ! `,
  });
});
module.exports = app;
