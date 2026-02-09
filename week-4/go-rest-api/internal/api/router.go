package api

import (
	"github.com/TwumasiAckah/L3-build-a-cloud/week-4/go-rest-api/internal/api/handlers"
	"github.com/TwumasiAckah/L3-build-a-cloud/week-4/go-rest-api/internal/k8s"
	"github.com/gin-gonic/gin"
)

// SetupRouter creates and configures the Gin router
func SetupRouter(k8sClient *k8s.Client) *gin.Engine {
	router := gin.Default()

	// Health handler
	healthHandler := handlers.NewHealthHandler()
	router.GET("/", healthHandler.Health)

	return router
}
