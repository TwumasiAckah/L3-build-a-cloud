package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Health responds with a simple liveness signal.
// It only confirms that the API process is running.
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "PostgreSQL PaaS API",
		"version": "v1",
	})
}
