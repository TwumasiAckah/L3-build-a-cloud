package api

import (
	"os"
	"week-4/go-rest-api/internal/api/handlers"
	"week-4/go-rest-api/internal/k8s"
	"week-4/go-rest-api/internal/logging"
	"week-4/go-rest-api/internal/middleware"

	"github.com/gin-contrib/cors"

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

	logging.InitLogger()

	router := gin.New()

	router.Use(logging.GinLogger(), gin.Recovery())

	router.Use(cors.Default())

   // Apply audit middleware to all routes
    router.Use(middleware.AuditMiddleware())

    // Initialize audit logger
	lokiURL := os.Getenv("LOKI_URL")
		if lokiURL == "" {
			lokiURL = "http://loki.monitoring.svc.cluster.local:3100"
		}
		logsHandler := handlers.NewLogsHandler(lokiURL)


	// Public routes
	router.GET("/", handlers.NewHealthHandler().Health)
	router.POST("api/login", handlers.Login)
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API routes
	api := router.Group("/api")
	api.Use(middleware.JWTAuthMiddleware())
	{
		dbHandler := handlers.NewDatabaseHandler(k8sClient)

		api.POST("/databases", dbHandler.CreateDatabase)
		api.GET("/databases", dbHandler.ListDatabases)
		api.GET("/databases/:name", dbHandler.GetDatabase)
		api.DELETE("/databases/:name", dbHandler.DeleteDatabase)
		api.GET("/databases/:name/credentials", dbHandler.GetCredentials)
		api.PATCH("/databases/:name", dbHandler.UpdateDatabase)

		api.GET("/logs/:name", logsHandler.GetServiceLogs)
        api.GET("/audit-logs", logsHandler.GetAuditLogs)
	}

	return router
}
