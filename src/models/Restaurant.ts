import Mongoose, { Schema, Document, Model } from "mongoose";

export enum RestaurantStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface IRestaurant extends Document {
  id?: string;
  name: string;
  description?: string;
  image?: string;
  imageBase64?: string;
  owner: string;
  status: RestaurantStatus;
  createdOn?: Date;
  updatedOn?: Date;
}

const restaurantSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
  },
  imageBase64: {
    type: String,
  },
  status: {
    type: String,
    enum: Object.values(RestaurantStatus).map((val) => val),
    default: RestaurantStatus.ACTIVE,
  },
});

restaurantSchema.index(
  {
    status: 1,
  },
  {
    name: "status_1",
  }
);

const Restaurant: Model<IRestaurant> = Mongoose.model(
  "Restaurant",
  restaurantSchema,
  "restaurant"
);

export default Restaurant;
