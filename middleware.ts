import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Matcher para ignorar arquivos estáticos e imagens
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};