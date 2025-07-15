import path from "path";
import { Verifier } from '@pact-foundation/pact';
import { execSync } from "child_process";
import { Kafka, Message } from "kafkajs";
import fetch from "node-fetch";

/**
 * Stores the original replica count for the accounting deployment.
 */
let accountingReplicas = 1;

/**
 * Scales down the accounting deployment and waits until all pods are gone.
 * Stores the original replica count for restoration.
 */
function scaleDownAccountingAndWait() {
  console.log("Checking current accounting replica count...");
  try {
    const output = execSync(
      "kubectl -n otel-demo get deployment accounting -o jsonpath='{.spec.replicas}'"
    ).toString();
    accountingReplicas = parseInt(output.replace(/'/g, '').trim(), 10) || 1;
    console.log(`Original accounting replica count: ${accountingReplicas}`);
  } catch (err) {
    console.warn("Could not determine original replica count, defaulting to 1.");
    accountingReplicas = 1;
  }

  console.log("Scaling down accounting deployment...");
  execSync("kubectl -n otel-demo scale deployment accounting --replicas=0", { stdio: "inherit" });

  // Poll for pods until none are left, with a short delay between checks
  let pods = 1;
  while (pods > 0) {
    try {
      const output = execSync(
        "kubectl -n otel-demo get pods -l app=accounting --no-headers 2>/dev/null | wc -l"
      ).toString();
      pods = parseInt(output.trim(), 10);
      if (pods > 0) {
        console.log(`Waiting for accounting pods to terminate... (${pods} remaining)`);
      }
    } catch (err) {
      pods = 1;
      console.log("Error checking pods, will retry...");
    }
    if (pods > 0) {
      // Sleep for 2 seconds before next check
      execSync("sleep 2");
    }
  }
  console.log("All accounting pods are terminated.");
}

/**
 * Waits for the frontend proxy to be healthy before triggering checkout.
 * Polls /health until HTTP 200 or timeout.
 */
async function waitForFrontendHealthy({ url, timeoutMs = 10000, intervalMs = 1000 }: { url: string, timeoutMs?: number, intervalMs?: number }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`Frontend healthy at ${url}`);
        return;
      } else {
        console.log(`Waiting for frontend: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.log("Waiting for frontend: not reachable yet");
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out waiting for frontend to be healthy at ${url}`);
}

/**
 * Scales up the accounting deployment to its original replica count and waits for pods to be ready.
 */
function scaleUpAccountingAndWait() {
  console.log(`Scaling up accounting deployment to ${accountingReplicas} replicas...`);
  execSync(`kubectl -n otel-demo scale deployment accounting --replicas=${accountingReplicas}`, { stdio: "inherit" });

  // Wait for pods to be ready
  let ready = false;
  while (!ready) {
    try {
      const output = execSync(
        `kubectl -n otel-demo get deployment accounting -o jsonpath='{.status.readyReplicas}'`
      ).toString();
      const readyReplicas = parseInt(output.replace(/'/g, '').trim(), 10) || 0;
      if (readyReplicas >= accountingReplicas) {
        ready = true;
      } else {
        console.log(`Waiting for accounting pods to be ready... (${readyReplicas}/${accountingReplicas})`);
        execSync("sleep 2");
      }
    } catch (err) {
      console.log("Waiting for accounting pods to be ready (error reading status)...");
      execSync("sleep 2");
    }
  }
  console.log("Accounting deployment scaled up and ready.");
}

/**
 * Produces an OrderResult message by triggering a checkout and consuming from Kafka.
 * Uses environment variables for config where possible.
 * @returns {Promise<object>} The parsed order result message from Kafka.
 * @throws {Error} If the checkout API call fails or Kafka message is not received/parsed.
 */
async function produceOrderResultMessage(): Promise<object> {
  const apiUrl = process.env.CHECKOUT_API_URL || "http://localhost:3000/api/checkout";
  const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
  const kafkaTopic = process.env.KAFKA_TOPIC || "orders";

  // 1. Trigger checkout via frontend API
  const checkoutRes = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test-pact@example.com",
      address: {
        street_address: "123 Main St",
        city: "Mountain View",
        state: "CA",
        country: "USA",
        zip_code: "94043"
      },
      items: [
        { product_id: "SKU-001", quantity: 2 },
        { product_id: "SKU-002", quantity: 1 }
      ]
    })
  });
  if (!checkoutRes.ok) {
    throw new Error(`Checkout API call failed: ${checkoutRes.status} ${checkoutRes.statusText}`);
  }

  // 2. Consume the next message from the Kafka topic
  const kafka = new Kafka({ brokers: [kafkaBroker] });
  const consumer = kafka.consumer({ groupId: `pact-verifier-${Date.now()}` });
  await consumer.connect();
  await consumer.subscribe({ topic: kafkaTopic, fromBeginning: false });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(async () => {
      await consumer.disconnect();
      reject(new Error("Timed out waiting for message from Kafka"));
    }, 10000);

    consumer.run({
      eachMessage: async ({ message }: { message: Message }) => {
        clearTimeout(timeout);
        try {
          const result = JSON.parse(message.value?.toString() || "{}");
          await consumer.disconnect();
          resolve(result);
        } catch (err) {
          await consumer.disconnect();
          reject(new Error("Failed to parse message from Kafka: " + err));
        }
      },
    });
  });
}

