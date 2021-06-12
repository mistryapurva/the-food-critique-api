import express from "express";
import { genericExceptionHandler } from "../errors";
import { IRestaurant } from "../models/Restaurant";
import * as RestaurantService from "../service/restaurant";
import * as _ from "lodash";
import { authenticateJWT, authorizeJWT } from "../lib/auth";
import { UserType } from "../models/User";

const router = express.Router();
router.use(authenticateJWT);

/**
 * POST /restaurant
 * Creates a new restaurant through the app
 *
 * Allow Roles: OWNER
 */
router.post("/", authorizeJWT([UserType.OWNER]), async (req, res) => {
  const body = req.body;
  const user = _.get(req, "user");
  let restaurant: Partial<IRestaurant> | null = null;
  try {
    restaurant = await RestaurantService.createRestaurant(user, body);
  } catch (e) {
    genericExceptionHandler(e, res);
  }

  res.status(200).json(restaurant);
});

/**
 * PUT /restaurant/:id
 * Updates an existing restaurant through the app
 *
 * Allow Roles: ADMIN, OWNER
 */
router.put(
  "/:id",
  authorizeJWT([UserType.ADMIN, UserType.OWNER]),
  async (req, res) => {
    const id = _.get(req, "params.id");
    const body = req.body;
    const user = _.get(req, "user");
    let restaurant: Partial<IRestaurant> | null = null;
    try {
      restaurant = await RestaurantService.updateRestaurant(user, {
        ...body,
        id,
      });
    } catch (e) {
      genericExceptionHandler(e, res);
    }

    res.status(200).json(restaurant);
  }
);

/**
 * GET /restaurant
 * Gets all restaurants
 *
 * Allow Roles: ADMIN, USER, OWNER
 */
router.get("/", async (req, res) => {
  const user = _.get(req, "user");
  const { search = "", rating = 0, skip = 0 } = req.query;
  const restaurants = await RestaurantService.getAllRestaurants(
    user,
    String(search),
    _.toInteger(rating),
    _.toInteger(skip)
  );
  res.status(200).json(restaurants);
});

/**
 * GET /restaurant/:id
 * Gets a specific restaurant by id
 *
 * Allow Roles: ADMIN, OWNER, USER
 */
router.get("/:id", async (req, res) => {
  const user = _.get(req, "user");
  const id = _.get(req, "params.id");
  const restaurant = await RestaurantService.getRestaurant(user, id);
  res.status(200).json(restaurant);
});

/**
 * DELETE /restaurant/:id
 * Deletes an existing restaurant
 *
 * Allow Roles: OWNER, USER
 */
router.delete("/:id", authorizeJWT([UserType.ADMIN]), async (req, res) => {
  const id = _.get(req, "params.id");
  const restaurant = await RestaurantService.deleteRestaurant(id);
  res.status(200).json(restaurant);
});

export default router;
