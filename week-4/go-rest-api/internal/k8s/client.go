package k8s

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
	"week-4/go-rest-api/internal/models"
	"week-4/go-rest-api/internal/service"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

const (
	Group   = "postgresql.cnpg.io"
	Version = "v1"
	Kind    = "Cluster"
)

// Client wraps all Kubernetes clients needed by the API.
// - dynamicClient: used for CRDs (CNPG Cluster)
// - clientset: used for core resources (Secrets)
// - namespace: scope of all operations
// - gvr: identifies the CNPG Cluster resource
type Client struct {
	dynamicClient dynamic.Interface
	clientest     *kubernetes.Clientset
	namespace     string
	gvr           schema.GroupVersionResource
}

// NewClient initializes Kubernetes clients and prepares CNPG access.
// This is called once at startup and injected into API handlers.
func NewClient(namespace string) (*Client, error) {
	config, err := getConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get kubernetes config: %w", err)
	}

	// Dynamic client is required for CRDs like CNPG Cluster
	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	// Typed clientset is used for built-in resources (Secrets, Pods, etc.)
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create clientset %w", err)
	}

	// GroupVersionResource tells the dynamic client what resource we operate on
	gvr := schema.GroupVersionResource{
		Group:    Group,
		Version:  Version,
		Resource: "clusters",
	}

	return &Client{
		dynamicClient: dynamicClient,
		clientest:     clientset,
		namespace:     namespace,
		gvr:           gvr,
	}, nil
}

// getConfig resolves Kubernetes configuration.
// Priority:
// 1. In-cluster config (when running inside Kubernetes)
// 2. Local kubeconfig (for development)
func getConfig() (*rest.Config, error) {
	//  Use when running as a Pod inside the cluster
	config, err := rest.InClusterConfig()
	if err == nil {
		log.Println("Using in-cluster Kubernetes config")
		return config, nil
	}

	// Fallback for local development
	kubeconfigPath := os.Getenv("KUBECONFIG")
	if kubeconfigPath == "" {
		kubeconfigPath = filepath.Join(os.Getenv("HOME"), ".kube", "config")
	}

	log.Printf("Using kubeconfig from: %s", kubeconfigPath)
	config, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
	}
	return config, nil
}

// CreateCluster provisions a new CNPG PostgreSQL cluster.
// This translates an API request into a CNPG Cluster CR.
func (c *Client) CreateCluster(ctx context.Context, req models.DatabaseCreateRequest) (*models.DatabaseInfo, error) {
	cluster := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": fmt.Sprintf("%s/%s", Group, Version),
			"kind":       Kind,
			"metadata": map[string]interface{}{
				"name":      req.Name,
				"namespace": c.namespace,
			},
			"spec": map[string]interface{}{
				"instances": req.Instances,
				// "imageName": fmt.Sprintf(
				// 	"ghcr.io/cloudnative-pg/postgresql:%d",
				// 	req.PostgresVersion,
				// ),
				"storage": map[string]interface{}{
					"size": req.StorageSize,
				},
				// Bootstrap config for initial database creation
				"bootstrap": map[string]interface{}{
					"initdb": map[string]interface{}{
						"database": "app",
					},
				},
			},
		},
	}

	created, err := c.dynamicClient.
		Resource(c.gvr).
		Namespace(c.namespace).
		Create(ctx, cluster, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create cluster: %w", err)
	}

	return c.parseClusterInfo(created), nil

}

// GetCluster retrieves a single CNPG cluster by name.
func (c *Client) GetCluster(ctx context.Context, name string) (*models.DatabaseInfo, error) {
	cluster, err := c.dynamicClient.
		Resource(c.gvr).
		Namespace(c.namespace).
		Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	return c.parseClusterInfo(cluster), nil
}

// ListClusters returns all CNPG clusters in the namespace.
func (c *Client) ListClusters(ctx context.Context) ([]models.DatabaseInfo, error) {
	list, err := c.dynamicClient.
		Resource(c.gvr).
		Namespace(c.namespace).
		List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("Failed to list clusters: %w", err)
	}
	clusters := make([]models.DatabaseInfo, 0, len(list.Items))
	for _, item := range list.Items {
		clusters = append(clusters, *c.parseClusterInfo(&item))
	}
	return clusters, nil
}

// DeleteCluster deletes a CNPG cluster.
// CNPG handles actual cleanup (PVCs, Pods) based on its configuration.
func (c *Client) DeleteCluster(ctx context.Context, name string) error {
	return c.dynamicClient.
		Resource(c.gvr).
		Namespace(c.namespace).
		Delete(ctx, name, metav1.DeleteOptions{})
}

