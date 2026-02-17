package service

import (
	"math"
	"strconv"
	"strings"
	"week-4/go-rest-api/internal/models"
)

// parseStorageSize converts a storage size string (e.g., "1Gi", "500Mi") to bytes.
// Returns 0 if parsing fails or input is empty.
func ParseStorageSize(sizeStr string) int64 {
    sizeStr = strings.TrimSpace(sizeStr)

    if strings.HasSuffix(sizeStr, "Gi") {
        value, _ := strconv.ParseInt(strings.TrimSuffix(sizeStr, "Gi"), 10, 64)
        return value * 1024 * 1024 * 1024
    }

    if strings.HasSuffix(sizeStr, "Mi") {
        value, _ := strconv.ParseInt(strings.TrimSuffix(sizeStr, "Mi"), 10, 64)
        return value * 1024 * 1024
    }

    return 0
}


func CalculateTotalStorage(databases []models.DatabaseInfo) int64 {
    var total int64
    for _, db := range databases {
        instanceStorage := ParseStorageSize(db.StorageSize)
        total += instanceStorage * int64(db.Instances)
    }
    return total
}


func FormatBytesToGi(bytes int64) float64 {
    gi := float64(bytes) / (1024 * 1024 * 1024)
    return math.Round(gi*100) / 100
}
