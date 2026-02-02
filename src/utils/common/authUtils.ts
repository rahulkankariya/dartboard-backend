import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import NodeCache from "node-cache";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};


export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};


export const generateToken = (payload: object) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);


export const verifyJwt = (token: string) =>
  jwt.verify(token, JWT_SECRET) as any;

export const generateUniqueId = (): string => uuidv4();


const cacheDays = Number(process.env.LOCAL_CACHE_DAY) || 7;


const ttlInSeconds = cacheDays * 24 * 60 * 60;

export const memoryCache = new NodeCache({ stdTTL: ttlInSeconds });

