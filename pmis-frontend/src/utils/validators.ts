// Zod validation schemas for PMIS forms
import { z } from 'zod';

export const emailSchema = z.string().email({ message: 'Invalid email address' });
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password must be at most 64 characters')
  .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).*$/, {
    message: 'Password must include uppercase, lowercase, number, and symbol'
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean(),
});

export const requiredString = z.string().min(1, 'Required');

export const projectFormSchema = z.object({
  name: requiredString,
  description: requiredString,
  startDate: z.string().refine(d => Date.parse(d) > 0, { message: 'Invalid date' }),
  endDate: z.string().refine(d => Date.parse(d) > 0, { message: 'Invalid date' }),
  budget: z.number().min(0, 'Must be positive'),
  priority: z.enum(['high', 'medium', 'low']),
});

export const validatePasswordStrength = (pwd: string): boolean =>
  passwordSchema.safeParse(pwd).success;
