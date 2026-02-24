package services

import (
	"context"
	"fmt"
	"time"

	"week-4/go-rest-api/internal/logging"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type DatabaseMonitor struct {
	k8sClient *kubernetes.Clientset
	namespace string
}

func NewDatabaseMonitor(
	k8sClient *kubernetes.Clientset,
	namespace string,
) *DatabaseMonitor {
	return &DatabaseMonitor{
		k8sClient: k8sClient,
		namespace: namespace,
	}
}

func (dm *DatabaseMonitor) Start(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			dm.check(ctx)
		}
	}
}

func (dm *DatabaseMonitor) check(ctx context.Context) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// List all postgres pods directly from Kubernetes
	pods, err := dm.k8sClient.CoreV1().
		Pods(dm.namespace).
		List(ctx, metav1.ListOptions{
			LabelSelector: "app=postgres", // All postgres pods
		})

	if err != nil {
		return
	}

	for _, pod := range pods.Items {
		// Get database name from pod labels
		dbName := pod.Labels["database"]
		if dbName == "" {
			continue
		}

		dm.checkPodFailure(ctx, dbName, pod)
		dm.checkRestarts(ctx, dbName, pod)
	}
}

func (dm *DatabaseMonitor) checkPodFailure(ctx context.Context, dbName string, pod v1.Pod) {
	if pod.Status.Phase != v1.PodFailed {
		return
	}

	logging.ServiceLog(
		dbName,
		"ERROR",
		"POD_FAILURE",
		fmt.Sprintf("Pod %s failed", pod.Name),
		map[string]interface{}{
			"pod_name": pod.Name,
			"reason":   pod.Status.Reason,
			"message":  pod.Status.Message,
		},
	)
}

func (dm *DatabaseMonitor) checkRestarts(ctx context.Context, dbName string, pod v1.Pod) {
	for _, status := range pod.Status.ContainerStatuses {
		if status.RestartCount == 0 {
			continue
		}

		logging.ServiceLog(
			dbName,
			"WARN",
			"CONTAINER_RESTART",
			fmt.Sprintf("Container restarted %d times", status.RestartCount),
			map[string]interface{}{
				"container": status.Name,
				"restarts":  status.RestartCount,
			},
		)
	}
}