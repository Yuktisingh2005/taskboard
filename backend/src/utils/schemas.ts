import { z } from "zod";
import { TASK_STATUSES } from "./constants";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Must be a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid id");

export const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Board name is required").max(80),
});

export const updateBoardSchema = createBoardSchema;

export const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email"),
  role: z.enum(["editor", "viewer"]).default("editor"),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().max(2000).default(""),
  status: z.enum(TASK_STATUSES).default("todo"),
  assigneeId: objectId.nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const updateTaskSchema = z
  .object({
    // The version of the task the client was looking at when it made this edit.
    baseVersion: z.number().int().min(0, "baseVersion is required"),
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(TASK_STATUSES).optional(),
    position: z.number().optional(),
    assigneeId: objectId.nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== "baseVersion"), {
    message: "Send at least one field to update",
  });