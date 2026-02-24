// handlers/logs.go
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type LogsHandler struct {
	lokiURL string
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
	level := c.Query("level") // Optional filter: INFO, WARN, ERROR

	// Build LogQL query
	query := fmt.Sprintf(`{log_type="service", database_name="%s"}`, dbName)

	// Add level filter if provided
	if level != "" {
		query = fmt.Sprintf(`{log_type="service", database_name="%s"} | json | level=~"(?i)%s"`, dbName, level)
	}

	logs, err := h.queryLoki(query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// GET /api/audit
func (h *LogsHandler) GetAuditLogs(c *gin.Context) {
	limit := c.DefaultQuery("limit", "100")
	user := c.Query("user")
	action := c.Query("action") // NEW: filter by action

	// Build query
	query := `{log_type="audit"}`

	// Add filters
	filters := []string{}
	if user != "" {
		filters = append(filters, fmt.Sprintf(`user="%s"`, user))
	}
	if action != "" {
		filters = append(filters, fmt.Sprintf(`action="%s"`, action))
	}

	if len(filters) > 0 {
		query = fmt.Sprintf(`{log_type="audit", %s}`, joinFilters(filters))
	}

	logs, err := h.queryLoki(query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit logs", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

func (h *LogsHandler) queryLoki(query, limit string) ([]LogEntry, error) {
	// Build Loki query URL
	params := url.Values{}
	params.Add("query", query)
	params.Add("limit", limit)
	params.Add("start", fmt.Sprintf("%d", time.Now().Add(-24*time.Hour).UnixNano()))
	params.Add("direction", "backward")

	lokiURL := fmt.Sprintf("%s/loki/api/v1/query_range?%s", h.lokiURL, params.Encode())

	// Query Loki
	resp, err := http.Get(lokiURL)
	if err != nil {
		return nil, fmt.Errorf("loki request failed: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("loki returned status %d", resp.StatusCode)
	}

	// Parse Loki response
	var lokiResp struct {
		Status string `json:"status"`
		Data   struct {
			ResultType string `json:"resultType"`
			Result     []struct {
				Stream map[string]string `json:"stream"`
				Values [][]string        `json:"values"`
			} `json:"result"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&lokiResp); err != nil {
		return nil, fmt.Errorf("failed to parse loki response: %w", err)
	}

	// Transform to LogEntry
	var logs []LogEntry
	for _, result := range lokiResp.Data.Result {
		for _, value := range result.Values {
			if len(value) < 2 {
				continue
			}

			// Loki timestamp is in nanoseconds
			timestampNs := value[0]
			logLine := value[1]

			// Parse JSON log line
			var logData map[string]interface{}
			if err := json.Unmarshal([]byte(logLine), &logData); err != nil {
				continue
			}

			// Convert to LogEntry
			entry := LogEntry{
				Timestamp: formatTimestamp(timestampNs),
				LogType:   getString(logData, "log_type"),
				Message:   getString(logData, "msg"),
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

func joinFilters(filters []string) string {
	result := ""
	for i, f := range filters {
		if i > 0 {
			result += ", "
		}
		result += f
	}
	return result
}

func formatTimestamp(timestampNs string) string {
	// Parse nanoseconds timestamp
	ns, err := strconv.ParseInt(timestampNs, 10, 64)
	if err != nil {
		return timestampNs
	}

	t := time.Unix(0, ns)
	return t.Format(time.RFC3339)
}