package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type LogFunc func(ctx context.Context, database, level, event, message string, details map[string]interface{})

type DatabaseMonitor struct {
	db        *sql.DB
	k8sClient *kubernetes.Clientset
	namespace string
	log       LogFunc
}

func NewDatabaseMonitor(
	db *sql.DB,
	k8sClient *kubernetes.Clientset,
	namespace string,
	logFn LogFunc,
) *DatabaseMonitor {
	return &DatabaseMonitor{
		db:        db,
		k8sClient: k8sClient,
		namespace: namespace,
		log:       logFn,
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

	rows, err := dm.db.QueryContext(ctx,
		"SELECT name FROM databases WHERE status != 'deleting'",
	)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			continue
		}

		dm.checkPods(ctx, name)
	}
}

func (dm *DatabaseMonitor) checkPods(ctx context.Context, dbName string) {
	pods, err := dm.k8sClient.CoreV1().
		Pods(dm.namespace).
		List(ctx, metav1.ListOptions{
			LabelSelector: fmt.Sprintf("app=postgres,database=%s", dbName),
		})

	if err != nil {
		return
	}

	for _, pod := range pods.Items {
		dm.checkPodFailure(ctx, dbName, pod)
		dm.checkRestarts(ctx, dbName, pod)
	}
}

func (dm *DatabaseMonitor) checkPodFailure(ctx context.Context, dbName string, pod v1.Pod) {
	if pod.Status.Phase != v1.PodFailed {
		return
	}

	dm.log(ctx, dbName, "ERROR", "POD_FAILURE",
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

		dm.log(ctx, dbName, "WARN", "CONTAINER_RESTART",
			fmt.Sprintf("Container restarted %d times", status.RestartCount),
			map[string]interface{}{
				"container": status.Name,
				"restarts":  status.RestartCount,
			},
		)
	}
}
