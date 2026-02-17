package handlers

import (
	"context"
	"net/http"
	"strings"
	"week-4/go-rest-api/internal/k8s"
	"week-4/go-rest-api/internal/models"
	"week-4/go-rest-api/internal/service"

	k8serrors "k8s.io/apimachinery/pkg/api/errors"

	"github.com/gin-gonic/gin"
)

type K8sClient interface {
	CreateCluster(context.Context, models.DatabaseCreateRequest) (*models.DatabaseInfo, error)
	GetCluster(context.Context, string) (*models.DatabaseInfo, error)
	ListClusters(context.Context) ([]models.DatabaseInfo, error)
	DeleteCluster(context.Context, string) error
	GetCredentials(context.Context, string) (*models.DatabaseCredentials, error)
	UpdateCluster(context.Context, string, map[string]interface{}) (*models.DatabaseInfo, error)
}

// DatabaseHandler handles database-related endpoints
type DatabaseHandler struct {
	k8sClient K8sClient
}

// NewDatabaseHandler creates a new DatabaseHandler
func NewDatabaseHandler(k8sClient *k8s.Client) *DatabaseHandler {
	return &DatabaseHandler{
		k8sClient: k8sClient,
	}
}

// CreateDatabase creates a new database cluster
// @Summary Create a new PostgreSQL database cluster
// @Description Create a new CloudNativePG database cluster
// @Tags databases
// @Accept json
// @Produce json
// @Param database body models.DatabaseCreateRequest true "Database creation request"
// @Success 201 {object} models.DatabaseInfo
// @Failure 400 {object} models.ErrorResponse
// @Failure 409 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /databases [post]
func (h *DatabaseHandler) CreateDatabase(c *gin.Context) {
	var req models.DatabaseCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	info, err := h.k8sClient.CreateCluster(c.Request.Context(), req)
	if err != nil {
		if k8serrors.IsAlreadyExists(err) {
			respondMessage(
				c,
				http.StatusConflict,
				"Database already exists",
				"A database cluster with the same name already exists",
			)
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to create database", err)
		return
	}
	c.JSON(http.StatusCreated, info)
}

// GetDatabase gets a specific database cluster
// @Summary Get database cluster information
// @Description Get detailed information about a specific database cluster
// @Tags databases
// @Produce json
// @Param name path string true "Database name"
// @Success 200 {object} models.DatabaseInfo
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /databases/{name} [get]
func (h *DatabaseHandler) GetDatabase(c *gin.Context) {
	name := c.Param("name")

	info, err := h.k8sClient.GetCluster(c.Request.Context(), name)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			respondMessage(
				c,
				http.StatusNotFound,
				"Database not found",
				"No database cluster found with this name",
			)
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to get dtabase", err)
		return
	}
	c.JSON(http.StatusOK, info)

}

// ListDatabases lists all database clusters
// @Summary List all database clusters
// @Description Get a list of all PostgreSQL database clusters
// @Tags databases
// @Produce json
// @Success 200 {object} models.DatabaseListResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /databases [get]
func (h *DatabaseHandler) ListDatabases(c *gin.Context) {
	clusters, err := h.k8sClient.ListClusters(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:  "Failed to list databases",
			Detail: err.Error(),
		})
		return
	}

	totalBytes := service.CalculateTotalStorage(clusters)
    totalGi := service.FormatBytesToGi(totalBytes)

	c.JSON(http.StatusOK, models.DatabaseListResponse{
		Databases: clusters,
		Total:     len(clusters),
		TotalStorageGi:   totalGi,
        TotalStorageByte: totalBytes,
	})

}

// DeleteDatabase deletes a database cluster
// @Summary Delete a database cluster
// @Description Permanently delete a database cluster and all its data
// @Tags databases
// @Param name path string true "Database name"
// @Success 204 "Database deleted successfully"
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /databases/{name} [delete]
func (h *DatabaseHandler) DeleteDatabase(c *gin.Context) {
	name := c.Param("name")

	err := h.k8sClient.DeleteCluster(c.Request.Context(), name)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			respondMessage(
				c,
				http.StatusNotFound,
				"Database not found",
				"No database found with this name",
			)
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to delete database", err)
		return
	}
	c.Status(http.StatusNoContent)
}

// GetCredentials gets database connection credentials
// @Summary Get database credentials
// @Description Get connection credentials for a database cluster
// @Tags databases
// @Produce json
// @Param name path string true "Database name"
// @Success 200 {object} models.DatabaseCredentials
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /databases/{name}/credentials [get]
func (h *DatabaseHandler) GetCredentials(c *gin.Context) {
	name := c.Param("name")

	creds, err := h.k8sClient.GetCredentials(c.Request.Context(), name)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			respondMessage(
				c,
				http.StatusNotFound,
				"Credentials not available",
				"The database may not exist or is not ready yet",
			)
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to get credentials", err)
		return
	}
	c.JSON(http.StatusOK, creds)
}

// UpdateDatabase updates a database cluster
// @Summary Update database cluster
// @Description Update database cluster configuration (instances, storage)
// @Tags databases
// @Accept json
// @Produce json
// @Param name path string true "Database name"
// @Param update body models.DatabaseUpdateRequest true "Update request"
// @Success 200 {object} models.DatabaseInfo
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /databases/{name} [patch]
func (h *DatabaseHandler) UpdateDatabase(c *gin.Context) {
	name := c.Param("name")

	var req models.DatabaseUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	// Validate at least one field is being updated
	if req.Instances == nil && req.StorageSize == nil {
		respondMessage(c, http.StatusBadRequest, "No updates provided", "")
		return
	}

	// Check if cluster exists
	_, err := h.k8sClient.GetCluster(c.Request.Context(), name)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			respondMessage(c, http.StatusNotFound, "Database not found", "No database cluster found with this name")
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to get database", err)
		return
	}

	// Prepare updates
	updates := make(map[string]interface{})
	if req.Instances != nil {
		updates["instances"] = *req.Instances
	}
	if req.StorageSize != nil {
		updates["storage"] = map[string]interface{}{"size": *req.StorageSize}
	}

	// Apply updates
	updated, err := h.k8sClient.UpdateCluster(c.Request.Context(), name, updates)
	if err != nil {
		if strings.Contains(err.Error(), "cannot decrease storage") {
			respondError(c, http.StatusBadRequest, "Invalid update", err)
			return
		}
		respondError(c, http.StatusInternalServerError, "Failed to update database", err)
		return
	}

	c.JSON(http.StatusOK, updated)
}

// Helpers

func respondError(c *gin.Context, status int, message string, err error) {
	c.JSON(status, models.ErrorResponse{
		Error:  message,
		Detail: err.Error(),
	})
}

func respondMessage(c *gin.Context, status int, message, detail string) {
	c.JSON(status, models.ErrorResponse{
		Error:  message,
		Detail: detail,
	})
}
