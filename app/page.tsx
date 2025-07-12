import ClientWrapper from "./client-wrapper"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pomofit - Pomodoro Timer with Workouts",
  description: "Boost your productivity and fitness with Pomofit",
}

export default function Home() {
  return <ClientWrapper />
}