/**
 * Runs the Pact provider verification for the checkout provider.
 * @returns {Promise<string>} A promise that resolves with the verification result message.
 * @throws {Error} If the verification fails.
 */

async function verifyProvider(): Promise<string> {
  const opts = {
    pactUrls: [path.resolve(__dirname, "pacts/accounting-checkout.json")],
    messageProviders: {
      "a completed order from checkout": produceOrderResultMessage,
    },
    provider: "checkout",
    consumer: "accounting",
    logLevel: "info" as any,
  };
  return new Verifier(opts).verifyProvider();
}

// --- Actions (side effects) ---

(async () => {
  try {
    scaleDownAccountingAndWait();

    // Wait for frontend proxy to be healthy before triggering checkout
    await waitForFrontendHealthy({ url: "http://localhost:8080" });

    // Define the checkout payload
    const checkoutPayload = {
      userId: "pact-test-user",
      userCurrency: "USD",
      address: {
        streetAddress: "123 Main St",
        city: "Mountain View",
        state: "CA",
        country: "USA",
        zipCode: "94043"
      },
      email: "someone@example.com",
      creditCard: {
        creditCardNumber: "4432-8015-6152-0454",
        creditCardExpirationMonth: "January",
        creditCardExpirationYear: 2030,
        creditCardCvv: 123
      }
    };

    // Type checks for int32 fields
    const intChecks: Array<[string, any]> = [
      ["creditCardExpirationYear", checkoutPayload.creditCard.creditCardExpirationYear],
      ["creditCardCvv", checkoutPayload.creditCard.creditCardCvv]
    ];
    for (const [key, value] of intChecks) {
      if (typeof value !== "number" || isNaN(value)) {
        throw new Error(`${key} is not a valid number: ${value}`);
      }
    }

    // Debug: log the payload in a readable way (do NOT mutate for POST)
    function logPayloadTypes(obj: any, prefix = "") {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          logPayloadTypes(obj[key], `${prefix}${key}.`);
        } else {
          console.log(`${prefix}${key}:`, obj[key], typeof obj[key]);
        }
      }
    }
    console.log("Checkout payload:", JSON.stringify(checkoutPayload, null, 2));
    logPayloadTypes(checkoutPayload);

    // Confirm types before POST
    console.log(
      "typeof creditCardExpirationYear:", typeof checkoutPayload.creditCard.creditCardExpirationYear,
      "value:", checkoutPayload.creditCard.creditCardExpirationYear
    );
    console.log(
      "typeof creditCardCvv:", typeof checkoutPayload.creditCard.creditCardCvv,
      "value:", checkoutPayload.creditCard.creditCardCvv
    );



    // Trigger the frontend to perform a checkout so that checkout puts a record on the queue
    const checkoutResponse = await fetch("http://localhost:8080/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload)
    });
    if (!checkoutResponse.ok) {
      throw new Error(`Checkout API call failed: ${checkoutResponse.status} ${checkoutResponse.statusText}`);
    }

    await verifyProvider();
    console.log("Pact provider verification complete!");
  } catch (err) {
    console.error("Pact provider verification failed:", err);
    process.exitCode = 1;
  } finally {
    try {
      scaleUpAccountingAndWait();
    } catch (err) {
      console.error("Failed to scale up accounting deployment:", err);
      process.exitCode = 1;
    }
    // Explicit exit if error, otherwise let process exit naturally
    if (process.exitCode === 1) {
      process.exit(1);
    }
  }
})();
