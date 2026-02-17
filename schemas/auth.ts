import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "É necessário um email válido.",
  }),
  password: z.string().min(1, {
    message: "A palavra-passe é obrigatória.",
  }),
});

export const RegisterSchema = z.object({
  name: z.string().min(3, {
    message: "O nome deve ter pelo menos 3 caracteres.",
  }),
  email: z.string().email({
    message: "É necessário um email válido.",
  }),
  password: z.string().min(6, {
    message: "A palavra-passe deve ter pelo menos 6 caracteres.",
  }),
});