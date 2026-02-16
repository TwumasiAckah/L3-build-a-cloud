package handlers

import (
	"week-4/go-rest-api/internal/auth"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

type LoginResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid request"})
		return
	}

	// Hardcoded user
	if req.Username != "admin" || req.Password != "admin" {
		c.JSON(401, gin.H{"error": "invalid credentials"})
		return
	}

	token, _ := auth.GenerateToken(req.Username)

	resp := LoginResponse{
		User: User{
			ID:       "1",
			Username: req.Username,
		},
		Token: token,
	}

	c.JSON(200, resp)
}
