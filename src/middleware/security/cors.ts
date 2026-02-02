import cors, { 
  type CorsOptions, 
  type CorsOptionsDelegate, 
  type CorsRequest 
} from "cors";

export const ALLOWED_ORIGINS: string[] = ["http://localhost:3000"]; // Add your domain here
export const ALLOW_NULL = true;

const optionsDelegate: CorsOptionsDelegate<CorsRequest> = (req, callback) => {
  const originHeader = req.headers["origin"] as string | undefined;
  
  // Allow if there's no origin (Postman/Mobile) OR if the origin is in our list
  const allow = !originHeader ? ALLOW_NULL : ALLOWED_ORIGINS.includes(originHeader);

  const options: CorsOptions = {
    origin: allow ? (originHeader ?? true) : false,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposedHeaders: ["Content-Disposition", "X-Request-Id"],
    optionsSuccessStatus: 204,
  };

  if (!allow) {
    return callback(new Error(`CORS blocked: ${originHeader ?? "No Origin"}`), options);
  }
  
  callback(null, options);
};

export const corsMiddleware = cors(optionsDelegate);

export const publicCors = cors({
  origin: "*",
  credentials: false,
  methods: ["GET", "HEAD", "OPTIONS"],
  optionsSuccessStatus: 204,
});