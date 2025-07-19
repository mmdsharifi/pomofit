# AI Insights Guide for PomoFit

This guide explains how to use the AI-powered insights system in PomoFit to get personalized productivity recommendations and analytics.

## Overview

The AI Insights system analyzes your task completion patterns, focus sessions, and productivity data to provide personalized recommendations and insights. It helps you understand your productivity patterns and suggests improvements.

## Features

### 🎯 **Productivity Score**

- Calculates a percentage score based on task completion, focus efficiency, and consistency
- Updates automatically as you use the app
- Provides motivation and progress tracking

### 📊 **Focus Trends**

- **Best Time of Day**: Identifies when you're most productive
- **Average Session Length**: Shows your typical focus duration
- **Completion Rate**: Tracks how often you finish tasks
- **Most Productive Day**: Reveals your best day of the week

### 💡 **AI Recommendations**

- Personalized suggestions based on your data
- Actionable tips for improving productivity
- Context-aware recommendations

### 📈 **Weekly Progress**

- Tracks tasks completed this week
- Shows total focus sessions
- Calculates average focus time
- Measures improvement over time

### 🔍 **Pattern Analysis**

- **Peak Hours**: Your most productive time slots
- **Common Interruptions**: Identified distraction patterns
- **Task Categories**: Distribution of your work types

## How to Use

### 1. **View Insights Dashboard**

The AI Insights Dashboard provides a comprehensive view of your productivity data:

```tsx
import AIInsightsDashboard from "@/components/ai-insights-dashboard";

// In your component
<AIInsightsDashboard tasks={tasks} history={history} sessions={sessions} />;
```

### 2. **Quick Insights Notifications**

Show contextual insights to users:

```tsx
import AIInsightsNotification from "@/components/ai-insights-notification";

// In your component
<AIInsightsNotification
  tasks={tasks}
  history={history}
  sessions={sessions}
  onDismiss={() => console.log("Insight dismissed")}
/>;
```

### 3. **Using the Hooks**

#### Full Insights Hook

```tsx
import { useAIInsights } from "@/lib/hooks/use-ai-insights";

function MyComponent() {
  const { insights, loading, error, refresh } = useAIInsights({
    tasks,
    history,
    sessions,
    autoRefresh: true, // Auto-refresh every 5 minutes
    refreshInterval: 300000,
  });

  if (loading) return <div>Loading insights...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Productivity Score: {insights?.productivityScore}%</h2>
      <button onClick={refresh}>Refresh Insights</button>
    </div>
  );
}
```

#### Quick Insight Hook

```tsx
import { useQuickInsight } from "@/lib/hooks/use-ai-insights";

function QuickTip() {
  const { insight, loading } = useQuickInsight(tasks, sessions);

  if (loading) return <div>Loading tip...</div>;

  return (
    <div className="tip-card">
      <span>💡</span>
      <p>{insight}</p>
    </div>
  );
}
```

#### Productivity Score Hook

```tsx
import { useProductivityScore } from "@/lib/hooks/use-ai-insights";

function ScoreDisplay() {
  const { score, loading } = useProductivityScore(tasks, sessions);

  return (
    <div className="score-display">
      {loading ? <span>Calculating...</span> : <span>Score: {score}%</span>}
    </div>
  );
}
```

## Integration Examples

### 1. **Add to Settings Page**

```tsx
// In settings/page.tsx
import AIInsightsDashboard from "@/components/ai-insights-dashboard";

export default function SettingsPage() {
  const { tasks } = useTasks();
  const { history } = useHistory();
  const { sessions } = useSessions();

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      {/* Other settings */}

      <section className="insights-section">
        <h2>AI Insights</h2>
        <AIInsightsDashboard
          tasks={tasks}
          history={history}
          sessions={sessions}
        />
      </section>
    </div>
  );
}
```

### 2. **Add to Timer Page**

