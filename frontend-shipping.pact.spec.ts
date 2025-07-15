import path from 'path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import fetch from 'node-fetch';

// Increase Jest timeout for Pact setup
jest.setTimeout(30000);

const { like, integer } = MatchersV3;

// Create a new provider for each test to avoid port conflicts
const createProvider = () => {
  return new PactV3({
    consumer: 'frontend',
    provider: 'shipping',
    logLevel: 'info',
    dir: path.resolve(process.cwd(), 'pacts'),
    // Use a random port to avoid conflicts
    port: 0, // Let Pact choose an available port
  });
};

describe('Pact Contract: Frontend → Shipping - Quotes API', () => {
  // Core test cases - these are the most important ones
  
  // Test for standard shipping quote
  test('returns a shipping quote for standard items', async () => {
    const provider = createProvider();
    
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

  // test.each for invalid numberOfItems values
  const invalidValues = [
    { value: 0, desc: 'zero' },
    { value: 2.5, desc: 'float' },
    { value: -1, desc: 'negative' },
    { value: 'abc', desc: 'string' },
    { value: '', desc: 'empty string' },
    { value: '   ', desc: 'whitespace string' },
    { value: null, desc: 'null' },
    { value: {}, desc: 'object' },
    { value: [], desc: 'array' },
  ];

  test.each(invalidValues)(
    'returns an error for $desc numberOfItems',
    async ({ value, desc }) => {
      const provider = createProvider();
      await provider
        .given('shipping service is ready')
        .uponReceiving(`a quote request with ${desc} numberOfItems`)
        .withRequest({
          method: 'POST',
          path: '/getquote',
          headers: { 'Content-Type': 'application/json' },
          body: { numberOfItems: value },
        })
        .willRespondWith({
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: like({ error: 'Invalid number of items' }),
        });
      await provider.executeTest(async (mockService) => {
        const response = await fetch(`${mockService.url}/getquote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numberOfItems: value }),
        });
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toHaveProperty('error');
      });
    }
  );

  // Test for no body
  test('returns an error for POST with no body', async () => {
    const provider = createProvider();
    await provider
      .given('shipping service is ready')
      .uponReceiving('a quote request with no body')
      .withRequest({
        method: 'POST',
        path: '/getquote',
        headers: { 'Content-Type': 'application/json' }
        // No body field
      })
      .willRespondWith({
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: like({ error: 'Missing numberOfItems field' }),
      });
    await provider.executeTest(async (mockService) => {
      const response = await fetch(`${mockService.url}/getquote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
        // No body
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  // Test for incorrect Content-Type header
  test('returns an error for POST with incorrect Content-Type header', async () => {
    const provider = createProvider();
    await provider
      .given('shipping service is ready')
      .uponReceiving('a quote request with incorrect Content-Type header')
      .withRequest({
        method: 'POST',
        path: '/getquote',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ numberOfItems: 3 }),
      })
      .willRespondWith({
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: like({ error: 'Invalid or missing Content-Type header' }),
      });
    await provider.executeTest(async (mockService) => {
      const response = await fetch(`${mockService.url}/getquote`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ numberOfItems: 3 }),
      });
      expect([400, 500]).toContain(response.status);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  // Test for missing numberOfItems field
  test('returns an error when numberOfItems field is missing', async () => {
    const provider = createProvider();
    
    // Define the interaction
    await provider
      .given('shipping service is ready')
      .uponReceiving('a quote request with missing numberOfItems field')
      .withRequest({
        method: 'POST',
        path: '/getquote',
        headers: { 'Content-Type': 'application/json' },
        body: {},  // Empty body
      })
      .willRespondWith({
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          error: 'Missing numberOfItems field',
        }),
      });

    // Run the test
    await provider.executeTest(async (mockService) => {
      const response = await fetch(`${mockService.url}/getquote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});
