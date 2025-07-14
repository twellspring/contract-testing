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
Time spent: 40 minutes

## Windsurf Coding



# Feedback
- Took over an hour just to get this app running.