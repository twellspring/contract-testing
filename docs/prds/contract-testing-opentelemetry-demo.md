# Product Requirements Document (PRD): Contract Testing for opentelemetry-demo

## 1. Project Goals
- Ensure that changes to service APIs do not break contracts between services.
- Catch breaking changes early to improve deployment safety and reduce incidents.

## 2. Users & Stakeholders
- **Primary users:** Developers and operations teams.
- **Ownership:** Contracts are primarily maintained by the producer service, but both producer and consumer participate via a centralized contracts repository.

## 3. Problems & Pain Points
- Previous issues and outages have arisen due to contract drift between services.
- The selected service pairs (frontend → shipping, checkout → accounting) are critical and use different connection methodologies (HTTP and TCP/Kafka), making them ideal starting points.

## 4. Scope & Priorities
- **Frontend → Shipping:** Start by covering the "quotes" API/interaction.
- **Checkout → Accounting:** Focus on "order totals," "taxes," and "payment statuses."
- Initial scope is limited to these endpoints/interactions to deliver quick value and establish patterns.

## 5. Tooling & Environment
- **Tool:** Pact (manual execution initially).
- **Repository:** Centralized contracts repository for collaboration.
- **Integration:** No CI/CD integration at this stage; tests will be run manually.