// GetCredentials fetches database credentials from the Secret
// created by the CNPG operator.
func (c *Client) GetCredentials(ctx context.Context, name string) (*models.DatabaseCredentials, error) {
	// CNPG naming convention: <cluster-name>-app
	secretName := fmt.Sprintf("%s-app", name)

	secret, err := c.clientest.
		CoreV1().
		Secrets(c.namespace).
		Get(ctx, secretName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("Failed to get secret: %w", err)
	}

	// client-go already decoded the secret
	username := string(secret.Data["username"])
	password := string(secret.Data["password"])

	// CNPG service convention
	host := fmt.Sprintf("%s-rw.%s.svc", name, c.namespace)

	if hostData, ok := secret.Data["host"]; ok {
		host = string(hostData)

	}
	database := "app"
	port := 5432

	connStr := fmt.Sprintf(
		"postgresql://%s:%s@%s:%d/%s",
		username, password, host, port, database,
	)
	return &models.DatabaseCredentials{
		Username:         username,
		Password:         password,
		Host:             host,
		Port:             port,
		Database:         database,
		ConnectionString: connStr,
	}, nil
}

// UpdateCluster updates an existing CNPG cluster with new instances or storage size.
func (c *Client) UpdateCluster(ctx context.Context, name string, updates map[string]interface{}) (*models.DatabaseInfo, error) {
	// Fetch the current cluster
	cluster, err := c.dynamicClient.
		Resource(c.gvr).
		Namespace(c.namespace).
		Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get cluster: %w", err)
	}

	// Extract the spec map
	spec, found, err := unstructured.NestedMap(cluster.Object, "spec")
	if err != nil || !found {
		return nil, fmt.Errorf("failed to get cluster spec: %w", err)
	}

	// Update instances if provided
	if instances, ok := updates["instances"].(int); ok {
		spec["instances"] = int64(instances)
	}

	// Update storage if provided
	if storage, ok := updates["storage"].(map[string]interface{}); ok {
		if size, ok := storage["size"].(string); ok {
			// Get current storage size
			currentSize, _, _ := unstructured.NestedString(spec, "storage", "size")

			// Prevent decreasing storage
			if currentSize != "" && service.ParseStorageSize(size) < service.ParseStorageSize(currentSize) {
				return nil, fmt.Errorf("cannot decrease storage from %s to %s", currentSize, size)
			}

			// Apply new storage size
			spec["storage"] = map[string]interface{}{"size": size}
		}
	}

	// Save updated spec back into cluster object
	if err := unstructured.SetNestedMap(cluster.Object, spec, "spec"); err != nil {
		return nil, fmt.Errorf("failed to set cluster spec: %w", err)
	}

	// Apply update to Kubernetes
	updatedCluster, err := c.dynamicClient.
		Resource(c.gvr).
		Namespace(c.namespace).
		Update(ctx, cluster, metav1.UpdateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to update cluster: %w", err)
	}

	// Return consistent DatabaseInfo like CreateCluster/GetCluster
	return c.parseClusterInfo(updatedCluster), nil
}

// ###### Helpers ########

// parseClusterInfo converts a raw CNPG Cluster object
// into a clean API-facing DatabaseInfo model.
func (c *Client) parseClusterInfo(cluster *unstructured.Unstructured) *models.DatabaseInfo {
	spec, _, _ := unstructured.NestedMap(cluster.Object, "spec")
	status, _, _ := unstructured.NestedMap(cluster.Object, "status")
	metadata, _, _ := unstructured.NestedMap(cluster.Object, "metadata")

	name, _, _ := unstructured.NestedString(metadata, "name")
	CreatedAtStr, _, _ := unstructured.NestedString(metadata, "creationTimestamp")

	instances, _, _ := unstructured.NestedInt64(status, "instances")
	storageSize, _, _ := unstructured.NestedString(spec, "storage", "size")
	imageName, _, _ := unstructured.NestedString(spec, "imageName")

	readyInstances, _, _ := unstructured.NestedInt64(status, "readyInstances")
	phase, _, _ := unstructured.NestedString(status, "phase")

	// Extract PostgreSQL version from container image tag
	version := "unknown"
	if imageName != "" {
		if parts := strings.Split(imageName, ":"); len(parts) > 1 {
			version = parts[1]
		}
	}

	// Map CNPG to platform-level status
	dbStatus := models.StatusUnknown
	phaseLower := strings.ToLower(phase)

	switch {
	case strings.Contains(phaseLower, "healthy"):
		dbStatus = models.StatusReady
	case strings.Contains(phaseLower, "creating"),
		strings.Contains(phaseLower, "upgrading"):
		dbStatus = models.StatusCreating
	case strings.Contains(phaseLower, "fail"):
		dbStatus = models.StatusFailed
	}

	info := &models.DatabaseInfo{
		Name:            name,
		Status:          dbStatus,
		Instances:       int(instances),
		ReadyInstances:  int(readyInstances),
		PostgresVersion: version,
		StorageSize:     storageSize,
	}

	// Parse creation timestamp if present
	if CreatedAtStr != "" {
		if t, err := time.Parse(time.RFC3339, CreatedAtStr); err == nil {
			info.CreatedAt = &t
		}
	}
	return info
}

// decodeSecret decodes Kubernetes Secret data.
// Kubernetes already base64-encodes values at rest.
func decodeSecret(data []byte) (string, error) {
	decoded, err := base64.StdEncoding.DecodeString(string(data))
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}
