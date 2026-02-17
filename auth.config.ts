import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redireciona para login
      } else if (isLoggedIn) {
        // Se já está logado e tenta ir pro login, manda pro dashboard
        if (nextUrl.pathname === "/login") {
           return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }
      return true;
    },
    // Adicionar Role à sessão para usar no front
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        // @ts-ignore // Estenderemos o tipo depois
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    }
  },
  providers: [], // Configurado no auth.ts para evitar erro de bcrypt no Edge
} satisfies NextAuthConfig;