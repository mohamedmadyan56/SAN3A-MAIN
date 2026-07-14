const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRouter = require("./src/routes/userRoutes");
const serviceRouter = require("./src/routes/serviceRoutes");
const requestRouter = require("./src/routes/requestRoutes");
const globalErrorHandler = require("./src/middleware/errorHandler");

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
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/services", serviceRouter);
app.use("/api/v1/requests", requestRouter);

app.get("/", (req, res) => {
  res.send("server is working ....");
});

app.all((req, res,next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
err.statusCode = 404;
  err.status = "fail";
  err.isOperational = true;
  next(err);


});
app.use(globalErrorHandler);
module.exports = app;