```tsx
// In timer component
import { QuickInsight } from "@/components/ai-insights-notification";

function TimerPage() {
  const { tasks } = useTasks();
  const { sessions } = useSessions();

  return (
    <div className="timer-page">
      <Timer />

      {/* Show quick tip */}
      <QuickInsight
        type="tip"
        message="Try taking a 5-minute break after this session"
        onDismiss={() => console.log("Tip dismissed")}
      />
    </div>
  );
}
```

### 3. **Add to Task List**

```tsx
// In task list component
import { useQuickInsight } from "@/lib/hooks/use-ai-insights";

function TaskList() {
  const { tasks } = useTasks();
  const { sessions } = useSessions();
  const { insight } = useQuickInsight(tasks, sessions);

  return (
    <div className="task-list">
      <div className="task-header">
        <h2>Tasks</h2>
        {insight && <div className="insight-banner">💡 {insight}</div>}
      </div>

      {/* Task list content */}
    </div>
  );
}
```

## Data Requirements

The AI Insights system works with these data types:

### Tasks

```typescript
interface Task {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: Date;
  pomodoros?: number;
}
```

### History

```typescript
interface TaskHistory {
  id: string;
  taskId: string;
  completedAt: Date;
  duration: number;
}
```

### Sessions

```typescript
interface TimerSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  taskId?: string;
}
```

## Customization

### Custom Recommendations

You can extend the AI insights by modifying the `generateRecommendations` method in `lib/ai-insights.ts`:

```typescript
private async generateRecommendations(): Promise<string[]> {
  const recommendations: string[] = [];

  // Add your custom logic here
  if (this.tasks.length > 10) {
    recommendations.push("You have many tasks. Consider prioritizing the most important ones.");
  }

  if (this.sessions.length < 3) {
    recommendations.push("Try to complete at least 3 focus sessions today.");
  }

  return recommendations.slice(0, 3);
}
```

### Custom Metrics

Add new metrics by extending the `UserInsights` interface:

```typescript
export interface UserInsights {
  // ... existing properties
  customMetrics: {
    streakDays: number;
    totalFocusHours: number;
    efficiencyRating: number;
  };
}
```

## Best Practices

### 1. **Performance**

- Use the lightweight hooks (`useQuickInsight`, `useProductivityScore`) for simple displays
- Use the full `useAIInsights` hook only when you need complete analytics
- Enable `autoRefresh` only when necessary

### 2. **User Experience**

- Show loading states while insights are being generated
- Handle errors gracefully with fallback content
- Allow users to dismiss insights they don't want to see

### 3. **Data Privacy**

- All insights are generated locally - no data is sent to external servers
- User data remains private and secure
- Insights are based only on the user's own activity

### 4. **Accessibility**

- Include proper ARIA labels for screen readers
- Use semantic HTML structure
- Provide alternative text for icons and emojis

## Troubleshooting

### Common Issues

1. **Insights not loading**

   - Check that you have tasks or sessions data
   - Verify the data structure matches the expected interfaces
   - Check browser console for errors

2. **Low productivity scores**

   - This is normal for new users
   - Scores improve as you use the app more
   - Focus on the recommendations rather than the score

3. **Recommendations not appearing**
   - Ensure you have enough data (at least 1 task or session)
   - Check that the AI insights functions are properly imported
   - Verify the component props are correctly passed

### Debug Mode

Enable debug logging by adding this to your component:

```typescript
const { insights, loading, error } = useAIInsights({
  tasks,
  history,
  sessions,
});

console.log("AI Insights Debug:", { insights, loading, error });
```

## Future Enhancements

The AI Insights system can be extended with:

1. **Machine Learning Integration**: Connect to external ML services for more sophisticated analysis
2. **Goal Setting**: Allow users to set productivity goals and track progress
3. **Team Insights**: Compare productivity patterns across team members
4. **Predictive Analytics**: Predict future productivity based on historical data
5. **Integration APIs**: Connect with other productivity tools for richer data

## Support

For questions or issues with the AI Insights system:

1. Check the browser console for error messages
2. Verify your data structure matches the expected interfaces
3. Test with sample data to isolate issues
4. Review the test files for usage examples

The AI Insights system is designed to be robust and provide value even with minimal data, helping users improve their productivity through data-driven insights and personalized recommendations.
