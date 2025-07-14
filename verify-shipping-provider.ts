import { Verifier, LogLevel } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

// Custom state handlers for the verification process
const stateHandlers = {
  // This handler will be called before tests that require the "shipping service is ready" state
  'shipping service is ready': async () => {
    console.log('Verifying shipping service is ready at http://localhost:9001');
    
    try {
      // Simple health check to ensure the service is running
      // We're not actually changing any state, just verifying the service is up
      const response = await axios.get('http://localhost:9001/getquote', {
        validateStatus: () => true // Accept any status code as valid for the health check
      });
      
      console.log(`Shipping service responded with status: ${response.status}`);
      return Promise.resolve();
    } catch (error: any) {
      console.warn('Warning: Could not verify shipping service readiness:', error.message);
      // We'll continue anyway, as the actual test requests will determine if things work
      return Promise.resolve();
    }
  }
};

// Configuration for the Pact verifier
const verifierOptions = {
  // Provider details
  provider: 'shipping',
  providerBaseUrl: 'http://localhost:9001', // The URL of the actual shipping service
  
  // Path to the Pact contract file
  pactUrls: [path.resolve(process.cwd(), 'pacts', 'frontend-shipping.json')],
  
  // Custom state handlers that don't rely on Pact-specific endpoints
  stateHandlers,
  
  // Skip state change setup/teardown requests to the provider
  // This is important - it prevents Pact from trying to call /_pactSetup and /_pactTeardown
  skipPactStatesSetup: true,
  
  // Publishing options
  publishVerificationResult: false,
  providerVersion: '1.0.0',
  
  // Verbose output for debugging
  logLevel: 'info' as LogLevel
};

// Run the verification
console.log('Starting Pact verification against shipping service on port 9001');
new Verifier(verifierOptions)
  .verifyProvider()
  .then(() => {
    console.log('Pact verification completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Pact verification failed', error);
    process.exit(1);
  });
