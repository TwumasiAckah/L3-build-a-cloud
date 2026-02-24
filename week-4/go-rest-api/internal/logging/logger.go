package logging

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Logger *zap.Logger

func InitLogger() {
	config := zap.NewProductionConfig()
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.MessageKey = "message"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	config.OutputPaths = []string{"stdout"}

	Logger, _ = config.Build()
}

// Audit log helper
func AuditLog(user, action, resourceType, resourceName, ip string, success bool, details map[string]interface{}) {
	Logger.Info("Audit event",
		zap.String("log_type", "audit_action"),
		zap.String("user", user),
		zap.String("action", action),
		zap.String("resource_type", resourceType),
		zap.String("resource_name", resourceName),
		zap.String("ip", ip),
		zap.Bool("success", success),
		zap.Any("details", details),
	)
}

// Service log helper
func ServiceLog(dbName, level, eventType, message string, details map[string]interface{}) {
	Logger.Info(message,
		zap.String("log_type", "service"),
		zap.String("database_name", dbName),
		zap.String("level", level),
		zap.String("event_type", eventType),
		zap.Any("details", details),
	)
}

func GinLogger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path

        c.Next()

        // This ensures EVERY request becomes an "audit" log type for Loki
        Logger.Info("Request handled",
            zap.String("log_type", "audit"),
            zap.Int("status", c.Writer.Status()),
            zap.String("method", c.Request.Method),
            zap.String("path", path),
            zap.String("ip", c.ClientIP()),
            zap.String("user", c.GetString("user")),
            zap.Duration("latency", time.Since(start)),
        )
    }
}