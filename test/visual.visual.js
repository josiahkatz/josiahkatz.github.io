const { test, expect } = require("@playwright/test");

test.describe("Visual Regression Tests", () => {
  test.describe("Homepage", () => {
    // Skip full-page homepage test - dynamic API content causes flaky results
    // Instead, we test individual static components

    test("homepage header and navigation", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const header = page.locator("header").first();
      await expect(header).toHaveScreenshot("homepage-header.png");
    });

    test("homepage footer exists and has links", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const footer = page.locator("footer").first();

      // Verify footer exists and has expected links (non-visual test)
      await expect(footer).toBeVisible();
      await expect(footer.locator("a")).toHaveCount(4); // Instagram, Last.fm, LinkedIn, YouTube
    });

    test("homepage loads without errors", async ({ page }) => {
      const errors = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Verify no JS errors
      expect(errors).toHaveLength(0);

      // Verify key elements exist
      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    });
  });

  test.describe("CSS Critical Elements", () => {
    test("navigation links are styled", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const nav = page.locator("nav").first();
      await expect(nav).toHaveScreenshot("navigation.png");
    });
  });

  test.describe("Responsive Design", () => {
    test("homepage is responsive on mobile", async ({ page }, testInfo) => {
      // Only run on mobile project
      if (!testInfo.project.name.includes("Mobile")) {
        test.skip();
      }
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("homepage-mobile.png", {
        fullPage: true,
      });
    });
  });

  test.describe("Dark Mode", () => {
    test("homepage header in dark mode", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const header = page.locator("header").first();
      await expect(header).toHaveScreenshot("homepage-header-dark.png");
    });
  });
});
