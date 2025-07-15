import path from "path";
import { MessageConsumerPact, Matchers } from "@pact-foundation/pact";
const { like, eachLike } = Matchers;

import { z } from "zod";

// Zod schema for OrderResult message
export const OrderResultSchema = z.object({
  order_id: z.string(),
  shipping_tracking_id: z.string(),
  shipping_cost: z.object({
    currency_code: z.string(),
    units: z.number().int(),
    nanos: z.number().int(),
  }),
  shipping_address: z.object({
    street_address: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zip_code: z.string(),
  }),
  items: z.array(z.object({
    item: z.object({
      product_id: z.string(),
      quantity: z.number().int(),
    }),
    cost: z.object({
      currency_code: z.string().regex(/^[A-Z]{3}$/, { message: "Must be a 3-letter uppercase currency code" }),
      units: z.number().int(),
      nanos: z.number().int(),
    }),
  })),
});

type OrderResult = z.infer<typeof OrderResultSchema>;


describe("Checkout → Accounting message contract", () => {
  const messagePact = new MessageConsumerPact({
    consumer: "checkout",
    provider: "accounting",
    dir: path.resolve(process.cwd(), "pacts"),
    logLevel: "warn",
    pactfileWriteMode: "update",
  });

  describe("when an order is placed on the queue", () => {
    it("should produce an OrderResult message for accounting", () => {
      return messagePact
        .expectsToReceive("a completed order from checkout")
        .withContent({
          order_id: like("ORDER-123"),
          shipping_tracking_id: like("TRACK-456"),
          shipping_cost: {
            currency_code: like("USD"),
            units: like(12),
            nanos: like(500000000),
          },
          shipping_address: {
            street_address: like("123 Main St"),
            city: like("Mountain View"),
            state: like("CA"),
            country: like("USA"),
            zip_code: like("94043"),
          },
          items: eachLike({
            item: {
              product_id: like("SKU-001"),
              quantity: like(2),
            },
            cost: {
              currency_code: like("USD"),
              units: like(20),
              nanos: like(0),
            },
          }),
        })
        .withMetadata({
          "content-type": "application/json",
        })
        .verify(suppliedMessage => {
          // Parse if string (json), else use as is
          const raw = typeof suppliedMessage === "string" ? JSON.parse(suppliedMessage) : suppliedMessage;
          const msg = raw.contents;
          // Zod runtime validation
          const result = OrderResultSchema.safeParse(msg);
          if (!result.success) {
            // Fail with detailed Zod error
            throw new Error("OrderResult validation failed: " + JSON.stringify(result.error.format(), null, 2));
          }
          // If validation passes, test passes

          return Promise.resolve();
        });
    });
  });
});
