import { Signup, Login } from "../../interfaces";
import {
  ApiError,
  hashPassword,
  comparePassword,
  generateToken,
} from "../../utils";
import { UserRepository } from "../repository";

export class AuthService {
  static async signup(payload: Signup) {
    // 1. Check if user already exists
    const existingUser = await UserRepository.findByEmail({
      email: payload.email,
    });
    if (existingUser) {
      throw ApiError.conflict("User_already_exists");
    }

    // 2. Security: Hash Password
    const encryptedPassword = await hashPassword(payload.password);

    // 3. Save to DB
    const newUser = await UserRepository.createUser({
      ...payload,
      password: encryptedPassword,
    });

    // 4. Prepare Response Data (Fixing the 'delete' error)
    // We extract password out and collect everything else into 'userWithoutPassword'
    const { password, ...userWithoutPassword } = newUser.toObject();

    // 5. Generate Token
    const token = generateToken({ id: userWithoutPassword._id });

    return {
      user: userWithoutPassword,
      token,
    };
  }

  static async login(payload: Login) {
    // 1. Find user
    const user = await UserRepository.findByEmail({ email: payload.email });
    if (!user) {
      throw ApiError.notFound("Invalid_credentials");
    }

    // 2. Compare password
    const isMatch = await comparePassword(payload.password, user.password);
    if (!isMatch) {
      throw ApiError.badRequest("Invalid_credentials");
    }

    // 3. Prepare Response Data (Using destructuring here too)
    const { password, ...userWithoutPassword } = user.toObject();

    // 4. Generate Token
    const token = generateToken({ id: userWithoutPassword._id });

    return {
      user: userWithoutPassword,
      token,
    };
  }
}
