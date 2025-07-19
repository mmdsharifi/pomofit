# GitHub Bot Setup for Automated Lighthouse Audits

This guide explains how to set up automated Lighthouse performance audits using GitHub Actions for the Pomofit project.

## 🚀 Overview

The GitHub bot automatically runs Lighthouse audits on every push to the main branch and pull request, providing:

- **Automated Performance Monitoring**: Continuous performance tracking
- **Regression Detection**: Automatic alerts when performance drops
- **PR Comments**: Performance summaries in pull requests
- **Issue Creation**: Automatic issues for performance regressions
- **Daily Monitoring**: Scheduled performance checks

## 📁 Workflow Files

### 1. `lighthouse-audit.yml`

- **Purpose**: Basic Lighthouse audit workflow
- **Triggers**: Push to main, PR, manual dispatch
- **Features**:
  - Runs Lighthouse CI
  - Generates performance reports
  - Comments on PRs
  - Uploads artifacts

### 2. `performance-regression.yml`

- **Purpose**: Advanced performance monitoring
- **Triggers**: Push to main, PR, daily schedule, manual dispatch
- **Features**:
  - Performance regression detection
  - Automatic issue creation
  - Threshold checking
  - Trend monitoring

### 3. `lighthouserc.json`

- **Purpose**: Lighthouse configuration
- **Features**:
  - Performance budgets
  - Score thresholds
  - Audit settings

## 🛠️ Setup Instructions

### Step 1: Repository Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Enable GitHub Actions

1. Go to your repository on GitHub
2. Navigate to `Actions` tab
3. The workflows will appear automatically
4. Click on each workflow to enable it

### Step 3: Configure Performance Thresholds

Edit `lighthouserc.json` to adjust performance budgets:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.9 }]
      }
    }
  }
}
```

### Step 4: Update Assignee

In `.github/workflows/performance-regression.yml`, update the assignee:

```yaml
assignees: ["your-github-username"]
```

## 📊 Performance Thresholds

### Current Thresholds

- **Performance**: ≥ 85/100
- **Accessibility**: ≥ 95/100
- **Best Practices**: ≥ 90/100
- **SEO**: ≥ 90/100
- **Overall**: ≥ 90/100

### Core Web Vitals

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **FCP**: < 1.8s

## 🔄 Workflow Triggers

### Automatic Triggers

- **Push to main/master**: Runs on every commit
- **Pull Request**: Runs on PR creation/update
- **Daily Schedule**: Runs at 2 AM UTC daily

### Manual Triggers

- **Workflow Dispatch**: Manual trigger from Actions tab

## 📈 What the Bot Does

### On Every Push/PR

1. **Builds the application** with production settings
2. **Starts the server** and waits for readiness
3. **Runs Lighthouse audit** using our custom script
4. **Extracts performance scores** from results
5. **Checks against thresholds** for regressions
6. **Comments on PRs** with performance summary
7. **Uploads reports** as artifacts

### On Performance Regression

1. **Detects threshold violations**
2. **Creates GitHub issue** with details
3. **Labels issue** appropriately
4. **Assigns to maintainer**
5. **Provides actionable next steps**

### Daily Monitoring

1. **Runs scheduled audit** at 2 AM UTC
2. **Tracks performance trends**
3. **Stores historical data**
4. **Detects gradual regressions**

## 📋 Generated Reports

### Report Types

- **Auto-audit reports**: `auto-audit-YYYY-MM-DD_HH-MM-SS.txt`
- **Regression reports**: `regression-YYYY-MM-DD_HH-MM-SS.md`
- **Lighthouse JSON**: `lighthouse-auto-YYYY-MM-DD_HH-MM-SS.json`

### Report Location

All reports are stored in `docs/performance-reports/` and organized by date.

## 🎯 Benefits

### Continuous Monitoring

- **No manual intervention** required
- **Immediate feedback** on performance changes
- **Historical tracking** of performance trends
- **Early regression detection**

### Developer Experience

- **PR comments** with performance impact
- **Clear thresholds** and expectations
- **Actionable feedback** for improvements
- **Automated issue creation** for problems

### Quality Assurance

- **Prevents performance regressions**
- **Maintains high performance standards**
- **Ensures accessibility compliance**
- **Monitors SEO best practices**

## 🔧 Customization

### Adjusting Thresholds

Edit the thresholds in both workflow files:

```yaml
PERFORMANCE_THRESHOLD=85
ACCESSIBILITY_THRESHOLD=95
BEST_PRACTICES_THRESHOLD=90
SEO_THRESHOLD=90
OVERALL_THRESHOLD=90
```

### Adding More URLs

To audit multiple pages, update the URLs in the workflow:

```yaml
urls: |
  http://localhost:3000
  http://localhost:3000/settings
  http://localhost:3000/history
```

### Custom Performance Metrics

Add custom metrics to the performance analysis script:

```javascript
// In scripts/performance-analysis.js
const customMetrics = {
  bundleSize: totalSize,
  loadTime: loadTime,
  // Add your custom metrics
};
```

## 🚨 Troubleshooting

### Common Issues

#### Workflow Fails to Start

- Check repository secrets are set
- Verify Node.js version compatibility
- Ensure build dependencies are available

#### Performance Regression False Positives

- Adjust thresholds in `lighthouserc.json`
- Review recent changes for legitimate improvements
- Consider temporary threshold adjustments

#### Lighthouse Audit Fails

- Check if application starts correctly
- Verify port 3000 is available
- Review Chrome flags for compatibility

### Debugging Steps

1. **Check workflow logs** in Actions tab
2. **Review generated reports** in artifacts
3. **Test locally** with same environment
4. **Verify environment variables** are set

## 📚 Related Documentation

- [Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md) - Optimization techniques
- [Testing Guide](../testing/TESTING.md) - Testing strategy
- [Performance Reports](../performance-reports/README.md) - Report organization

## 🔄 Maintenance

### Regular Tasks

- **Review thresholds** quarterly
- **Update dependencies** monthly
- **Analyze trends** in performance reports
- **Adjust workflows** based on project needs

### Performance Budgets

- **Monitor bundle sizes** for increases
- **Track Core Web Vitals** trends
- **Review accessibility** compliance
- **Check SEO** best practices

---

**Note**: This bot setup ensures your Pomofit project maintains excellent performance standards automatically. The workflows are designed to catch regressions early and provide actionable feedback for continuous improvement.
