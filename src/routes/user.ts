import express from "express";
import * as _ from "lodash";
import { genericExceptionHandler } from "../errors";
import { authenticateJWT, authorizeJWT } from "../lib/auth";
import { IUser, UserType } from "../models/User";
import * as UserService from "../service/user";

const router = express.Router();

/**
 * POST /user
 * Creates a new user through sign up
 *
 * Allow Roles: OWNER, USER
 */
router.post("/", async (req, res) => {
  const body = req.body;
  let user: Partial<IUser> | null = null;
  try {
    user = await UserService.createUser(body);
  } catch (e) {
    genericExceptionHandler(e, res);
    return;
  }

  res.status(200).json(user);
});

/**
 * PUT /user/:id
 * Updates an existing user
 *
 * Allow Roles: ADMIN, OWNER, USER
 */
router.put("/:id", authenticateJWT, async (req, res) => {
  const id = _.get(req, "params.id");
  const userFromToken = _.get(req, "user");
  const userIdFromToken = _.get(userFromToken, "_id");
  const userRoleFromToken = _.get(userFromToken, "role");
  if (userRoleFromToken !== UserType.ADMIN) {
    if (userIdFromToken !== id) {
      //looks like the user is requesting to update another user, not allowed
      res
        .status(403)
        .send({ error: "You are not allowed to update another user" });
      return;
    }
  }

  const body = req.body;
  let user: Partial<IUser> | null = null;
  try {
    user = await UserService.updateUser(userFromToken, { ...body, id });
  } catch (e) {
    genericExceptionHandler(e, res);
    return;
  }

  res.status(200).json(user);
});

/**
 * GET /user
 * Gets all users
 *
 * Allow Roles: ADMIN
 */
router.get(
  "/",
  authenticateJWT,
  authorizeJWT([UserType.ADMIN]),
  async (req, res) => {
    const users = await UserService.getAllUsers();
    res.status(200).json(users);
  }
);

/**
 * GET /user/:id
 * Gets a specific user by id
 *
 * Allow Roles: ADMIN, OWNER, USER
 */
router.get("/:id", authenticateJWT, async (req, res) => {
  const id = _.get(req, "params.id");

  const userIdFromToken = _.get(req, "user._id");
  const userRoleFromToken = _.get(req, "user.role");
  if (userRoleFromToken !== UserType.ADMIN) {
    if (userIdFromToken !== id) {
      //looks like the user is requesting to update another user, not allowed
      res.status(403).send();
      return;
    }
  }

  const user = await UserService.getUser(id);
  res.status(200).json(user);
});

/**
 * DELETE /user/:id
 * Performs a soft-delete operation on an existing user
 *
 * Allow Roles: ADMIN
 */
router.delete(
  "/:id",
  authenticateJWT,
  authorizeJWT([UserType.ADMIN]),
  async (req, res) => {
    const id = _.get(req, "params.id");
    const user = await UserService.deleteUser(id);
    res.status(200).json(user);
  }
);

export default router;
