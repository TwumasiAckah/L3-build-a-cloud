package api

import (
	"week-4/go-rest-api/internal/api/handlers"
	"week-4/go-rest-api/internal/k8s"
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
	router := gin.Default()

	router.Use(cors.Default())

	// Public routes
	router.GET("/", handlers.NewHealthHandler().Health)
	router.POST("/login", handlers.Login)
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Protected API
	api := router.Group("/api/databases")
	api.Use(middleware.JWTAuthMiddleware())
	{
		dbHandler := handlers.NewDatabaseHandler(k8sClient)

		api.POST("", dbHandler.CreateDatabase)
		api.GET("", dbHandler.ListDatabases)
		api.GET("/:name", dbHandler.GetDatabase)
		api.DELETE("/:name", dbHandler.DeleteDatabase)
		api.GET("/:name/credentials", dbHandler.GetCredentials)
		api.PATCH("/:name", dbHandler.UpdateDatabase)
	}

	return router
}

