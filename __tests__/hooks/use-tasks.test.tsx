import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useTasks } from "../../lib/task-context";
import { TaskProvider } from "../../lib/task-context";
import { AuthProvider } from "../../lib/auth-context";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <TaskProvider>{children}</TaskProvider>
  </AuthProvider>
);

describe("useTasks Hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("initializes with empty tasks array", () => {
    const { result } = renderHook(() => useTasks(), { wrapper });

    expect(result.current.tasks).toEqual([]);
  });

  test("adds a task correctly", () => {
    const { result } = renderHook(() => useTasks(), { wrapper });

    act(() => {
      result.current.addTask("Test task");
    });

    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].title).toBe("Test task");
    expect(result.current.tasks[0].completed).toBe(false);
  });

  test("toggles task completion correctly", () => {
    const { result } = renderHook(() => useTasks(), { wrapper });

    act(() => {
      result.current.addTask("Test task");
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.toggleTask(taskId);
    });

    expect(result.current.tasks[0].completed).toBe(true);

    act(() => {
      result.current.toggleTask(taskId);
    });

    expect(result.current.tasks[0].completed).toBe(false);
  });

  test("deletes a task correctly", () => {
    const { result } = renderHook(() => useTasks(), { wrapper });

    act(() => {
      result.current.addTask("Test task");
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.removeTask(taskId);
    });

    expect(result.current.tasks.length).toBe(0);
  });

  test("updates a task correctly", () => {
    const { result } = renderHook(() => useTasks(), { wrapper });

    act(() => {
      result.current.addTask("Test task");
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.updateTask(taskId, { title: "Updated task" });
    });

    expect(result.current.tasks[0].title).toBe("Updated task");
  });

  test("persists tasks to localStorage", () => {
    const { result, rerender } = renderHook(() => useTasks(), { wrapper });

    act(() => {
      result.current.addTask("Test task");
    });

    // Simulate component unmount and remount
    rerender();

    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].title).toBe("Test task");
  });
});
