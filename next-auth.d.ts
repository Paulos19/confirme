import { UserRole } from "@prisma/client"
import NextAuth, { type DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

// 1. Estendendo a Sessão (o que você acessa em useSession ou auth())
declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole
    } & DefaultSession["user"]
  }

  // 2. Estendendo o Objeto User (usado nos callbacks)
  interface User {
    role: UserRole
  }
}

// 3. Estendendo o Token JWT (onde persistimos a role)
declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
  }
}