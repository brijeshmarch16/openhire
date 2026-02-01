import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./auth-schema";

// Create postgres connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

// Create drizzle instance with schema
export const db = drizzle(client, { schema: { ...authSchema } });
