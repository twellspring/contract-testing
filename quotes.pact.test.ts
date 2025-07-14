import path from 'path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import fetch from 'node-fetch';

// Increase Jest timeout for Pact setup
jest.setTimeout(30000);

const { like, integer } = MatchersV3;

describe('Pact Contract: Frontend → Shipping - Quotes API', () => {
  // Use PactV3 for better compatibility
  const provider = new PactV3({
    consumer: 'frontend',
    provider: 'shipping',
    logLevel: 'info',
    dir: path.resolve(process.cwd(), 'pacts'),
    // Use port 9001 to match the actual shipping service
    port: 9001,
  });
  
  // PactV3 manages its own lifecycle, no need for setup/teardown

  // Test for standard shipping quote
  test('returns a shipping quote for standard items', async () => {
    // Define the interaction
    await provider
      .given('shipping service is ready')
      .uponReceiving('a valid quote request with standard items')
      .withRequest({
        method: 'POST',
        path: '/getquote',
        headers: { 'Content-Type': 'application/json' },
        body: { numberOfItems: 3 },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          cost_usd: {
            currency_code: 'USD',
            units: integer(10),
            nanos: integer(0),
          },
        }),
      });

    // Run the test
    await provider.executeTest(async (mockService) => {
      const response = await fetch(`${mockService.url}/getquote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfItems: 3 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('cost_usd');
      expect(data.cost_usd).toHaveProperty('currency_code');
      expect(data.cost_usd.currency_code).toBe('USD');
    });
  });

  // Test for bulk shipping quote
  test('returns a shipping quote for bulk items', async () => {
    // Define the interaction
    await provider
      .given('shipping service is ready')
      .uponReceiving('a valid quote request with bulk items')
      .withRequest({
        method: 'POST',
        path: '/getquote',
        headers: { 'Content-Type': 'application/json' },
        body: { numberOfItems: 20 },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          cost_usd: {
            currency_code: 'USD',
            units: integer(15),
            nanos: integer(0),
          },
        }),
      });

    // Run the test
    await provider.executeTest(async (mockService) => {
      const response = await fetch(`${mockService.url}/getquote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfItems: 20 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('cost_usd');
      expect(data.cost_usd.currency_code).toBe('USD');
    });
  });

  // Test for invalid request
  test('returns an error for invalid requests', async () => {
    // Define the interaction
    await provider
      .given('shipping service is ready')
      .uponReceiving('an invalid quote request with negative items')
      .withRequest({
        method: 'POST',
        path: '/getquote',
        headers: { 'Content-Type': 'application/json' },
        body: { numberOfItems: -1 },
      })
      .willRespondWith({
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          error: 'Invalid number of items',
        }),
      });

    // Run the test
    await provider.executeTest(async (mockService) => {
      const response = await fetch(`${mockService.url}/getquote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfItems: -1 }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});
