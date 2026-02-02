import { Request, Response, NextFunction } from "express";



import { HTTP_STATUS, sendResponse } from "../../utils";
import { loginSchema, signupSchema } from "../validators";
import { AuthService } from "../services";

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("Signup request body:", req.body); // Debug log 
      const { error, value } = await signupSchema.validate(req.body);
     
      if (error) {
         console.log("Validation result:",error.details[0],); // Debug log
        return sendResponse({
          res,
          messageKey: error.details[0].message,
          data: null,
          status: HTTP_STATUS.BAD_REQUEST,
          req,
        });
      }

      const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";

      const user = await AuthService.signup({ ...value, ip });

      return sendResponse({
        res,
        messageKey: "signup_success",
        data: user,
        status: HTTP_STATUS.CREATED,
        req,
      });
    } catch (err) {
      next(err);
    }
  }
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return sendResponse({
          res,
          messageKey: error.details[0].message,
          data: null,
          status: HTTP_STATUS.BAD_REQUEST,
          req,
        });
      }

      const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";

      const user = await AuthService.login({ ...value, ip });

      return sendResponse({
        res,
        messageKey: "login_success",
        data: user,
        status: HTTP_STATUS.OK,
        req,

      });
    } catch (err) {
      next(err);
    }
  }
}
