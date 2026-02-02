#!/usr/bin/env bash
set -euo pipefail

terraform output -raw kubeconfig > kubeconfig.yaml
export KUBECONFIG=$PWD/kubeconfig.yaml

kubectl get nodes
kubectl get pods -A