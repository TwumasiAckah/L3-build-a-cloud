import { test, expect } from "@playwright/test";

test("User can log in and see the dashboard", async ({ page }) => {
  // Use environment variables for security
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set",
    );
  }

  // Go to URL
  await page.goto("/");

  // Log in
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Verify login success
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // Create a new database
  await page.getByRole("button", { name: "New Database" }).click();
  await page
    .getByRole("textbox", { name: "Database Name" })
    .fill("e2e-test-db");

  // Handling the slider
  await page.getByRole("slider").first().press("ArrowRight");
  await page.getByRole("button", { name: "Create Database" }).click();

  // Verify the database appears in the list
  await expect(page.getByText("e2e-test-db")).toBeVisible();

  // Veiw the database details
  await page.getByRole("link", { name: "e2e-test-db" }).click();
  await expect(
    page.getByRole("heading", { name: "e2e-test-db" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Connect" }).click();
  await expect(page.getByText(/postgres:\/\//)).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  // update the database configuration
  await page.getByRole("button", { name: "Update Config" }).click();

  //   Handle the slider in the update config dialog
  const dialog = page.getByRole("dialog", { name: "Scale Resources" });
  const scaleSlider = dialog.getByLabel("Instances");
  await scaleSlider.focus();
  await scaleSlider.press("ArrowRight");

  //   Apply the changes and verify the dialog closes
  await dialog.getByRole("button", { name: "Apply Changes" }).click();
  await expect(dialog).not.toBeVisible();

  // Go back to the dashboard
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/.*dashboard/);
  const databaseRow = page.getByRole("row").filter({ hasText: "e2e-test-db" });

  //  Open the menu and delete the database
  await databaseRow.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Delete Database" }).click();

  //   Confirm the delete action in the alert dialog
  await page.getByRole("button", { name: "Confirm Delete" }).click();

  //   Verify the database is deleted and no longer visible in the list
  await expect(page.getByText("e2e-test-db")).not.toBeVisible();
});
