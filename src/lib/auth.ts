import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { UserType } from "../models/User";
import * as _ from "lodash";

const JWT_SECRET = String(process.env.JWT_ACCESS_SECRET);

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    if (token) {
      jwt.verify(token, JWT_SECRET, (err: any, payload: any) => {
        if (err) {
          console.error(`Error verifying JWT:`, err);
          res.status(401).send({ error: "SESSION_EXPIRED" });
        } else {
          //@ts-ignore
          req.user = payload;
          next();
        }
      });
    } else {
      res.status(401).send();
    }
  } else {
    res.status(401).send();
  }
};

const authorizeJWT =
  (roles: Array<UserType>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = _.get(req, "user");
    if (_.isEmpty(user)) {
      res.status(401).send();
      return;
    }

    const userRole = _.get(user, "role");
    const matchingRole = _.find(roles, (role) => role === userRole);

    if (!_.isEmpty(matchingRole)) {
      next();
    } else {
      res.status(403).send();
      return;
    }
  };

const signJWT = (payload: any) => {
  const token = jwt.sign(payload, JWT_SECRET);

  return token;
};

export { signJWT, authenticateJWT, authorizeJWT };
