import { Login, Signup, UserEmailFound } from "../../interfaces";
import { UserModel } from "../../models/users";

export class UserRepository {
  static async createUser(payload: Signup) {
    return await UserModel.create(payload);
  }

  static async findByEmail(payload: UserEmailFound) {
    return await UserModel.findOne({ email: payload.email, isDeleted: false });
  }

  static async login(payload: Login) {
    return await UserModel.findOne({ email: payload.email, isDeleted: false });
  }
}
