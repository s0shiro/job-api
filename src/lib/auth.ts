import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, jwt } from "better-auth/plugins";
import db from "./db/connection.ts";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    advanced: { disableOriginCheck: true },
    trustedOrigins: ["*"],
    emailAndPassword: {
    enabled: true,
    
  },
   plugins: [
        admin(),
        jwt(),
        bearer(),
    ]
});