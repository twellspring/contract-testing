# contract-testing
Contract testing of the https://github.com/open-telemetry/opentelemetry-demo/

## Requirements
- [colima](https://github.com/abiosoft/colima)
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [helm](https://helm.sh/docs/intro/install/)
- [yamllint](https://pypi.org/project/yamllint/)
- [k9s](https://k9s.io/)


## Setup

### Try 1: recommended start method

```sh
colima start --kubernetes
kubectl create namespace opentelemetry
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm install my-otel-demo open-telemetry/opentelemetry-demo -n opentelemetry
```
This failed with a `cannot retrieve Template.Basepath from values inside tpl function` error.

### Try 2: Local repo start

```sh
colima start --kubernetes
kubectl create namespace otel-demo
cd opentelemetry-demo
kubectl apply -n otel-demo -f kubernetes/opentelemetry-demo.yaml
```
This succeeded with one error `The ConfigMap "grafana-dashboards" is invalid: metadata.annotations: Too long: must have at most 262144 bytes`

Then kubectl commands failed with `Unable to connect to the server: net/http: TLS handshake timeout` and colima status took 40 seconds to respond.  Probably a memory/cpu overload (default for colima is 2CPU, 2GB)

```sh
colima stop
colima start --kubernetes --memory 8 --cpu 6
```

### Try 3: kubectl create instead of start
To fix the error `The ConfigMap "grafana-dashboards" is invalid: metadata.annotations: Too long: must have at most 262144 bytes` and grafana not starting correctly

```sh
kubectl delete configmap grafana-dashboards -n otel-demo
kubectl create -n otel-demo -f kubernetes/opentelemetry-demo.yaml
kubectl --namespace otel-demo port-forward svc/frontend-proxy 8080:8080
```

Time spent: 1.5 hours to get it fully running (already had all the pre-requisites installed)

## Windsurf Setup
Setup windsurf with workflows, copy in template workflows and create PRD / Issues.
Also had to deal with windsurf authentication error (fixed by changing model from gpt-41 to Sonnet 3.7)
Time spent: 40 minutes

## Windsurf Coding

### frontend-shipping
Coding and testing
Time spent: 50 minutes

### frontend-shipping edge cases & research
Windsurf went off the rails when adding edge cases. Resulted in lots of learning how contract testing works.  
Time spent: 2 hours

### checkout-accounting
Coding and testing
Time spent: 5 hours
Lots of learning here about the difference between a Pact http and a message contract. 
- went down a rabbit hole trying to get Pact validate the checkout service's message format.  This meant pulling a message off the queue and validating it.  Problem was trying to generate that message via an api call to the front end had lots of formatting issues that Windsurf could not figure out.
- Not sure how else to have autoamted testing of the message contract without changing the code. 


## Contract Testing Documentation

### Overview

This project implements contract testing between a frontend service and a shipping service using the Pact framework. Contract testing ensures that both services maintain compatible APIs as they evolve independently.

### Contract Testing Principles

1. **Consumer-Driven Contracts**: The consumer (frontend) defines what it expects from the provider (shipping service).
2. **Source of Truth**: The contract file is the single source of truth for the API.
3. **Independent Verification**: Each service verifies its conformance to the contract independently.
4. **No Mocks for Verification**: Provider verification must be done against the actual provider implementation, not a mock.

### Contract Roles Table

| Contract                      | Pact Consumer (writes test) | Pact Provider (verified) | Producer (sends data)         | Consumer (receives data)           |
|-------------------------------|-----------------------------|-------------------------|-------------------------------|------------------------------------|
| frontend-shipping (HTTP)      | frontend                    | shipping                | frontend (sends HTTP request) | shipping (receives request, sends response) |
| checkout-accounting (message) | accounting                  | checkout                | checkout (sends message)      | accounting (receives message)      |

**Definitions:**
- **Pact Consumer:** Service that initiates the interaction and writes the contract test.
- **Pact Provider:** Service that is verified against the contract.
- **Producer:** Service that sends the request (HTTP) or message (queue).
- **Consumer:** Service that receives the response (HTTP) or message (queue).

### Project Structure

- `frontend-shipping.pact.spec.ts` - Consumer tests that define the contract
- `pacts/` - Directory containing generated contract files (e.g., `frontend-shipping.json`)
- `shipping-provider.verify.ts` - Script to verify the actual shipping service against the contract

---

### Naming Conventions for Contract Testing Files

**Consumer Contract Test Files**
- Format: `[consumer]-[provider].pact.spec.ts`
- Example: `frontend-shipping.pact.spec.ts`
- Rationale: Indicates both parties, uses `.pact` to show it's a Pact contract, and `.spec.ts` as a standard test specification suffix recognized by test runners.

**Provider Verification Script Files**
- Format: `[provider].verify.ts`
- Example: `shipping-provider.verify.ts`
- Rationale: Indicates the script is for verifying the provider implementation against one or more contract files. `.verify.ts` makes clear this is an operational script, not a test specification.

**Contract Files (Generated)**
- Format: `[consumer]-[provider].json` (in `pacts/` directory)
- Example: `frontend-shipping.json`
- Rationale: Clearly identifies the consumer-provider relationship for the contract artifact.

These conventions help ensure clarity, maintainability, and consistent understanding across teams.

### API Contract

#### Request Format
```json
{
  "numberOfItems": number
}
```

#### Success Response Format
```json
{
  "cost_usd": {
    "currency_code": "USD",
    "units": number,
    "nanos": number
  }
}
```

#### Error Response Format
```json
{
  "error": string
}
```

### Proper Contract Testing Workflow

#### 1. Consumer Side (Frontend)

```sh
# Run consumer tests to generate the contract file
npm run test:pact
```

This command:
- Runs the consumer tests in `frontend-shipping.pact.spec.ts`
- Generates the contract file in the `pacts/` directory
- Does NOT require the actual shipping service to be running
- Uses Pact's built-in mock provider functionality for testing

#### 2. Provider Side (Shipping Service)

```sh
# Start the ACTUAL shipping service implementation
cd /path/to/shipping-service
npm start

# In another terminal, run the verification against the actual service
cd /path/to/contract-testing
npm run verify:shipping
```

This verification:
- Uses the contract file generated by the consumer
- Verifies that the ACTUAL shipping service implementation fulfills the contract
- Fails if the shipping service doesn't meet the contract requirements

### Updating Contracts

When the API between the frontend and shipping service changes:

1. Update the consumer tests in `frontend-shipping.pact.spec.ts`
2. Run `npm run test:pact` to generate new contract files
3. Share the updated contract with the shipping service team
4. The shipping service team updates their implementation to match the new contract
5. The shipping service team runs `npm run verify:shipping` to verify their implementation

### CI/CD Integration

To integrate contract testing into your CI/CD pipeline:

1. **Consumer CI Pipeline**:
   - Run consumer tests and generate contracts
   - Publish contracts to a Pact Broker
   - Deploy the consumer if tests pass

2. **Provider CI Pipeline**:
   - Pull the latest contracts from the Pact Broker
   - Verify the provider implementation against these contracts
   - Deploy the provider only if verification passes

### Extending Contract Testing

To add new contracts:

1. Create new test files following the pattern in `quotes.pact.test.ts`
2. Define interactions using the Pact DSL
3. Create verification scripts for each provider
4. Update documentation with new API contracts

### Best Practices

- Keep contracts focused on the structure, not the values
- Use type matchers instead of exact values where appropriate
- Version your contracts when making breaking changes
- Run contract tests before integration tests

# Feedback
- Took over an hour just to get this app running.