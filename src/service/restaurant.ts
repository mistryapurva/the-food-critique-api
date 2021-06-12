import fetch from "isomorphic-unfetch";
import * as _ from "lodash";
import { Types } from "mongoose";
import { BadRequest, ServerError } from "../errors";
import Restaurant, {
  IRestaurant,
  RestaurantStatus,
} from "../models/Restaurant";
import { ReviewStatus } from "../models/Review";
import { UserType } from "../models/User";

const sharp = require("sharp");

const getAllRestaurants = async (
  user: any,
  search: string = "",
  rating: number = 0,
  skip: number = 0
) => {
  const role = _.get(user, "role", UserType.USER);
  const userId = _.get(user, "_id");

  let filter: any = {};

  switch (role) {
    case UserType.ADMIN:
      // ADMIN - Get all restaurants
      break;
    case UserType.OWNER:
      // OWNER - Get only my restaurants
      filter = {
        owner: Types.ObjectId(userId),
        status: RestaurantStatus.ACTIVE,
      };
      break;
    default:
      // USER - Get only active restaurants
      filter = { status: RestaurantStatus.ACTIVE };
      break;
  }

  if (search) {
    filter.name = { $regex: new RegExp(search, "i") };
  }

  const pipeline: any[] = [
    {
      $match: filter,
    },
    {
      $lookup: {
        from: "review",
        localField: "_id",
        foreignField: "restaurant",
        as: "reviews",
      },
    },
    {
      $unwind: {
        path: "$reviews",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "user",
        localField: "reviews.author",
        foreignField: "_id",
        as: "reviews.author",
      },
    },
    {
      $unwind: {
        path: "$reviews.author",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        detail: {
          $first: "$$ROOT",
        },
        avgRating: {
          $avg: "$reviews.rating",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            {
              avgRating: "$avgRating",
            },
            "$detail",
          ],
        },
      },
    },
    {
      $sort: {
        avgRating: -1,
        name: 1,
      },
    },
  ];

  if (rating) {
    pipeline.push({
      $match: {
        avgRating: {
          $gte: rating,
        },
      },
    });
  }

  if (skip) {
    pipeline.push({
      $skip: skip,
    });
  }

  pipeline.push({
    $limit: 12,
  });

  const restaurants = await Restaurant.aggregate(pipeline);
  return restaurants;
};

const getRestaurant = async (user: any, id: string) => {
  const userRole = _.get(user, "role");

  if (!_.trim(id)) {
    throw new BadRequest("Unable to find restaurant");
  }

  const restaurants = await Restaurant.aggregate([
    {
      $match: {
        _id: Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "review",
        localField: "_id",
        foreignField: "restaurant",
        as: "reviews",
      },
    },
    {
      $unwind: {
        path: "$reviews",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "user",
        localField: "reviews.author",
        foreignField: "_id",
        as: "reviews.author",
      },
    },
    {
      $unwind: {
        path: "$reviews.author",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: {
        _id: 1,
        "reviews.createdOn": -1,
      },
    },
    {
      $group: {
        _id: "$_id",
        detail: {
          $first: "$$ROOT",
        },
        reviews: {
          $push: "$reviews",
        },
        avgRating: {
          $avg: "$reviews.rating",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            {
              avgRating: "$avgRating",
            },
            "$detail",
            {
              reviews: "$reviews",
            },
          ],
        },
      },
    },
  ]);

  const restaurantToReturn: any = _.first(restaurants);

  if (!_.isEmpty(restaurantToReturn) && userRole !== UserType.ADMIN) {
    const reviews = _.filter(_.get(restaurantToReturn, "reviews"), (review) => {
      if (_.get(review, "status") === ReviewStatus.INACTIVE) {
        return false;
      }

      return true;
    });

    restaurantToReturn.reviews = reviews;
  }

  return restaurantToReturn;
};

