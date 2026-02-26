import { z } from "zod";

// ── Company ──
export const companySchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
    cuit: z.string().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
    email: z.union([
        z.string().email("Email inválido"),
        z.literal(""),
    ]).optional(),
    phone: z.string().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
    industry: z.string().max(100).optional().or(z.literal("")),
    website: z.string().url("URL inválida").optional().or(z.literal("")),
    notes: z.string().max(2000, "Máximo 2000 caracteres").optional().or(z.literal("")),
});
export type CompanyFormData = z.infer<typeof companySchema>;

// ── Contact ──
export const contactSchema = z.object({
    companyId: z.number({ error: "Seleccioná una empresa" }).int().positive("Seleccioná una empresa"),
    fullName: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
    email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
    phone: z.string().max(30).optional().or(z.literal("")),
    position: z.string().max(100).optional().or(z.literal("")),
    notes: z.string().max(2000).optional().or(z.literal("")),
});
export type ContactFormData = z.infer<typeof contactSchema>;

// ── Deal ──
export const dealSchema = z.object({
    title: z.string().min(1, "El título es obligatorio").max(200),
    companyId: z.number().int().positive().optional().or(z.literal(0)),
    contactId: z.number().int().positive().optional().or(z.literal(0)),
    assignedToId: z.number().int().positive().optional().or(z.literal(0)),
    stage: z.enum(["Lead", "Contacted", "Proposal", "Negotiation", "ClosedWon", "ClosedLost"]).default("Lead"),
    value: z.number().min(0, "El valor no puede ser negativo").optional(),
    currency: z.string().max(10).default("ARS"),
    notes: z.string().max(5000).optional().or(z.literal("")),
    expectedCloseDate: z.string().optional().or(z.literal("")),
});
export type DealFormData = z.infer<typeof dealSchema>;

// ── Project ──
export const projectSchema = z.object({
    companyId: z.number({ error: "Seleccioná una empresa" }).int().positive("Seleccioná una empresa"),
    name: z.string().min(1, "El nombre es obligatorio").max(200),
    description: z.string().max(2000).optional().or(z.literal("")),
    status: z.enum(["Planned", "InProgress", "Paused", "Done"]).default("Planned"),
    startDate: z.string().optional().or(z.literal("")),
    endDateEstimated: z.string().optional().or(z.literal("")),
    estimatedHours: z.number().min(0, "Las horas no pueden ser negativas").optional(),
});
export type ProjectFormData = z.infer<typeof projectSchema>;

// ── Task ──
export const taskSchema = z.object({
    projectId: z.number().int().positive("Seleccioná un proyecto"),
    title: z.string().min(1, "El título es obligatorio").max(300),
    description: z.string().max(5000).optional().or(z.literal("")),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
    assigneeId: z.number().int().positive().optional(),
    dueDate: z.string().optional().or(z.literal("")),
});
export type TaskFormData = z.infer<typeof taskSchema>;

// ── Time Entry ──
export const timeEntrySchema = z.object({
    taskId: z.number().int().positive("Seleccioná una tarea"),
    userId: z.number().int().positive(),
    date: z.string().min(1, "La fecha es obligatoria"),
    hours: z.number().min(0.1, "Mínimo 0.1 hora").max(24, "Máximo 24 horas"),
    description: z.string().max(1000).optional().or(z.literal("")),
});
export type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

/**
 * Helper: validate and return parsed data or toast errors
 */
export function validateForm<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    onError: (msg: string) => void,
): T | null {
    const result = schema.safeParse(data);
    if (result.success) return result.data;
    result.error.issues.forEach((issue) => onError(issue.message));
    return null;
}
