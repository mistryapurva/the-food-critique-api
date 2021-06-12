import * as express from "express";
import { genericExceptionHandler } from "../errors";
import * as AuthService from "../service/auth";
import * as _ from "lodash";

const router = express.Router();

router.post("/login", async (req, res) => {
  const body = req.body;
  let user: any;
  try {
    user = await AuthService.login(body);
  } catch (e) {
    genericExceptionHandler(e, res);
  }

  res.status(200).json(user);
});

export default router;
