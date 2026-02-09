package k8s

import (
	"fmt"

	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
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
	clienttest    *kubernetes.Clientest
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
		clienttest:    clientset,
		namespace:     namespace,
		gvr:           gvr,
	}, nil
}
