export type FitOnMoodId = "sleepy" | "energetic" | "stressed" | "calm" | "stiff";

export interface FitOnMood {
  id: FitOnMoodId;
  label: string;
  emoji: string;
  description: string;
}

export interface FitOnWorkout {
  id: string;
  mood: FitOnMoodId;
  emoji: string;
  title: string;
  minutes: number;
  type: string;
  url: string;
  note?: string;
}

export interface WorkoutSources {
  lottie: boolean;
  fiton: boolean;
}

export const defaultWorkoutSources: WorkoutSources = {
  lottie: true,
  fiton: true,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const baseFitOnWorkouts: Omit<FitOnWorkout, "id">[] = [
  {
    mood: "sleepy",
    emoji: "😴",
    title: "Standing Stretch",
    minutes: 2,
    type: "Stretch",
    url: "https://app.fitonapp.com/?r=browse/workout/256",
    note: "🌅 Quick standing stretch to wake up your whole body",
  },
  {
    mood: "sleepy",
    emoji: "😴",
    title: "Straighten Up",
    minutes: 3,
    type: "Stretch",
    url: "https://app.fitonapp.com/?r=browse/workout/262",
    note: "🦵 Open your hip flexors and realign your posture",
  },
  {
    mood: "sleepy",
    emoji: "😴",
    title: "Short Office Stretch",
    minutes: 4,
    type: "Stretch",
    url: "https://app.fitonapp.com/?r=browse/workout/164",
    note: "💺 Office-friendly stretch that hits legs through lower back",
  },
  {
    mood: "sleepy",
    emoji: "😴",
    title: "Rest Your Wrists",
    minutes: 3,
    type: "Stretch",
    url: "https://app.fitonapp.com/?r=browse/workout/151",
    note: "✋ Release the wrist tension that builds up after typing",
  },
  {
    mood: "sleepy",
    emoji: "😴",
    title: "Energizer Stretch",
    minutes: 6,
    type: "Stretch",
    url: "https://app.fitonapp.com/?r=browse/workout/408",
    note: "⚡ Dynamic flow to boost circulation and shake off drowsiness",
  },
  {
    mood: "sleepy",
    emoji: "😴",
    title: "Letting Go Meditation",
    minutes: 6,
    type: "Meditation",
    url: "https://app.fitonapp.com/?r=browse/workout/308",
    note: "🧘‍♀️ Guided release when your mind feels heavy",
  },
  {
    mood: "sleepy",
    emoji: "😴",
    title: "Self-Compassion Meditation",
    minutes: 8,
    type: "Meditation",
    url: "https://app.fitonapp.com/?r=browse/workout/590",
    note: "💖 Mindful pause to soften mental fatigue",
  },
  {
    mood: "sleepy",
    emoji: "😴",
    title: "Clarity Meditation",
    minutes: 10,
    type: "Meditation",
    url: "https://app.fitonapp.com/?r=browse/workout/329",
    note: "🎯 Clear your focus before jumping back into work",
  },
  {
    mood: "energetic",
    emoji: "💪",
    title: "Crunch Time",
    minutes: 10,
    type: "Core",
    url: "https://app.fitonapp.com/?r=browse/workout/520",
    note: "🔥 Equipment-free core blast to light up your abs",
  },
  {
    mood: "energetic",
    emoji: "💪",
    title: "Agility Blitz",
    minutes: 10,
    type: "Cardio",
    url: "https://app.fitonapp.com/?r=browse/workout/188",
    note: "🏃‍♂️ High-energy agility combo to burn off restlessness",
  },
  {
    mood: "stressed",
    emoji: "😡",
    title: "Fighting Fit",
    minutes: 10,
    type: "Cardio",
    url: "https://app.fitonapp.com/?r=browse/workout/132",
    note: "🥊 Kickboxing-inspired cardio to punch out stress",
  },
  {
    mood: "calm",
    emoji: "🧘",
    title: "Clarity Meditation",
    minutes: 10,
    type: "Meditation",
    url: "https://app.fitonapp.com/?r=browse/workout/329",
    note: "🧠 Deep-focus reset that glides you into flow",
  },
  {
    mood: "calm",
    emoji: "🧘",
    title: "Letting Go Meditation",
    minutes: 6,
    type: "Meditation",
    url: "https://app.fitonapp.com/?r=browse/workout/308",
    note: "🌬️ Empty your head between back-to-back tasks",
  },
  {
    mood: "stiff",
    emoji: "😕",
    title: "Standing Stretch",
    minutes: 2,
    type: "Stretch",
    url: "https://app.fitonapp.com/?r=browse/workout/256",
  },
  {
    mood: "stiff",
    emoji: "😕",
    title: "Straighten Up",
    minutes: 3,
    type: "Stretch",
    url: "https://app.fitonapp.com/?r=browse/workout/262",
  },
  {
    mood: "stiff",
    emoji: "😕",
    title: "Short Office Stretch",
    minutes: 4,
    type: "Stretch",
    url: "https://app.fitonapp.com/?r=browse/workout/164",
  },
];

export const defaultFitOnWorkouts: FitOnWorkout[] = baseFitOnWorkouts.map(
  (workout) => ({
    ...workout,
    id: `${workout.mood}-${slugify(workout.title)}`,
  })
);

export const fitOnMoods: FitOnMood[] = [
  {
    id: "sleepy",
    label: "Sleepy Recharge",
    emoji: "😴",
    description: "Gentle stretches and calm meditations to wake up softly.",
  },
  {
    id: "energetic",
    label: "Energetic Boost",
    emoji: "💪",
    description: "Quick hits to burn excess energy when you can't sit still.",
  },
  {
    id: "stressed",
    label: "Stress Release",
    emoji: "😡",
    description: "Cardio-focused flows to shake off tension fast.",
  },
  {
    id: "calm",
    label: "Deep Focus",
    emoji: "🧘",
    description: "Mindful resets that ease you into deep work mode.",
  },
  {
    id: "stiff",
    label: "Desk Reset",
    emoji: "😕",
    description: "Chair-friendly stretches for when your body feels locked.",
  },
];

export const ensureWorkoutSources = (
  sources?: Partial<WorkoutSources>
): WorkoutSources => ({
  lottie: sources?.lottie ?? true,
  fiton: sources?.fiton ?? true,
});
