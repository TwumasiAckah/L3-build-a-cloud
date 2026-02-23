// handlers/logs.go
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
)

type LogsHandler struct {
    lokiURL string // e.g., "http://loki:3100"
}

func NewLogsHandler(lokiURL string) *LogsHandler {
    return &LogsHandler{lokiURL: lokiURL}
}

type LogEntry struct {
    Timestamp string                 `json:"timestamp"`
    Level     string                 `json:"level,omitempty"`
    Message   string                 `json:"message"`
    LogType   string                 `json:"log_type"`
    User      string                 `json:"user,omitempty"`
    Action    string                 `json:"action,omitempty"`
    Resource  string                 `json:"resource_name,omitempty"`
    Details   map[string]interface{} `json:"details,omitempty"`
}

// GET /api/logs/:name
func (h *LogsHandler) GetServiceLogs(c *gin.Context) {
    dbName := c.Param("name")
    limit := c.DefaultQuery("limit", "50")

    // Build LogQL query: {log_type="service", database_name="my-db"}
    query := fmt.Sprintf(`{log_type="service", database_name="%s"}`, dbName)

    logs, err := h.queryLoki(query, limit)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to fetch logs"})
        return
    }

    c.JSON(200, logs)
}

// GET /api/audit
func (h *LogsHandler) GetAuditLogs(c *gin.Context) {
    limit := c.DefaultQuery("limit", "100")
    user := c.Query("user")

    // Build query
    query := `{log_type="audit"}`
    if user != "" {
        query = fmt.Sprintf(`{log_type="audit", user="%s"}`, user)
    }

    logs, err := h.queryLoki(query, limit)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to fetch audit logs"})
        return
    }

    c.JSON(200, logs)
}

func (h *LogsHandler) queryLoki(query, limit string) ([]LogEntry, error) {
    // Build Loki query URL
    params := url.Values{}
    params.Add("query", query)
    params.Add("limit", limit)
    params.Add("start", fmt.Sprintf("%d", time.Now().Add(-24*time.Hour).Unix()))
    params.Add("direction", "backward") // Newest first

    lokiURL := fmt.Sprintf("%s/loki/api/v1/query_range?%s", h.lokiURL, params.Encode())

    // Query Loki
    resp, err := http.Get(lokiURL)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    // Parse Loki response
    var lokiResp struct {
        Data struct {
            Result []struct {
                Stream map[string]string `json:"stream"`
                Values [][]string        `json:"values"` // [timestamp, log_line]
            } `json:"result"`
        } `json:"data"`
    }

    if err := json.NewDecoder(resp.Body).Decode(&lokiResp); err != nil {
        return nil, err
    }

    // Transform to LogEntry
    var logs []LogEntry
    for _, result := range lokiResp.Data.Result {
        for _, value := range result.Values {
            if len(value) < 2 {
                continue
            }

            timestamp := value[0]
            logLine := value[1]

            // Parse JSON log line
            var logData map[string]interface{}
            if err := json.Unmarshal([]byte(logLine), &logData); err != nil {
                continue
            }

            // Convert to LogEntry
            entry := LogEntry{
                Timestamp: timestamp,
                LogType:   getString(logData, "log_type"),
                Message:   getString(logData, "message"),
                Level:     getString(logData, "level"),
                User:      getString(logData, "user"),
                Action:    getString(logData, "action"),
                Resource:  getString(logData, "resource_name"),
            }

            if details, ok := logData["details"].(map[string]interface{}); ok {
                entry.Details = details
            }

            logs = append(logs, entry)
        }
    }

    return logs, nil
}

func getString(m map[string]interface{}, key string) string {
    if v, ok := m[key].(string); ok {
        return v
    }
    return ""
}