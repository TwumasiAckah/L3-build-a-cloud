package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"week-4/go-rest-api/internal/logging"
	"week-4/go-rest-api/internal/models"

	"github.com/gin-gonic/gin"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

//
// Mock
//

type MockK8sClient struct {
	CreateClusterFunc  func(context.Context, models.DatabaseCreateRequest) (*models.DatabaseInfo, error)
	GetClusterFunc     func(context.Context, string) (*models.DatabaseInfo, error)
	ListClustersFunc   func(context.Context) ([]models.DatabaseInfo, error)
	DeleteClusterFunc  func(context.Context, string) error
	GetCredentialsFunc func(context.Context, string) (*models.DatabaseCredentials, error)
	UpdateClusterFunc  func(context.Context, string, map[string]interface{}) (*models.DatabaseInfo, error)
}

func (m *MockK8sClient) CreateCluster(ctx context.Context, r models.DatabaseCreateRequest) (*models.DatabaseInfo, error) {
	return m.CreateClusterFunc(ctx, r)
}

func (m *MockK8sClient) GetCluster(ctx context.Context, name string) (*models.DatabaseInfo, error) {
	if m.GetClusterFunc != nil {
		return m.GetClusterFunc(ctx, name)
	}
	return nil, k8serrors.NewNotFound(schema.GroupResource{}, name)
}

func (m *MockK8sClient) ListClusters(ctx context.Context) ([]models.DatabaseInfo, error) {
	return m.ListClustersFunc(ctx)
}

func (m *MockK8sClient) DeleteCluster(ctx context.Context, name string) error {
	return m.DeleteClusterFunc(ctx, name)
}

func (m *MockK8sClient) GetCredentials(ctx context.Context, name string) (*models.DatabaseCredentials, error) {
	return m.GetCredentialsFunc(ctx, name)
}

func (m *MockK8sClient) UpdateCluster(ctx context.Context, name string, updates map[string]interface{}) (*models.DatabaseInfo, error) {
	if m.UpdateClusterFunc != nil {
		return m.UpdateClusterFunc(ctx, name, updates)
	}
	return nil, nil
}

//
// Router + Helpers
//

func setupTestRouter(mock *MockK8sClient) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	h := &DatabaseHandler{k8sClient: mock}

	router.POST("/databases", h.CreateDatabase)
	router.GET("/databases", h.ListDatabases)
	router.GET("/databases/:name", h.GetDatabase)
	router.DELETE("/databases/:name", h.DeleteDatabase)
	router.GET("/databases/:name/credentials", h.GetCredentials)
	router.PATCH("/databases/:name", h.UpdateDatabase)

	return router
}

func performRequest(r http.Handler, method, path string, body any) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			panic(err)
		}
	}

	req, _ := http.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)
	return resp
}

//
// Tests
//

func TestCreateDatabase(t *testing.T) {
	tests := []struct {
		name     string
		mock     *MockK8sClient
		expected int
	}{
		{
			name: "success",
			mock: &MockK8sClient{
				GetClusterFunc: func(ctx context.Context, name string) (*models.DatabaseInfo, error) {
					return nil, k8serrors.NewNotFound(schema.GroupResource{}, name)
				},
				CreateClusterFunc: func(ctx context.Context, req models.DatabaseCreateRequest) (*models.DatabaseInfo, error) {
					return &models.DatabaseInfo{Name: req.Name}, nil
				},
			},
			expected: http.StatusCreated,
		},
		{
			name: "already exists",
			mock: &MockK8sClient{
				CreateClusterFunc: func(ctx context.Context, req models.DatabaseCreateRequest) (*models.DatabaseInfo, error) {
					return nil, k8serrors.NewAlreadyExists(
						schema.GroupResource{Group: "postgresql.cnpg.io", Resource: "clusters"},
						req.Name,
					)
				},
			},
			expected: http.StatusConflict,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := setupTestRouter(tt.mock)

			logging.InitLogger()

			resp := performRequest(router, "POST", "/databases", models.DatabaseCreateRequest{
				Name:            "db",
				Instances:       1,
				StorageSize:     "1Gi",
				PostgresVersion: 16,
			})

			if resp.Code != tt.expected {
				t.Fatalf("expected %d, got %d", tt.expected, resp.Code)
			}
		})
	}
}

func TestListDatabases(t *testing.T) {
	mock := &MockK8sClient{
		ListClustersFunc: func(ctx context.Context) ([]models.DatabaseInfo, error) {
			return []models.DatabaseInfo{
				{Name: "db1", Status: models.StatusReady},
				{Name: "db2", Status: models.StatusReady},
			}, nil
		},
	}

	router := setupTestRouter(mock)
	resp := performRequest(router, "GET", "/databases", nil)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.Code)
	}

	var result models.DatabaseListResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if result.Total != 2 {
		t.Fatalf("expected 2 databases, got %d", result.Total)
	}
}

