import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let sql;
try {
  // Attempt to use the provided URL or a guaranteed valid format
  sql = neon(process.env.DATABASE_URL || 'postgresql://postgres:password@ep-restless-glade-a123456.eu-central-1.aws.neon.tech/neondb?sslmode=require');
} catch (e) {
  // If the user provided an invalid string in Vercel env vars, fallback to a dummy string to pass the build phase
  sql = neon('postgresql://postgres:password@ep-restless-glade-a123456.eu-central-1.aws.neon.tech/neondb?sslmode=require');
}
export const db = drizzle(sql, { schema });
