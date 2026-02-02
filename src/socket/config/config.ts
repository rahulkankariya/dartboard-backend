export const config = {
  JWTKEY: process.env.JWT_KEY ||"123456789abcdef",
  SALTROUNDS: process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 10,
  port: process.env.PORT || 5000
};