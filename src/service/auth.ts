import { BadRequest, ServerError } from "../errors";
import * as _ from "lodash";
import User, { IUser, UserStatus } from "../models/User";
import bcrypt from "bcrypt";
import { signJWT } from "../lib/auth";

const login = async (payload: any) => {
  const email = _.trim(_.get(payload, "email"));
  const password = _.trim(_.get(payload, "password"));

  if (_.isEmpty(email) || _.isEmpty(password)) {
    throw new BadRequest("Mandatory fields missing");
  }

  //fetch user based on email
  const user: Partial<IUser> = await User.findOne({
    email: _.toLower(email),
  })
    .select("+password")
    .lean();

  if (_.isEmpty(user)) {
    throw new ServerError("User does not exist");
  }

  //verify password
  const passwordInDb = _.get(user, "password", "");
  const isPasswordValid = bcrypt.compareSync(password, passwordInDb);
  if (isPasswordValid) {
    //check if user is active
    if (_.get(user, "status") !== UserStatus.ACTIVE) {
      throw new ServerError(
        "Account inactive. Please contact the administrator."
      );
    }

    //generate jwt
    const payload = _.pick(user, "_id", "name", "email", "role");
    const token = signJWT(payload);

    return {
      ..._.omit(user, "password"),
      token,
    };
  } else {
    throw new ServerError("Invalid credentials.");
  }
};

export { login };
