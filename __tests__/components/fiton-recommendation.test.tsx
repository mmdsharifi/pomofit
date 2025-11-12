import { render, screen, fireEvent } from "@testing-library/react";
import FitOnRecommendation from "@/components/fiton-recommendation";

const workouts = [
  {
    id: "sleepy-a",
    mood: "sleepy",
    emoji: "😴",
    title: "Sleepy A",
    minutes: 3,
    type: "Stretch",
    url: "https://fiton.example/a",
  },
  {
    id: "sleepy-b",
    mood: "sleepy",
    emoji: "😴",
    title: "Sleepy B",
    minutes: 5,
    type: "Stretch",
    url: "https://fiton.example/b",
  },
  {
    id: "energetic-a",
    mood: "energetic",
    emoji: "💪",
    title: "Energetic A",
    minutes: 6,
    type: "Cardio",
    url: "https://fiton.example/c",
  },
];

describe("FitOnRecommendation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows a single recommendation with shuffle control", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    render(<FitOnRecommendation workouts={workouts} />);

    expect(screen.getByText(/Break suggestion/i)).toBeInTheDocument();
    expect(screen.getByText(/Sleepy A/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Shuffle/i })).toBeInTheDocument();
  });

  it("shuffles within the selected mood", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    render(<FitOnRecommendation workouts={workouts} />);

    expect(screen.getByText(/Sleepy A/i)).toBeInTheDocument();

    randomSpy.mockReturnValue(0.9);
    fireEvent.click(screen.getByRole("button", { name: /Shuffle/i }));

    expect(screen.getByText(/Sleepy B/i)).toBeInTheDocument();
  });

  it("returns null when no workouts are available", () => {
    const { container } = render(<FitOnRecommendation workouts={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
