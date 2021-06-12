import Mongoose from "mongoose";

Mongoose.connect(String(process.env.DB_CONNECTION_STRING))
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((e) => {
    console.log("Error while trying to connect MongoDB");
    throw e;
  });
