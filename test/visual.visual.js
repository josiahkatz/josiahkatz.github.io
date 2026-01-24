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

  test.describe("Blog", () => {
    test("blog index renders correctly", async ({ page }) => {
      await page.goto("/blog/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("blog-index.png", {
        fullPage: true,
      });
    });

    test("blog post renders correctly", async ({ page }) => {
      await page.goto("/blog/2026/01/hello-world/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("blog-post.png", {
        fullPage: true,
      });
    });

    test("blog tags page renders correctly", async ({ page }) => {
      await page.goto("/blog/tags/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("blog-tags.png", {
        fullPage: true,
      });
    });
  });

  test.describe("CSS Critical Elements", () => {
    test("typography renders correctly", async ({ page }) => {
      await page.goto("/blog/2026/01/hello-world/");
      await page.waitForLoadState("networkidle");

      // Check main content area typography
      const article = page.locator("main").first();
      await expect(article).toHaveScreenshot("typography.png");
    });

    test("navigation links are styled", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const nav = page.locator("nav").first();
      await expect(nav).toHaveScreenshot("navigation.png");
    });

    test("blog cards are styled", async ({ page }) => {
      await page.goto("/blog/");
      await page.waitForLoadState("networkidle");

      const blogList = page.locator(".blog-list, .post-card").first();
      if ((await blogList.count()) > 0) {
        await expect(blogList).toHaveScreenshot("blog-cards.png");
      }
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

    test("blog respects dark mode preference", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto("/blog/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("blog-dark.png", {
        fullPage: true,
      });
    });
  });

  test.describe("Interactive States", () => {
    test("link hover states work", async ({ page }) => {
      await page.goto("/blog/");
      await page.waitForLoadState("networkidle");

      // Find a link and hover over it
      const link = page.locator("a").first();
      await link.hover();

      // Small delay to let hover styles apply
      await page.waitForTimeout(100);

      await expect(link).toHaveScreenshot("link-hover.png");
    });
  });
});
