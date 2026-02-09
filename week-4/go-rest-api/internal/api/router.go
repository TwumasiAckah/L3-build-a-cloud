package api

import (
	"week-4/go-rest-api/internal/api/handlers"
	"week-4/go-rest-api/internal/k8s"

	"github.com/gin-gonic/gin"
)

// SetupRouter initializes the HTTP router and wires
// API routes to their corresponding handlers.
// This function is the composition root for the API layer:
// all dependencies are injected here, not inside handlers.
func SetupRouter(k8sClient *k8s.Client) *gin.Engine {

	// gin.Default() sets up logging and recovery middleware
	router := gin.Default()

	// Health endpoint
	// Used for liveness checks and basic service validation
	router.GET("/", handlers.Health)

	// Database endpoints
	// These handlers depend on the Kubernetes client
	// dbHandler := handlers.NewDatabaseHandler(k8sClient)

	// router.POST("/databases", dbHandler.CreateDatabase)
	// router.GET("/databases", dbHandler.ListDatabases)
	// router.GET("/databases/:name", dbHandler.GetDatabase)
	// router.DELETE("/databases/:name", dbHandler.DeleteDatabase)
	// router.GET("/databases/:name/credentials", dbHandler.GetCredentials)

	return router
}