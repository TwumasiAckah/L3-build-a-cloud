package api

import (
	"week-4/go-rest-api/internal/api/handlers"
	"week-4/go-rest-api/internal/k8s"

	swaggerFiles "github.com/swaggo/files"

	"github.com/gin-gonic/gin"

	_ "week-4/go-rest-api/docs"

	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRouter initializes the HTTP router and wires
// API routes to their corresponding handlers.
// This function is the composition root for the API layer:
// all dependencies are injected here, not inside handlers.
func SetupRouter(k8sClient *k8s.Client) *gin.Engine {

	// gin.Default() sets up logging and recovery middleware
	router := gin.Default()

	// Swagger endpoint
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health endpoint
	// Used for liveness checks and basic service validation
	healthHandler := handlers.NewHealthHandler()
	router.GET("/", healthHandler.Health)

	// Database endpoints
	// These handlers depend on the Kubernetes client
	dbHandler := handlers.NewDatabaseHandler(k8sClient)

	// Register your handlers here
	api := router.Group("/api")
	{
		api.POST("/databases", dbHandler.CreateDatabase)
		api.GET("/databases", dbHandler.ListDatabases)
		api.GET("/databases/:name", dbHandler.GetDatabase)
		api.DELETE("/databases/:name", dbHandler.DeleteDatabase)
		api.GET("/databases/:name/credentials", dbHandler.GetCredentials)
	}

	return router
}
