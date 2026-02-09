package k8s

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
	"week-4/go-rest-api/internal/models"

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
	clientest    *kubernetes.Clientset
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
		clientest:    clientset,
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
			"apiVersion": fmt.Sprintf("%s/%s",  Group, Version),
			"kind": Kind,
			"metadata": map[string]interface{}{
				"name": req.Name,
				"namespace": c.namespace,
			},
			"spec": map[string]interface{}{
				"instances": req.Instances,
				"imagesName": fmt.Sprintf(
					"ghcr.io/cloudnative-pg/postgresql:%d",
					req.PostgresVersion,
				),
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





// parseClusterInfo converts a raw CNPG Cluster object
// into a clean API-facing DatabaseInfo model.
func (c *Client) parseClusterInfo(cluster *unstructured.Unstructured) *models.DatabaseInfo{
	spec, _, _ := unstructured.NestedMap(cluster.Object, "spec")
	status, _, _ := unstructured.NestedMap(cluster.Object, "status")
	metadata, _, _ := unstructured.NestedMap(cluster.Object, "metadata")

	name, _, _ := unstructured.NestedString(metadata, "name")
	CreatedAtStr, _, _ := unstructured.NestedString(metadata, "creationTimestamp")

	instances, _, _ := unstructured.NestedInt64(spec, "instances")
	storageSize, _, _ := unstructured.NestedString(spec, "storage", "size")
	imageName, _, _ := unstructured.NestedString(spec, "imageName")

	readyInstances, _, _ := unstructured.NestedInt64(status, "instances")
	phase, _, _ := unstructured.NestedString(status, "phase")

	// Extract PostgreSQL version from container image tag
	version := "unknown"
	if imageName != "" {
		if parts := strings.Split(imageName, ":"); len(parts) > 1 {
			version =parts[1]
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
		Name: name,
		Status: dbStatus,
		Instances: int(instances),
		ReadyInstances: int(readyInstances),
		PostgresVersion: version,
		StorageSize: storageSize,
	}

	// Parse creation timestamp if present
	if CreatedAtStr != "" {
		if t,  err := time.Parse(time.RFC3339, CreatedAtStr); err == nil {
			info.CreatedAt = &t
		}
	}
	return info
}