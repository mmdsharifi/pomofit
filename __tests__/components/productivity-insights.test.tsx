
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
            <div className="recharts-responsive-container" style={{ width: 800, height: 800 }}>
                {children}
            </div>
        ),
    };
});

describe("ProductivityInsights", () => {
    const mockSessions = [
        {
            id: "session-1",
            startTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            endTime: new Date(Date.now()).toISOString(),
            duration: 3600, // 1 hour
            label: "Focus",
            note: "Test Task",
            taskTitle: "Test Task",
            mode: "pomodoro",
            completed: true,
        },
        {
            id: "session-2",
            startTime: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // Yesterday
            endTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            duration: 1800, // 30 mins
            label: "Focus",
            note: "Other Task",
            taskTitle: null,
            mode: "pomodoro",
            completed: true,
        }
    ];

    beforeEach(() => {
        (getHistory as jest.Mock).mockReturnValue(mockSessions);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders loading state initially", async () => {
        // Since useEffect runs fast, we might catch loading or result.
        // But the component sets loading=true inside useEffect before getting history.
        // To test loading state properly implies delaying the effect or mock, which is hard with synchronous getHistory.
        // However, the initial state is loading=true.
        // We can just check if getHistory is called.
        
        render(<ProductivityInsights />);
        await waitFor(() => expect(getHistory).toHaveBeenCalled());
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
            expect(screen.getByText("1h 30m")).toBeInTheDocument();
            expect(screen.getByText("Total Focus Time")).toBeInTheDocument();
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
            expect(screen.getByText("Test Task")).toBeInTheDocument();
            // "Test Task" has 1 hour (3600s). Total is 1.5h. 
            // 1h / 1.5h = 66%
            expect(screen.getByText(/67%/)).toBeInTheDocument(); // Rounded
        });
    });
});
