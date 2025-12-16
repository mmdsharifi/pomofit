/**
 * Motivational messages for rest periods
 */
export const REST_MOTIVATIONAL_MESSAGES = [
  "Great job! 🌟 Take a moment to stretch and recharge.",
  "Well done! 🧘‍♀️ Time for a quick break to refresh your mind.",
  "Awesome work! 💪 Stand up and move around a bit.",
  "Nice focus session! 👁️ Give your eyes a rest from the screen.",
  "You're making progress! 💧 Take this time to hydrate.",
  "Excellent work! ⏱️ A short break helps maintain productivity.",
  "You're crushing it! 🧠 Enjoy this moment to breathe and reset.",
  "Fantastic session! 🌈 Use this break to clear your mind.",
  "Solid work! 🔋 Take a moment to relax and recharge.",
  "Great progress! 🎯 A quick break will help you stay focused.",
  "Time to stretch! 🤸‍♂️ Try touching your toes or reaching for the sky.",
  "Break time! 💦 Remember to stay hydrated for optimal brain function.",
  "Pomodoro complete! 🍅 How about a quick workout during this break?",
  "Focus session done! 🌿 Take a deep breath and enjoy this moment.",
  "Nice work! 👏 Your brain deserves this short rest period.",
  "Time to recharge! 🔄 Maybe do a few jumping jacks to get the blood flowing?",
  "Great session! 🧩 Let your mind wander freely during this break.",
  "Well done! 🚶‍♀️ A short walk around the room can boost your creativity.",
  "Break time! 👀 Try the 20-20-20 rule: look at something 20 feet away for 20 seconds.",
  "Excellent focus! 🌊 Use this break to reset your mental state.",
  "Session complete! 🎵 Maybe listen to a quick tune to refresh?",
  "Time to pause! 🧘‍♂️ Try a quick mindfulness exercise during this break.",
  "Good job! 💆‍♀️ Roll your shoulders and stretch your neck.",
  "Break time! 🌱 Each rest period helps grow your productivity.",
  "Focus complete! 🏋️‍♀️ How about a few push-ups or squats?",
] as const;

/**
 * Get a random motivational message
 */
export function getRandomMotivationalMessage(): string {
  const randomIndex = Math.floor(Math.random() * REST_MOTIVATIONAL_MESSAGES.length);
  return REST_MOTIVATIONAL_MESSAGES[randomIndex];
}

/**
 * Get today's date as a string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
