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
Coding and testing
Time spent: 50 minutes




## Contract Testing Documentation

### Overview

This project implements contract testing between a frontend service and a shipping service using the Pact framework. Contract testing ensures that both services maintain compatible APIs as they evolve independently.

### Project Structure

- `quotes.pact.test.ts` - Pact consumer tests defining the contract
- `pacts/` - Directory containing generated contract files
- `verify-shipping-provider.ts` - Provider verification script
- `mock-shipping-service.ts` - Mock implementation of the shipping service

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

### Running Contract Tests

#### Generate Contracts (Consumer Side)

```sh
npm run test:pact
```

This command runs the consumer tests and generates the contract file in the `pacts/` directory.

#### Start Mock Shipping Service

```sh
npm run start:mock-shipping
```

This starts a mock shipping service on port 9001 that implements the contract.

#### Verify Provider Implementation

```sh
npm run verify:shipping
```

This verifies that the shipping service correctly implements the contract defined by the frontend.

### Updating Contracts

When the API between the frontend and shipping service changes:

1. Update the consumer tests in `quotes.pact.test.ts`
2. Run `npm run test:pact` to generate new contract files
3. Update the provider implementation to match the new contract
4. Run `npm run verify:shipping` to verify the changes

### CI/CD Integration

To integrate contract testing into your CI/CD pipeline:

1. Run consumer tests and generate contracts as part of the frontend build
2. Publish contracts to a Pact Broker (recommended for larger projects)
3. Verify provider implementation against contracts as part of the shipping service build
4. Only deploy if verification passes

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