import { z } from 'zod';

export const roleOptions = ['nurse', 'admin'] as const;
export type RoleOption = (typeof roleOptions)[number];

export const roleLabelMap: Record<RoleOption, string> = {
  nurse: 'Krankenschwester',
  admin: 'Administrator',
};

const qualificationItemSchema = z.string().trim().min(1);

export const staffCreateSchema = z.object({
  displayName: z.string().trim().min(1, 'Name ist erforderlich'),
  email: z
    .string()
    .trim()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse'),
  phone: z
    .string()
    .trim()
    .min(1, 'Telefonnummer ist erforderlich')
    .regex(/^[+]?[- 0-9()]{10,}$/u, 'Ungültige Telefonnummer'),
  jobTitle: z
    .union([z.string().trim().min(1, 'Berufsbezeichnung ist erforderlich'), z.literal('')])
    .optional(),
  role: z.enum(roleOptions),
  qualifications: z
    .array(qualificationItemSchema)
    .min(1, 'Mindestens eine Qualifikation ist erforderlich'),
  workingHoursPerWeek: z
    .number()
    .min(1, 'Mindestens 1 Stunde pro Woche erforderlich')
    .max(80, 'Maximal 80 Stunden pro Woche erlaubt')
    .optional(),
  group: z.string().optional().default(''),
  active: z.boolean().default(true),
  address: z
    .object({
      street: z.string().trim().optional(),
      houseNumber: z.string().trim().optional(),
      postalCode: z.string().trim().optional(),
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      country: z.string().trim().optional(),
    })
    .optional(),
  contact: z
    .object({
      phoneMobile: z.string().trim().optional(),
      phoneHome: z.string().trim().optional(),
      phoneWork: z.string().trim().optional(),
      emailPrivate: z.string().trim().email('Ungültige E-Mail-Adresse').optional(),
    })
    .optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().optional(),
      relation: z.string().trim().optional(),
      phone: z.string().trim().optional(),
      email: z.string().trim().email('Ungültige E-Mail-Adresse').optional(),
      address: z.string().trim().optional(),
    })
    .optional(),
  bankAccount: z
    .object({
      iban: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val || val === '') return true; // Leer ist erlaubt
            const cleaned = val.replace(/\s+/g, ''); // Leerzeichen entfernen
            return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/u.test(cleaned);
          },
          { message: 'Ungültige IBAN (Format: DE89 3704 0044 0532 0130 00)' }
        )
        .optional(),
      bic: z.string().trim().optional(),
      bankName: z.string().trim().optional(),
      accountHolder: z.string().trim().optional(),
    })
    .optional(),
  education: z
    .object({
      highestDegree: z.string().trim().optional(),
      institution: z.string().trim().optional(),
      graduationYear: z
        .number()
        .int()
        .min(1900, 'Ungültiges Jahr')
        .max(new Date().getFullYear() + 1, 'Ungültiges Jahr')
        .optional(),
      apprenticeships: z
        .array(
          z.object({
            title: z.string().trim(),
            provider: z.string().trim().optional(),
            startDate: z.string().trim().optional(),
            endDate: z.string().trim().optional(),
          })
        )
        .optional(),
      trainings: z
        .array(
          z.object({
            title: z.string().trim(),
            provider: z.string().trim().optional(),
            date: z.string().trim().optional(),
            hours: z.number().int().min(0).optional(),
          })
        )
        .optional(),
      certificates: z
        .array(
          z.object({
            name: z.string().trim(),
            issuer: z.string().trim().optional(),
            issuedAt: z.string().trim().optional(),
            expiresAt: z.string().trim().optional(),
            certificateId: z.string().trim().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  driversLicense: z
    .object({
      hasLicense: z.boolean().optional(),
      classes: z.array(z.string().trim()).optional(),
      ownCar: z.boolean().optional(),
      notes: z.string().trim().optional(),
    })
    .optional(),
});

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

export const staffUpdateSchema = staffCreateSchema.partial().extend({
  id: z.string().optional(),
  qualifications: z.array(qualificationItemSchema).optional(),
  customRoleId: z.string().optional().nullable(),
});

export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;