const createRestaurant = async (user: any, payload: IRestaurant) => {
  const userId = _.get(user, "_id");
  if (!userId) {
    throw new BadRequest("Missing owner");
  }

  const restaurantRecord: IRestaurant = new Restaurant({
    ...payload,
    owner: userId,
  });

  //validate the record
  const error = restaurantRecord.validateSync();
  if (error) {
    console.error(error);
    throw new BadRequest("Missing mandatory parameters");
  }

  //check if a restaurant already exists with the email
  const existingRestaurant = await Restaurant.findOne({
    name: payload.name,
    owner: userId,
  });

  if (!_.isEmpty(existingRestaurant)) {
    throw new ServerError("Restaurant already exists for given user");
  }

  //process image, if exists
  const image = _.get(payload, "image");
  if (image) {
    try {
      const imageData = await fetch(image).then((response: any) =>
        response.arrayBuffer()
      );

      const sharpData = await sharp(Buffer.from(imageData))
        .resize(400, 300)
        .webp({ quality: 80 })
        .toBuffer();
      restaurantRecord.imageBase64 = `data:image/png;base64,${sharpData.toString(
        "base64"
      )}`;
    } catch (error) {
      throw new ServerError("Error processing image");
    }
  }

  //insert the record
  let createdRestaurant: IRestaurant | null = null;
  try {
    createdRestaurant = await restaurantRecord.save();
  } catch (err) {
    console.error(err);
    throw new ServerError("An unexpected error occurred");
  }

  return createdRestaurant;
};

const updateRestaurant = async (user: any, payload: IRestaurant) => {
  const userId = _.get(user, "_id");
  const role = _.get(user, "role");
  if (!userId) {
    throw new BadRequest("Missing owner");
  }

  if (!_.get(payload, "id")) {
    throw new BadRequest("Unable to find restaurant");
  }

  //check if the author is an Admin, if yes, proceed
  const existingRestaurant: Partial<IRestaurant> | null =
    await Restaurant.findOne({
      _id: _.get(payload, "id"),
    }).lean();

  if (_.isEmpty(existingRestaurant)) {
    throw new ServerError("Restaurant not found");
  }

  if (
    role === UserType.OWNER &&
    _.trim(_.get(existingRestaurant, "owner")) !== _.trim(userId)
  ) {
    throw new ServerError(
      "Current user not authorized to update this restaurant"
    );
  }

  //process image, if exists
  const image = _.get(payload, "image");
  const existingImage = _.get(existingRestaurant, "image");

  if (image !== existingImage) {
    if (image) {
      try {
        const imageData = await fetch(image).then((response: any) =>
          response.arrayBuffer()
        );

        const sharpData = await sharp(Buffer.from(imageData))
          .resize(400, 300)
          .webp({ quality: 80 })
          .toBuffer();
        payload.imageBase64 = `data:image/png;base64,${sharpData.toString(
          "base64"
        )}`;
      } catch (error) {
        throw new ServerError("Error processing image");
      }
    } else {
      payload.imageBase64 = "";
    }
  }

  const updatedRestaurant: IRestaurant | null =
    await Restaurant.findByIdAndUpdate(
      payload.id,
      {
        ...existingRestaurant,
        ...payload,
        updatedOn: new Date(),
      },
      {
        lean: true,
        new: true,
      }
    );
  if (_.isEmpty(updatedRestaurant)) {
    throw new ServerError("Restaurant not found");
  }

  return updatedRestaurant;
};

const deleteRestaurant = async (id: string) => {
  if (!_.trim(id)) {
    throw new BadRequest("Unable to find restaurant");
  }

  const deletedRestaurant: IRestaurant | null =
    await Restaurant.findByIdAndUpdate(
      id,
      {
        status: RestaurantStatus.INACTIVE,
        updatedOn: new Date(),
      },
      {
        lean: true,
        new: true,
      }
    );

  return deletedRestaurant;
};

export {
  createRestaurant,
  deleteRestaurant,
  getAllRestaurants,
  getRestaurant,
  updateRestaurant,
};
