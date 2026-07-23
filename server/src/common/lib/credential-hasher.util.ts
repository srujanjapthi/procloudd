import bcrypt from "bcrypt";
import AppConfig from "@/config/app.config.js";

export async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, AppConfig.password.saltRounds);
}

export async function verify(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
