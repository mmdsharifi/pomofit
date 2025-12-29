import { render, screen, waitFor } from "@testing-library/react";
import ProductivityInsights from "@/components/productivity-insights";
import { getHistory } from "@/lib/history-utils";

// Mock dependencies
jest.mock("@/lib/history-utils");
jest.mock("recharts", () => {
  const OriginalModule = jest.requireActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div
        className="recharts-responsive-container"
        style={{ width: 800, height: 800 }}
      >
        {children}
      </div>
    ),
  };
});

// Mock the toast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("ProductivityInsights", () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 1000 * 60 * 60);
  const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24);
  const dayBeforeYesterday = new Date(now.getTime() - 1000 * 60 * 60 * 48);

  const mockSessions = [
    {
      id: "session-1",
      startTime: oneHourAgo,
      duration: 3600, // 1 hour
      note: "Test Task",
      taskTitle: "Test Task",
      mode: "pomodoro" as const,
    },
    {
      id: "session-2",
      startTime: dayBeforeYesterday,
      duration: 1800, // 30 mins
      note: "Other Task",
      taskTitle: "Other Task",
      mode: "pomodoro" as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getHistory as jest.Mock).mockReturnValue([...mockSessions]);
  });

  it("renders loading state initially", async () => {
    render(<ProductivityInsights />);
    expect(getHistory).toHaveBeenCalled();

    // Check for loading state
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders empty state when no data available", async () => {
    (getHistory as jest.Mock).mockReturnValue([]);

    render(<ProductivityInsights />);

    await waitFor(() => {
      expect(screen.getByText(/Not enough session data/i)).toBeInTheDocument();
    });
  });

  it("calculates and displays key statistics correctly", async () => {
    render(<ProductivityInsights />);

    await waitFor(() => {
      // Verify Total Focus Time
      // 3600 + 1800 = 5400 seconds = 1.5 hours
      expect(screen.getByText(/1h 30m/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Focus Time/i)).toBeInTheDocument();
      expect(screen.getByText(/2/i)).toBeInTheDocument(); // 2 sessions
      expect(screen.getByText(/45m/i)).toBeInTheDocument(); // Average session length
    });
  });

  it("identifies most productive time of day", async () => {
    render(<ProductivityInsights />);

    await waitFor(() => {
      expect(screen.getByText(/Peak Productivity/i)).toBeInTheDocument();
    });
  });

  it("displays task distribution insights", async () => {
    render(<ProductivityInsights />);

    await waitFor(() => {
      expect(screen.getByText(/Test Task/i)).toBeInTheDocument();
      // Check for the percentage (should be 50% since both tasks have the same duration)
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
      expect(screen.getByText(/67%/)).toBeInTheDocument(); // Rounded
    });
  });
});