func TestGetDatabase_NotFound(t *testing.T) {
	mock := &MockK8sClient{
		GetClusterFunc: func(ctx context.Context, name string) (*models.DatabaseInfo, error) {
			return nil, k8serrors.NewNotFound(schema.GroupResource{}, name)
		},
	}

	router := setupTestRouter(mock)
	resp := performRequest(router, "GET", "/databases/missing", nil)

	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.Code)
	}
}

func TestDeleteDatabase_Success(t *testing.T) {
	mock := &MockK8sClient{
		DeleteClusterFunc: func(ctx context.Context, name string) error {
			return nil
		},
	}

	router := setupTestRouter(mock)
	resp := performRequest(router, "DELETE", "/databases/test-db", nil)

	if resp.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", resp.Code)
	}
}

func TestGetCredentials_Success(t *testing.T) {
	mock := &MockK8sClient{
		GetClusterFunc: func(ctx context.Context, name string) (*models.DatabaseInfo, error) {
			return &models.DatabaseInfo{Name: name}, nil
		},
		GetCredentialsFunc: func(ctx context.Context, name string) (*models.DatabaseCredentials, error) {
			return &models.DatabaseCredentials{
				Username: "app",
				Password: "secret",
				Host:     "db-rw.default.svc",
				Port:     5432,
				Database: "app",
			}, nil
		},
	}

	router := setupTestRouter(mock)
	resp := performRequest(router, "GET", "/databases/test-db/credentials", nil)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.Code)
	}

	var creds models.DatabaseCredentials
	if err := json.Unmarshal(resp.Body.Bytes(), &creds); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if creds.Username != "app" {
		t.Fatalf("expected username 'app', got '%s'", creds.Username)
	}
}

func TestUpdateDatabase(t *testing.T) {
	tests := []struct {
		name     string
		mock     *MockK8sClient
		update   map[string]interface{}
		expected int
	}{
		{
			name: "success update instances",
			mock: &MockK8sClient{
				GetClusterFunc: func(ctx context.Context, name string) (*models.DatabaseInfo, error) {
					// Return current DB info
					return &models.DatabaseInfo{Name: name, Instances: 1, StorageSize: "1Gi"}, nil
				},
				UpdateClusterFunc: func(ctx context.Context, name string, updates map[string]interface{}) (*models.DatabaseInfo, error) {
					// Return DB info after update
					instances := 1
					if v, ok := updates["instances"].(int); ok {
						instances = v
					}
					storage := "1Gi"
					if s, ok := updates["storage"].(map[string]interface{}); ok {
						storage = s["size"].(string)
					}
					return &models.DatabaseInfo{Name: name, Instances: instances, StorageSize: storage}, nil
				},
			},
			update:   map[string]interface{}{"instances": 3},
			expected: http.StatusOK,
		},
		{
			name: "cluster not found",
			mock: &MockK8sClient{
				GetClusterFunc: func(ctx context.Context, name string) (*models.DatabaseInfo, error) {
					return nil, k8serrors.NewNotFound(schema.GroupResource{}, name)
				},
			},
			update:   map[string]interface{}{"instances": 2},
			expected: http.StatusNotFound,
		},
		{
			name: "cannot decrease storage",
			mock: &MockK8sClient{
				GetClusterFunc: func(ctx context.Context, name string) (*models.DatabaseInfo, error) {
					return &models.DatabaseInfo{Name: name, Instances: 2, StorageSize: "2Gi"}, nil
				},
				UpdateClusterFunc: func(ctx context.Context, name string, updates map[string]interface{}) (*models.DatabaseInfo, error) {
					if storage, ok := updates["storage"].(map[string]interface{}); ok {
						if storage["size"] == "1Gi" {
							return nil, fmt.Errorf("cannot decrease storage from 2Gi to 1Gi")
						}
					}
					return &models.DatabaseInfo{Name: name, Instances: 2, StorageSize: "2Gi"}, nil
				},
			},
			update:   map[string]interface{}{"storage_size": "1Gi"},
			expected: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := setupTestRouter(tt.mock)

			// Convert map[string]interface{} to JSON body
			// body, _ := json.Marshal(tt.update)
			url := "/databases/db1"
			resp := performRequest(router, "PATCH", url, tt.update)

			if resp.Code != tt.expected {
				t.Fatalf("expected %d, got %d", tt.expected, resp.Code)
			}
		})
	}
}
