# Monitoring Stack

## Install Prometheus + Grafana + Alertmanager
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  -f monitoring/kube-prometheus-stack-values.yaml
```

## Install Loki + Promtail
```bash
helm upgrade --install loki grafana/loki-stack \
  --namespace monitoring \
  -f monitoring/loki-values.yaml
```

## Install Jaeger
```bash
helm upgrade --install jaeger jaegertracing/jaeger \
  --namespace monitoring \
  -f monitoring/jaeger-values.yaml
```

## Useful access commands
```bash
kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80
kubectl port-forward svc/jaeger-query -n monitoring 16686:16686
```
