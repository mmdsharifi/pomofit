const puppeteer = require("puppeteer");

async function measurePerformance() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Enable performance monitoring
  await page.setCacheEnabled(false);

  console.log("🚀 Starting performance test...");

  // Navigate to the page
  const startTime = Date.now();
  await page.goto("http://localhost:3000", {
    waitUntil: "networkidle0",
    timeout: 30000,
  });

  // Wait for content to load
  await page.waitForSelector("body", { timeout: 10000 });

  // Measure performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByType("paint");

    return {
      domContentLoaded:
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find((p) => p.name === "first-paint")?.startTime || 0,
      firstContentfulPaint:
        paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0,
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
    };
  });

  const endTime = Date.now();
  const totalLoadTime = endTime - startTime;

  console.log("\n📊 Performance Results:");
  console.log("========================");
  console.log(`Total Load Time: ${totalLoadTime}ms`);
  console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`);
  console.log(`Load Complete: ${metrics.loadComplete}ms`);
  console.log(`First Paint: ${metrics.firstPaint}ms`);
  console.log(`First Contentful Paint: ${metrics.firstContentfulPaint}ms`);
  console.log(`Total Navigation Time: ${metrics.totalTime}ms`);

  // Check bundle sizes
  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource");
    const jsFiles = entries.filter((r) => r.name.includes(".js"));
    const cssFiles = entries.filter((r) => r.name.includes(".css"));

    return {
      totalJS: jsFiles.reduce((sum, r) => sum + r.transferSize, 0),
      totalCSS: cssFiles.reduce((sum, r) => sum + r.transferSize, 0),
      jsCount: jsFiles.length,
      cssCount: cssFiles.length,
    };
  });

  console.log("\n📦 Resource Analysis:");
  console.log("=====================");
  console.log(`JavaScript Files: ${resources.jsCount}`);
  console.log(`CSS Files: ${resources.cssCount}`);
  console.log(`Total JS Size: ${(resources.totalJS / 1024).toFixed(2)}KB`);
  console.log(`Total CSS Size: ${(resources.totalCSS / 1024).toFixed(2)}KB`);

  // Performance score calculation
  let score = 100;
  if (metrics.firstContentfulPaint > 2000) score -= 20;
  if (metrics.firstContentfulPaint > 4000) score -= 30;
  if (totalLoadTime > 5000) score -= 20;
  if (totalLoadTime > 10000) score -= 30;
  if (resources.totalJS > 500000) score -= 10;

  console.log("\n🏆 Performance Score:");
  console.log("=====================");
  console.log(`Score: ${Math.max(0, score)}/100`);

  if (score >= 90) {
    console.log("🎉 Excellent performance!");
  } else if (score >= 70) {
    console.log("✅ Good performance");
  } else if (score >= 50) {
    console.log("⚠️  Needs improvement");
  } else {
    console.log("❌ Poor performance - needs optimization");
  }

  await browser.close();
}

measurePerformance().catch(console.error);
