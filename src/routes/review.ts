import * as express from "express";
import { genericExceptionHandler } from "../errors";
import { IReview } from "../models/Review";
import * as ReviewService from "../service/review";
import * as _ from "lodash";
import { authenticateJWT, authorizeJWT } from "../lib/auth";
import { UserType } from "../models/User";

const router = express.Router();
router.use(authenticateJWT);

/**
 * POST /review
 * Creates a new review for a restaurant
 *
 * Allow Roles: USER
 */
router.post("/", authorizeJWT([UserType.USER]), async (req, res) => {
  const body = req.body;
  const user = _.get(req, "user");
  let review: Partial<IReview> | null = null;
  try {
    review = await ReviewService.createRating(user, body);
  } catch (e) {
    genericExceptionHandler(e, res);
  }

  res.status(200).json(review);
});

/**
 * POST /review/:id/comment
 * Adds a comment to a given review
 *
 * Allow Roles: OWNER
 */
router.post(
  "/:id/comment",
  authorizeJWT([UserType.OWNER]),
  async (req, res) => {
    const body = req.body;
    const id = _.get(req, "params.id");
    const user = _.get(req, "user");

    let review: Partial<IReview> | null = null;
    try {
      review = await ReviewService.addCommentToReview(user, { ...body, id });
    } catch (e) {
      genericExceptionHandler(e, res);
    }

    res.status(200).json(review);
  }
);

/**
 * PUT /review/:id/
 * Updates a review
 *
 * Allow Roles: ADMIN
 */
router.put("/:id/", authorizeJWT([UserType.ADMIN]), async (req, res) => {
  const body = req.body;
  const id = _.get(req, "params.id");
  const user = _.get(req, "user");

  let review: Partial<IReview> | null = null;
  try {
    review = await ReviewService.updateReview(user, { ...body, id });
  } catch (e) {
    genericExceptionHandler(e, res);
  }

  res.status(200).json(review);
});

/**
 * PUT /review/:id/:commentId
 * Updates a comment added on a review
 *
 * Allow Roles: ADMIN
 */
router.put(
  "/:id/:commentId",
  authorizeJWT([UserType.ADMIN]),
  async (req, res) => {
    const body = req.body;
    const id = _.get(req, "params.id");
    const commentId = _.get(req, "params.commentId");
    const user = _.get(req, "user");

    let review: Partial<IReview> | null = null;
    try {
      review = await ReviewService.addCommentToReview(user, { ...body, id });
    } catch (e) {
      genericExceptionHandler(e, res);
    }

    res.status(200).json(review);
  }
);

/**
 * GET /review
 * Gets all reviews on the app
 *
 * Allow Roles: ADMIN
 */
router.get("/", authorizeJWT([UserType.ADMIN]), async (req, res) => {
  const user = _.get(req, "user");
  const { skip = 0 } = req.query;
  let reviews: Array<IReview> = [];
  try {
    reviews = await ReviewService.getAllReviews(_.toInteger(skip));
  } catch (e) {
    genericExceptionHandler(e, res);
  }

  res.status(200).json(reviews);
});

export default router;
