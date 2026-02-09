package models

import "time"

type DatabaseStatus string

const (
	StatusReady    DatabaseStatus = "ready"
	StatusCreating DatabaseStatus = "creating"
	StatusFailed   DatabaseStatus = "failed"
	StatusDeleting DatabaseStatus = "deleting"
	StatusUnknown  DatabaseStatus = "unknown"
)

type DatabaseCreateRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=253"`
	Instances    int    `json:"instances" binding:"required,min=1,max=5"`
	StorageSize string `json:"storage_size" binding:"required"`
	PostgresVersion     int    `json:"postgresql_version" binding:"required,min=12,max=18"`
}

type DatabaseInfo struct {
	Name           string         `json:"name"`
	Status         DatabaseStatus `json:"status"`
	Instances      int            `json:"instances"`
	ReadyInstances int            `json:"ready_instances"`
	PostgresVersion string         `json:"postgresql_version"`
	StorageSize    string         `json:"storage_size"`
	CreatedAt      *time.Time     `json:"created_at,omitempty"`
}

type DatabaseListResponse struct {
	Database []DatabaseInfo `json:"databases"`
	Total    int            `json:"total"`
}

type DatabaseCredentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Database string `json:"database"`
	DSN      string `json:"connection_string"`
}

type ErrorResponse struct {
	Error  string `json:"error"`
	Detail string `json:"detail,omitempty"`
}
