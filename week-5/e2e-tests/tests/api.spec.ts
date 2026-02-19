import { test, expect } from "@playwright/test";

test.describe("Postgres API", () => {
  const baseURL = "https://cloudstack.stackit.rocks/api";

  test("Login returns a valid JWT", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(body.user.username).toBe(process.env.ADMIN_USERNAME);
  });
});
