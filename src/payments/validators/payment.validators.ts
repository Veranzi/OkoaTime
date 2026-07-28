import { z } from "zod";

export const StkPushRequestSchema = z.object({
  orderId: z.string().min(1),
  phone: z.string().min(9).optional(),
});
export type StkPushRequest = z.infer<typeof StkPushRequestSchema>;

const CallbackMetadataItemSchema = z.object({
  Name: z.string(),
  Value: z.union([z.string(), z.number()]).optional(),
});

export const MpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(CallbackMetadataItemSchema),
        })
        .optional(),
    }),
  }),
});
export type MpesaCallbackBody = z.infer<typeof MpesaCallbackSchema>;

export const StatusQuerySchema = z.object({
  checkoutRequestId: z.string().min(1),
});

export const AdminListPaymentsQuerySchema = z.object({
  status: z.enum(["INITIATED", "PENDING", "COMPLETED", "FAILED", "TIMEOUT"]).optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const RetryQuerySchema = z.object({
  paymentId: z.string().min(1),
});
