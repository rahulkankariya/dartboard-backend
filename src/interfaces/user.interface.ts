export interface Signup {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  ip: string;
}
export interface Login {
  email: string;
  password: string;
}
export interface UserEmailFound {
 email: string;
}