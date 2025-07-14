import { Verifier } from '@pact-foundation/pact';
import path from 'path';

// Mock shipping service implementation
const shippingService = {
  getQuote: (numberOfItems: number) => {
    if (numberOfItems < 0) {
      return {
        error: 'Invalid number of items'
      };
    }
    
    // Calculate shipping cost based on number of items
    const units = numberOfItems > 10 ? 15 : 10;
    
    return {
      cost_usd: {
        currency_code: 'USD',
        units,
        nanos: 0
      }
    };
  }
};

// Create an Express server to handle the verification
import express from 'express';
import { Request, Response } from 'express';
import bodyParser from 'body-parser';
const app = express();
// Use a different port to avoid conflicts with the actual service
const PORT = 9000;

app.use(bodyParser.json());

// Implement the getquote endpoint
app.post('/getquote', (req: Request, res: Response) => {
  const { numberOfItems } = req.body;
  
  if (numberOfItems < 0) {
    return res.status(400).json({
      error: 'Invalid number of items'
    });
  }
  
  // Return response in the exact format expected by the contract
  const units = numberOfItems > 10 ? 15 : 10;
  res.json({
    cost_usd: {
      currency_code: 'USD',
      units: units,
      nanos: 0
    }
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Provider service listening on http://localhost:${PORT}`);
  
  // Run the verification
  const opts = {
    provider: 'shipping',
    providerBaseUrl: `http://localhost:${PORT}`,
    pactUrls: [path.resolve(process.cwd(), 'pacts', 'frontend-shipping.json')],
    publishVerificationResult: false,
    providerVersion: '1.0.0',
    stateHandlers: {
      'shipping service is ready': () => {
        console.log('Setting up provider state: shipping service is ready');
        return Promise.resolve();
      }
    }
  };

  new Verifier(opts)
    .verifyProvider()
    .then(() => {
      console.log('Pact verification completed successfully');
      server.close();
      process.exit(0);
    })
    .catch(error => {
      console.error('Pact verification failed', error);
      server.close();
      process.exit(1);
    });
});
