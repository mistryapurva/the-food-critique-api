import { NativeError, Schema, Document, Model, model } from "mongoose";
import * as bcrypt from "bcrypt";

export enum UserType {
  USER = "USER",
  OWNER = "OWNER",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface IUser extends Document {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: UserType;
  status: UserStatus;
  createdOn?: Date;
  updatedOn?: Date;
}

const userSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: Object.values(UserType).map((val) => val),
    default: UserType.USER,
  },
  status: {
    type: String,
    enum: Object.values(UserStatus).map((val) => val),
    default: UserStatus.ACTIVE,
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

const SALT_ROUNDS = 10;

/**
 * Add a pre-save trigger to the user schema, to hash the password if the password has changed
 */
userSchema.pre("save", function (next: (error?: NativeError) => void) {
  const user = this;

  if (user.isModified("password")) {
    return hashPassword(user, next);
  }

  return next();
});

/**
 * Method to hash the password entered by a user
 * @param user
 * @param cb
 */
function hashPassword(user: any, cb: (error?: NativeError) => void) {
  return bcrypt.hash(user.password, SALT_ROUNDS, (err: any, hash: string) => {
    if (err) {
      return cb(err);
    }

    user.password = hash;
    return cb();
  });
}

userSchema.index(
  {
    email: 1,
  },
  {
    name: "email_1",
  }
);

const User: Model<IUser> = model("User", userSchema, "user");

export default User;
