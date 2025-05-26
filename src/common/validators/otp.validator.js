import z from "zod"

export const OtpEmailValidationSchema = z.string().email().optional().default("")
export const OtpPhoneNumberValidationSchema = z.string().regex(/^\+?[0-9]+$/).optional().default("")