import { BadRequest, ServerError, UnauthorizedError } from "../errors";
import User, { UserStatus, IUser, UserType } from "../models/User";
import * as _ from "lodash";

const getAllUsers = async () => {
  return await User.find().lean();
};

const getUser = async (id: string) => {
  if (!_.trim(id)) {
    throw new BadRequest("Unable to find user");
  }
  return await User.findById(id).lean();
};

const createUser = async (payload: IUser) => {
  const userRecord: IUser = new User({
    ...payload,
    email: _.toLower(payload.email),
  });

  //validate the record
  const error = userRecord.validateSync();
  if (error) {
    console.error(error);
    throw new BadRequest("Missing mandatory parameters");
  }

  //check if a user already exists with the email
  const existingUser = await User.findOne({
    email: _.toLower(payload.email),
  });

  if (!_.isEmpty(existingUser)) {
    throw new ServerError("User already exists");
  }

  //insert the record
  let createdUser: IUser | null = null;
  try {
    createdUser = await userRecord.save();
  } catch (err) {
    console.error(err);
    throw new ServerError("An unexpected error occurred");
  }

  //return all fields back to the route, without the password
  return _.omit(createdUser.toJSON(), "password");
};

const updateUser = async (user: any, payload: IUser) => {
  if (!_.get(payload, "id")) {
    throw new BadRequest("Unable to find user");
  }
  if (!_.trim(_.get(payload, "name"))) {
    throw new BadRequest("Missing mandatory fields");
  }

  const existingUser = await User.findOne({
    _id: payload.id,
  }).lean();

  if (_.get(user, "role") !== UserType.ADMIN && payload.role) {
    //do not allow role change
    if (payload.role !== _.get(existingUser, "role")) {
      throw new UnauthorizedError(
        "You are not allowed to change your role. Please contact the administrator."
      );
    }
  }

  const updatedUser: IUser | null = await User.findByIdAndUpdate(
    payload.id,
    {
      name: _.trim(_.get(payload, "name", _.get(existingUser, "name"))),
      status: _.get(payload, "status", _.get(existingUser, "status")),
      role: _.get(payload, "role", _.get(existingUser, "role")),
      updatedOn: new Date(),
    },
    {
      lean: true,
      new: true,
    }
  );
  if (_.isEmpty(updatedUser)) {
    throw new ServerError("User not found");
  }

  return updatedUser;
};

const deleteUser = async (id: string) => {
  if (!_.trim(id)) {
    throw new BadRequest("Unable to find user");
  }

  const deletedUser: IUser | null = await User.findByIdAndUpdate(
    id,
    {
      status: UserStatus.INACTIVE,
      updatedOn: new Date(),
    },
    {
      lean: true,
      new: true,
    }
  );

  return deletedUser;
};

export { createUser, deleteUser, getAllUsers, getUser, updateUser };
