// OpenAPI 3.0 spec for the Payments module — rendered by Swagger UI at
// /admin/api-docs (admin-only page). Kept as a plain object (not fetched
// over the network) so the spec never needs its own public API route.
//
// IMPORTANT: "Try it out" in Swagger UI sends REAL requests to this
// deployment's live API routes, using whatever Safaricom credentials
// (MPESA_ENV) are configured in this environment's .env. If that is
// "production", stkpush sends a REAL STK prompt for the REAL order total,
// and a successful PIN entry moves REAL money. There is no sandbox/mock
// mode built into the API itself — the environment is whatever is deployed.

export const paymentsOpenApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "OkoaTime Payments API",
    version: "1.0.0",
    description:
      "M-Pesa payments module. Every endpoint below is a REAL call against this deployment. " +
      "⚠️ stkpush and query can move real money if this environment's MPESA_ENV=production. " +
      "Use the 'Authorize' button (top right) with a Firebase ID token — see the copy-token " +
      "helper above this widget on the /admin/api-docs page.",
  },
  servers: [{ url: "/", description: "This deployment" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Firebase ID token",
        description: "Paste a Firebase ID token (see the copy-token helper on this page).",
      },
    },
    schemas: {
      InitiateStkPushRequest: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string", description: "An existing order's Firestore document ID. Must belong to the calling user." },
          phone: { type: "string", description: "Optional M-Pesa phone override (e.g. 0712345678). Defaults to the order's phone.", example: "0712345678" },
        },
      },
      InitiateStkPushResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          paymentId: { type: "string" },
          checkoutRequestId: { type: "string", nullable: true },
          message: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      PaymentStatusResponse: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "completed", "failed"] },
          mpesaReceiptNumber: { type: "string", nullable: true },
          failureReason: { type: "string", nullable: true },
        },
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderId: { type: "string" },
          customerId: { type: "string" },
          phone: { type: "string" },
          amount: { type: "number" },
          status: { type: "string", enum: ["INITIATED", "PENDING", "COMPLETED", "FAILED", "TIMEOUT"] },
          environment: { type: "string", enum: ["sandbox", "production"] },
          checkoutRequestId: { type: "string" },
          merchantRequestId: { type: "string" },
          mpesaReceiptNumber: { type: "string" },
          resultCode: { type: "number" },
          resultDesc: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RetryQueryRequest: {
        type: "object",
        required: ["paymentId"],
        properties: { paymentId: { type: "string" } },
      },
      MpesaCallbackBody: {
        type: "object",
        description: "Shape Safaricom itself POSTs. Do not call this manually against production — it's documented for reference. An unrecognized CheckoutRequestID is safely logged and ignored (no side effects), so a synthetic test payload against sandbox is harmless.",
        properties: {
          Body: {
            type: "object",
            properties: {
              stkCallback: {
                type: "object",
                properties: {
                  MerchantRequestID: { type: "string" },
                  CheckoutRequestID: { type: "string" },
                  ResultCode: { type: "integer", example: 0 },
                  ResultDesc: { type: "string", example: "The service request is processed successfully." },
                  CallbackMetadata: {
                    type: "object",
                    properties: {
                      Item: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            Name: { type: "string" },
                            Value: { oneOf: [{ type: "string" }, { type: "number" }] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/payments/mpesa/stkpush": {
      post: {
        summary: "Initiate an STK push for an order",
        description:
          "⚠️ MONEY-MOVING. Charges the order's server-side total (never the amount in this request body) to the phone number provided. " +
          "Requires the caller to own the order. Idempotent for ~90s — a repeat call for the same orderId while one attempt is in flight reuses it instead of sending a second prompt.",
        tags: ["Customer"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/InitiateStkPushRequest" } } },
        },
        responses: {
          "200": { description: "STK push sent (or reused an in-flight attempt)", content: { "application/json": { schema: { $ref: "#/components/schemas/InitiateStkPushResponse" } } } },
          "400": { description: "Invalid request / order not payable via M-Pesa / Safaricom rejected the push", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Missing/invalid Firebase ID token", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Order does not belong to the caller", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Order not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Order already paid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/api/payments/mpesa/status": {
      get: {
        summary: "Poll payment status by checkoutRequestId",
        description: "Read-only. Caller must own the payment (or be an admin).",
        tags: ["Customer"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "checkoutRequestId", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Current status", content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentStatusResponse" } } } },
          "401": { description: "Missing/invalid Firebase ID token" },
          "403": { description: "Not your payment" },
          "404": { description: "No payment found for that checkoutRequestId" },
        },
      },
    },
    "/api/payments/mpesa/callback": {
      post: {
        summary: "Safaricom STK callback (webhook — Safaricom calls this, not you)",
        description: "Always responds 200 with {ResultCode:0} regardless of internal outcome, to avoid Safaricom's retry storms. Documented for reference only.",
        tags: ["Webhook (reference only)"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MpesaCallbackBody" } } },
        },
        responses: {
          "200": { description: "Always — Safaricom's expected ack shape", content: { "application/json": { schema: { type: "object", properties: { ResultCode: { type: "integer" }, ResultDesc: { type: "string" } } } } } },
        },
      },
    },
    "/api/payments/mpesa/query": {
      post: {
        summary: "Admin: manually re-query Safaricom for a payment's real status",
        description: "⚠️ Talks to Safaricom. Use when a payment is stuck PENDING and the callback never arrived. Admin-only.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RetryQueryRequest" } } },
        },
        responses: {
          "200": { description: "Reconciled payment", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, payment: { $ref: "#/components/schemas/Payment" } } } } } },
          "401": { description: "Missing/invalid Firebase ID token" },
          "403": { description: "Not an admin" },
          "404": { description: "Payment not found" },
        },
      },
    },
    "/api/payments/admin/list": {
      get: {
        summary: "Admin: list/search/filter payment records",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["INITIATED", "PENDING", "COMPLETED", "FAILED", "TIMEOUT"] } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Matches orderId, phone, receipt, or checkoutRequestId" },
          { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          "200": { description: "Matching payments", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, payments: { type: "array", items: { $ref: "#/components/schemas/Payment" } } } } } } },
          "401": { description: "Missing/invalid Firebase ID token" },
          "403": { description: "Not an admin" },
        },
      },
    },
    "/api/payments/admin/export": {
      get: {
        summary: "Admin: export payment records as CSV",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["INITIATED", "PENDING", "COMPLETED", "FAILED", "TIMEOUT"] } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          "200": { description: "CSV file", content: { "text/csv": { schema: { type: "string", format: "binary" } } } },
          "401": { description: "Missing/invalid Firebase ID token" },
          "403": { description: "Not an admin" },
        },
      },
    },
  },
};
