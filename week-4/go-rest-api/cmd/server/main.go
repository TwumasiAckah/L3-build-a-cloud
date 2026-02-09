package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// Get namespace from the environment or use default
	// namespace := getenv("NAMESPACE", "default")
	port := getenv("PORT", "8000")

	router := gin.Default()

	log.Printf("Starting server on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("server failde: %v", err)
	}

}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
