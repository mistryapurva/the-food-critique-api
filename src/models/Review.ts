import Mongoose, { Model, Schema, Document } from "mongoose";

export enum ReviewStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface IReviewComment {
  author: string;
  comment: string;
  status: ReviewStatus;
  createdOn?: Date;
  updatedOn?: Date;
}

export interface IReview extends Document {
  id?: string;
  author: string;
  rating: number;
  comment?: string;
  dateVisit?: string;
  otherComments?: Array<IReviewComment>;
  status: ReviewStatus;
  createdOn?: Date;
  updatedOn?: Date;
}

const reviewSchema = new Schema({
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
    trim: true,
  },
  dateVisit: {
    type: String,
  },
  otherComments: [
    {
      author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      comment: {
        type: String,
        required: true,
        trim: true,
      },
      createdOn: {
        type: String,
        default: new Date(),
      },
      updatedOn: {
        type: String,
        default: new Date(),
      },
      status: {
        type: String,
        enum: Object.values(ReviewStatus).map((val) => val),
        default: ReviewStatus.ACTIVE,
      },
    },
  ],
  status: {
    type: String,
    enum: Object.values(ReviewStatus).map((val) => val),
    default: ReviewStatus.ACTIVE,
  },
  createdOn: {
    type: String,
    default: new Date(),
  },
  updatedOn: {
    type: String,
    default: new Date(),
  },
});

reviewSchema.index(
  {
    status: 1,
  },
  {
    name: "status_1",
  }
);

reviewSchema.index(
  {
    rating: 1,
  },
  {
    name: "rating_1",
  }
);

const Review: Model<IReview> = Mongoose.model("Review", reviewSchema, "review");

export default Review;
