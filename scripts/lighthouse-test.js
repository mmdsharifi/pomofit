const puppeteer = require("puppeteer");
const lighthouse = require("lighthouse");
const { URL } = require("url");

async function runLighthouse() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  console.log("🚀 Starting Lighthouse audit...");

  // Navigate to the page and wait for it to load
  await page.goto("http://localhost:3000", {
    waitUntil: "networkidle0",
    timeout: 30000,
  });

  // Wait for the main content to appear
  await page.waitForSelector("body", { timeout: 10000 });

  // Wait a bit more for dynamic content to load
  await page.waitForTimeout(2000);

  // Get the page URL
  const url = page.url();

  // Close the page but keep the browser
  await page.close();

  // Run Lighthouse
  const options = {
    logLevel: "info",
    output: "json",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    port: new URL(browser.wsEndpoint()).port,
  };

  console.log("📊 Running Lighthouse audit...");

  const runnerResult = await lighthouse(url, options);
  const report = runnerResult.lhr;

  // Extract scores
  const scores = {
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    "best-practices": Math.round(
      report.categories["best-practices"].score * 100
    ),
    seo: Math.round(report.categories.seo.score * 100),
  };

  // Display results
  console.log("\n🏆 Lighthouse Scores:");
  console.log("=====================");
  console.log(
    `Performance: ${scores.performance}/100 ${getScoreEmoji(
      scores.performance
    )}`
  );
  console.log(
    `Accessibility: ${scores.accessibility}/100 ${getScoreEmoji(
      scores.accessibility
    )}`
  );
  console.log(
    `Best Practices: ${scores["best-practices"]}/100 ${getScoreEmoji(
      scores["best-practices"]
    )}`
  );
  console.log(`SEO: ${scores.seo}/100 ${getScoreEmoji(scores.seo)}`);

  // Calculate overall score
  const overallScore = Math.round(
    (scores.performance +
      scores.accessibility +
      scores["best-practices"] +
      scores.seo) /
      4
  );

  console.log(
    `\nOverall Score: ${overallScore}/100 ${getScoreEmoji(overallScore)}`
  );

  // Show key metrics
  if (report.categories.performance) {
    const metrics = report.categories.performance.auditRefs
      .filter((audit) => audit.result && audit.result.score !== null)
      .slice(0, 5);

    console.log("\n📈 Key Performance Metrics:");
    console.log("==========================");
    metrics.forEach((metric) => {
      const score = Math.round(metric.result.score * 100);
      console.log(
        `${metric.result.title}: ${score}/100 ${getScoreEmoji(score)}`
      );
    });
  }

  // Show opportunities for improvement
  const opportunities = report.categories.performance.auditRefs
    .filter(
      (audit) =>
        audit.result && audit.result.score !== null && audit.result.score < 1
    )
    .slice(0, 3);

  if (opportunities.length > 0) {
    console.log("\n🔧 Opportunities for Improvement:");
    console.log("=================================");
    opportunities.forEach((opp) => {
      const score = Math.round(opp.result.score * 100);
      console.log(`• ${opp.result.title}: ${score}/100`);
    });
  }

  await browser.close();

  return scores;
}

function getScoreEmoji(score) {
  if (score >= 90) return "🟢";
  if (score >= 50) return "🟡";
  return "🔴";
}

runLighthouse().catch(console.error);
