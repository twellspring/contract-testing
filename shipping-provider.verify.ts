import { Verifier, LogLevel } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

/**
 * Shipping Provider Verification Script
 * 
 * This script verifies that the actual shipping service implementation
 * correctly fulfills the contract defined by the frontend consumer.
 * 
 * Usage:
 * 1. Ensure the shipping service is running at the specified URL
 * 2. Run this script: npx ts-node verify-shipping-provider.ts
 * 
 * The script will verify that the shipping service can handle all the
 * interactions defined in the Pact contract file.
 */

// Function to check if the shipping service is running
async function checkServiceHealth(url: string): Promise<boolean> {
  try {
    console.log(`Checking if shipping service is running at ${url}...`);
    const response = await axios.get(`${url}/health`, {
      timeout: 2000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      console.log('✅ Shipping service is running');
      return true;
    } else {
      console.log(`❌ Shipping service returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Could not connect to shipping service');
    return false;
  }
}

// Configuration for the Pact verifier
const verifierOptions = {
  // Provider details
  provider: 'shipping',
  
  // The URL where the actual shipping service is running
  // This should be updated to point to the actual shipping service
  providerBaseUrl: process.env.PROVIDER_URL || 'http://localhost:9001',
  
  // Dynamically include all Pact contract files ending with 'shipping.json' in the pacts directory
  pactUrls: (() => {
    const pactsDir = path.resolve(process.cwd(), 'pacts');
    const files = require('fs').readdirSync(pactsDir);
    return files
      .filter((file: string) => file.endsWith('shipping.json'))
      .map((file: string) => path.join(pactsDir, file));
  })(),
  
  // Provider states
  // In a real implementation, these would set up the necessary test data
  // on the provider side before verification
  stateHandlers: {
    'shipping service is ready': async () => {
      // In a real implementation, this might reset the database
      // or set up specific test data required by this state
      console.log('Setting up provider state: shipping service is ready');
      return Promise.resolve();
    }
  },
  
  // Verification options
  publishVerificationResult: false,
  providerVersion: '1.0.0',
  requestTimeout: 10000, // 10 seconds
  
  // Log level for debugging
  logLevel: 'info' as LogLevel
};

/**
 * Main verification function
 */
async function verifyProvider() {
  const serviceUrl = process.env.PROVIDER_URL || 'http://localhost:9001';
  
  try {
    // First check if the service is running
    const isRunning = await checkServiceHealth(serviceUrl);
    if (!isRunning) {
      console.error(`
Error: Shipping service is not running at ${serviceUrl}`);
      console.error('Please start the actual shipping service before running verification.');
      process.exit(1);
    }
    
    // Run the verification
    console.log(`\nStarting Pact verification against shipping service at ${serviceUrl}`);
    console.log('Using contract file:', path.resolve(process.cwd(), 'pacts', 'frontend-shipping.json'));
    
    await new Verifier(verifierOptions).verifyProvider();
    
    console.log('\n✅ Pact verification completed successfully');
    console.log('The shipping service correctly implements all requirements defined in the contract.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Pact verification failed:', error);
    console.error('\nThe shipping service does not correctly implement the contract.');
    console.error('Please check the error details above and update the service implementation.');
    process.exit(1);
  }
}

// Run the verification
verifyProvider().catch(error => {
  console.error('Unexpected error during verification:', error);
  process.exit(1);
});
