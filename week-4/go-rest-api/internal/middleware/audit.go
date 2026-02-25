package middleware

import (
	"strings"
	"time"

	"week-4/go-rest-api/internal/logging"

	"github.com/gin-gonic/gin"
)

func AuditMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        // Process request
        c.Next()

        // Log after response
        if shouldAudit(c.Request.Method, c.Request.URL.Path) {
            user := getUserFromContext(c)

            logging.AuditLog(
                user.Username,
                getAction(c.Request.Method, c.Request.URL.Path),
                getResourceType(c.Request.URL.Path),
                getResourceName(c),
                c.ClientIP(),
                c.Writer.Status() < 400,
                map[string]interface{}{
                    "method":      c.Request.Method,
                    "path":        c.Request.URL.Path,
                    "status":      c.Writer.Status(),
                    "duration_ms": time.Since(start).Milliseconds(),
                },
            )
        }
    }
}

func shouldAudit(method, path string) bool {
    // Audit state-changing operations
    if method == "POST" || method == "PUT" || method == "PATCH" || method == "DELETE" {
        return true
    }
    // Audit sensitive reads
    if method == "GET" && contains(path, "/credentials") {
        return true
    }
    return false
}

func getAction(method, path string) string {
    if contains(path, "/login") {
        return "LOGIN"
    }
    if contains(path, "/credentials") {
        return "VIEW_CREDENTIALS"
    }

    actions := map[string]string{
        "POST":   "CREATE",
        "PUT":    "UPDATE",
        "PATCH":  "UPDATE",
        "DELETE": "DELETE",
        "GET":    "VIEW",
    }
    return actions[method]
}

func getResourceType(path string) string {
    if contains(path, "/databases") {
        return "database"
    }
    if contains(path, "/credentials") {
        return "credentials"
    }
    return "unknown"
}

func getResourceName(c *gin.Context) string {
    if name := c.Param("name"); name != "" {
        return name
    }
    return "N/A"
}

func getUserFromContext(c *gin.Context) struct{ Username string } {
    if username, exists := c.Get("username"); exists {
        return struct{ Username string }{Username: username.(string)}
    }
    return struct{ Username string }{Username: "anonymous"}
}


func contains(path, substr string) bool {
    return strings.Contains(path, substr)
}