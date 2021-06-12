import * as dotenv from "dotenv";
dotenv.config();

import * as express from "express";
import * as cors from "cors";
import "./lib/db";
import AuthRouter from "./routes/auth";
import UserRouter from "./routes/user";
import RestaurantRouter from "./routes/restaurant";
import ReviewRouter from "./routes/review";

const port = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", AuthRouter);
app.use("/user", UserRouter);
app.use("/restaurant", RestaurantRouter);
app.use("/review", ReviewRouter);

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
