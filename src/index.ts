import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import "./lib/db";
import AuthRouter from "./routes/auth";
import UserRouter from "./routes/user";
import RestaurantRouter from "./routes/restaurant";
import ReivewRouter from "./routes/review";

const port = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", AuthRouter);
app.use("/user", UserRouter);
app.use("/restaurant", RestaurantRouter);
app.use("/review", ReivewRouter);

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
