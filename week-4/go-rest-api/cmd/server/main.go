package main

import (
	"log"
	"os"
	"week-4/go-rest-api/internal/api"
	"week-4/go-rest-api/internal/k8s"
)

func main() {
	// Get namespace from the environment or use default
	namespace := getenv("NAMESPACE", "postgres-clusters")
	port := getenv("PORT", "8000")

	k8sClient, err := k8s.NewClient(namespace)
	if err != nil {
		log.Fatalf("k8s client init failed: %v", err)
	}

	router := api.SetupRouter(k8sClient)

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
