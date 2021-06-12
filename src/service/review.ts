import Review, { IReview, IReviewComment } from "../models/Review";
import * as _ from "lodash";
import { BadRequest, ServerError, UnauthorizedError } from "../errors";
import Restaurant from "../models/Restaurant";

const createRating = async (user: any, payload: IReview) => {
  const userId = _.get(user, "_id");
  if (!userId) {
    throw new BadRequest("Missing owner");
  }

  const reviewRecord: IReview = new Review({
    ...payload,
    author: userId,
    createdOn: new Date(),
    updatedOn: new Date(),
  });

  //validate the record
  const error = reviewRecord.validateSync();
  if (error) {
    console.error(error);
    throw new BadRequest("Missing mandatory parameters");
  }

  //check if the restaurant exists
  const restaurant = await Restaurant.findOne({
    _id: _.get(payload, "restaurant"),
  }).lean();

  if (_.isEmpty(restaurant)) {
    throw new ServerError("Restaurant not found");
  }

  //insert the record
  let createdReview: IReview | null = null;
  try {
    createdReview = await reviewRecord.save();
  } catch (err) {
    console.error(err);
    throw new ServerError("An unexpected error occurred");
  }

  return createdReview;
};

const addCommentToReview = async (user: any, payload: IReviewComment) => {
  const userId = _.get(user, "_id");
  if (!userId) {
    throw new BadRequest("Missing owner");
  }

  const existingReview: IReview | null = await Review.findById(
    _.get(payload, "id")
  ).lean();

  //check if the review exists
  if (_.isEmpty(existingReview)) {
    throw new ServerError("Review not found");
  }

  //check if the restaurant under review belongs to the user
  const restaurant = await Restaurant.findById(
    _.get(existingReview, "restaurant")
  );
  if (_.trim(_.get(restaurant, "owner")) !== _.trim(userId)) {
    throw new UnauthorizedError(
      "The current user is not authorized to add comments to this review"
    );
  }

  //check if the owner has already added a comment to this review
  const reviewComments = _.get(existingReview, "otherComments", []);
  const exists = !_.isEmpty(
    _.find(reviewComments, (c) => _.trim(_.get(c, "author")) === _.trim(userId))
  );
  if (exists) {
    throw new ServerError(
      "The owner has already added a comment for this review"
    );
  }

  const comment: IReviewComment = {
    ...payload,
    author: userId,
  };

  const existingComments: Array<IReviewComment> = _.get(
    existingReview,
    "otherComments",
    []
  );
  existingComments.push(comment);

  //@ts-ignore
  const updatedReview = await Review.findByIdAndUpdate(
    _.get(existingReview, "_id"),
    {
      otherComments: existingComments,
    },
    {
      lean: true,
      new: true,
    }
  );

  return updatedReview;
};

const getAllReviews = async (skip: number = 0) => {
  const reviews = await Review.find()
    .sort({
      updatedOn: "desc",
    })
    // .skip(skip)
    // .limit(12)
    .populate({ path: "restaurant", select: "_id name" })
    .populate({ path: "author", select: "_id name" })
    .exec();

  return reviews;
};

const updateReview = async (user: any, review: IReview) => {
  const userId = _.get(user, "_id");
  if (!userId) {
    throw new BadRequest("Missing owner");
  }

  if (!_.get(review, "id")) {
    throw new BadRequest("Unable to find review");
  }

  const existingReview: Partial<IReview> | null = await Review.findOne({
    _id: _.get(review, "id"),
  }).lean();

  if (_.isEmpty(existingReview)) {
    throw new ServerError("Review not found");
  }

  const updatedReview: IReview | null = await Review.findByIdAndUpdate(
    review._id,
    {
      ...existingReview,
      ...review,
      updatedOn: new Date(),
    },
    {
      lean: true,
      new: true,
    }
  );

  if (_.isEmpty(updatedReview)) {
    throw new ServerError("Review not updated");
  }

  return {
    ...updatedReview,
    _id: _.get(review, "id"),
  };
};

export { createRating, addCommentToReview, getAllReviews, updateReview };
