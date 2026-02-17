"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { LoginSchema, RegisterSchema } from "@/schemas/auth";
import { signIn } from "@/auth"; // O seu ficheiro de config do NextAuth
import { AuthError } from "next-auth";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos!" };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard", // Redirecionamento após sucesso
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Credenciais inválidas!" };
        default:
          return { error: "Algo correu mal!" };
      }
    }
    throw error; // Necessário para o redirecionamento funcionar
  }
};

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos!" };
  }

  const { email, password, name } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Este email já está em uso!" };
  }

  // Lógica de Admin baseada em Variável de Ambiente
  const isAdmin = email === process.env.ADMIN_EMAIL;

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: isAdmin ? "ADMIN" : "USER",
    },
  });

  return { success: "Conta criada! Pode iniciar sessão." };
};