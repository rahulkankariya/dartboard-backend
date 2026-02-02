import { Schema, model, InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
{
  timestamps: true,
  versionKey: false,
}
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
