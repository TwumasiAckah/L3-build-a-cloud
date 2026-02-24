package logging

import (
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
		zap.String("log_type", "audit"),
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