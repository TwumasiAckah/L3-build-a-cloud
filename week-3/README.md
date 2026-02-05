# CloudNativePG (CNPG) Installation with ArgoCD (GitOps)

This guide documents how to install the **CloudNativePG (CNPG) PostgreSQL Operator** on Kubernetes using **ArgoCD and GitOps**, including validation, troubleshooting, database creation, and GitHub Actions integration.

---

### Prerequisites

- Kubernetes cluster
- `kubectl`, `helm`, `terraform`, `yq`
- Access to OperatorHub.io
- Git repository for GitOps
- ArgoCD

### Kubernetes Access

Download the kubeconfig from Terraform or from the cloud platform and configure `kubectl`:

```bash
terraform output -raw kubeconfig > kubeconfig.yaml
export KUBECONFIG=$PWD/kubeconfig.yaml
```

Verify cluster access:

```bash
kubectl config current-context
kubectl get ns
```

---

## Insallation via Helm in Terraform, Pod and CRD Validation

app-1 has the files for the operator intallation.
The namespace used in the operator.tf is `cnpg-system`. To confirm installation, check pods in the namespace.

```bash
kubectl get pods -n cnpg-system
```

Check CRDs and API resources:

```bash
kubectl get crds | grep postgresql
kubectl api-resources | grep postgresql
```

---

## Troubleshooting Installation

If no pods are running:

```bash
kubectl get ns
kubectl config current-context
```

Confirm:

- Namespace exists
- `kubectl` is pointing to the correct cluster

---

## Installing CNPG Using ArgoCD (GitOps)

### Create ArgoCD Namespace

```bash
kubectl create namespace argocd
```

### Extract CNPG CRDs

```bash
curl -s https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.28/releases/cnpg-1.28.0.yaml \
| yq 'select(.kind == "CustomResourceDefinition")' > cnpg-crds.yaml
```

Install CRDs:

```bash
kubectl create -f cnpg-crds.yaml
```

### Extract Controller Resources

Linux/macOS:

```bash
curl -s https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.28/releases/cnpg-1.28.0.yaml \
| yq 'select(.kind != "CustomResourceDefinition")' > cnpg-controller.yaml
```

Windows (use the escape "\" character):

```bash
curl -s https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.28/releases/cnpg-1.28.0.yaml \
| yq "select(.kind != \"CustomResourceDefinition\")" > cnpg-controller.yaml
```

---

### Install ArgoCD

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Apply on server-side if there is an error resulting from long annotation:

```bash
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml --server-side
```

Verify:

```bash
kubectl get pods -n argocd
```

### Verify CNPG via GitOps

```bash
kubectl get pods -n cnpg-system
kubectl get crds | grep postgresql
```

Test reconciliation:

```bash
kubectl delete deployment cnpg-controller-manager -n cnpg-system
kubectl get deployment -n cnpg-system
```

Delete deployment to confirm if ArgoCD will recreate it.

### Create a PostgreSQL Instance

Add a CNPG Cluster CR:

```text
cluster/instances/an_instance.yaml
```

ArgoCD applies it → CNPG reconciles it → PostgreSQL is created.

Verify:

```bash
kubectl get cluster
```

---

## Accessing ArgoCD

Documentation:
[https://argo-cd.readthedocs.io/en/stable/getting_started/](https://argo-cd.readthedocs.io/en/stable/getting_started/)

### Option 1: Port Forwarding (Quickest)

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open:

```
https://localhost:8080
```

Ignore the self-signed certificate warning.

---

### Option 2: LoadBalancer

```bash
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
kubectl get svc argocd-server -n argocd
```

Use the `EXTERNAL-IP`.

---

## ArgoCD Login

- **Username:** `admin`
- **Password:**

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
-o jsonpath="{.data.password}" | base64 -d; echo
```

---

## Check ArgoCD Status

```bash
kubectl get app cnpg-operator -n argocd -o wide
```

Logs:

```bash
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller --tail=20
kubectl logs -n cnpg-system deployment/cnpg-controller-manager
```

---

## Post-Installation Checks

### Database Pods

```bash
kubectl get pods -l cnpg.io/cluster=db-test
```

### Persistent Volumes

```bash
kubectl get pvc
```

Ensure volumes are provisioned by the cloud provider.

---

## Retrieve Database Password

```bash
kubectl get secret db-test-app \
-o jsonpath='{.data.password}' | base64 --decode
```

---

## Test Database Connection

Get primary pod:

```bash
kubectl get pods -l cnpg.io/cluster=db-test,role=primary -o name
```

Exec into it:

```bash
kubectl exec -it pod/db-test-1 -- psql -U app -d app -c "SELECT version();"
```

---

## GitHub Actions → ArgoCD Sync

### 1. Generate ArgoCD Token

- ArgoCD UI → **Settings → Users**
- Select user (e.g. `admin`)
- Generate a token
- Copy it immediately

---

### 2. Add GitHub Secrets

Repository → **Settings → Secrets and variables → Actions**

Add:

- `ARGOCD_TOKEN`
- `ARGOCD_SERVER`

---

### 3. Create Workflow

Create:

```text
.github/workflows/sync.yaml
```

This workflow triggers ArgoCD sync via API after every push.

---

### Test the Integration

1. Push `.github/workflows/sync.yaml`
2. Go to **GitHub → Actions**
3. Look for a green checkmark
4. ArgoCD should immediately show **Syncing**
