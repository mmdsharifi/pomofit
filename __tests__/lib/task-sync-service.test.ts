import { renderHook, act } from "@testing-library/react";
import * as taskSync from "../../lib/task-sync-service";

jest.mock("../../lib/supabase-client", () => ({ createClient: jest.fn() }));
jest.mock("../../lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "user1" } }),
}));
jest.mock("../../lib/supabase-utils", () => ({
  isSupabaseConfigured: () => true,
}));
const mockAddToSyncQueue = jest.fn();
jest.mock("../../lib/sync-utils", () => ({
  useSyncQueue: () => ({ addToSyncQueue: mockAddToSyncQueue }),
  useOnlineStatus: () => true,
}));
jest.mock("../../components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

const mockTask = {
  id: "1",
  title: "Test Task",
  completed: false,
  order: 1,
  createdAt: new Date(),
  pomodoros: 0,
};

describe("useTaskSync", () => {
  beforeEach(() => {
    mockAddToSyncQueue.mockClear();
  });

  it("addTask calls addToSyncQueue with correct data", () => {
    const { result } = renderHook(() => taskSync.useTaskSync());
    act(() => {
      result.current.addTask(mockTask);
    });
    expect(mockAddToSyncQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "tasks",
        operation: "insert",
        data: expect.objectContaining({ id: mockTask.id, user_id: "user1" }),
      })
    );
  });

  it("updateTask calls addToSyncQueue with update op", () => {
    const { result } = renderHook(() => taskSync.useTaskSync());
    act(() => {
      result.current.updateTask(mockTask);
    });
    expect(mockAddToSyncQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "tasks",
        operation: "update",
        data: expect.objectContaining({ id: mockTask.id }),
      })
    );
  });

  it("deleteTask calls addToSyncQueue with delete op", () => {
    const { result } = renderHook(() => taskSync.useTaskSync());
    act(() => {
      result.current.deleteTask("1");
    });
    expect(mockAddToSyncQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "tasks",
        operation: "delete",
        data: { id: "1" },
      })
    );
  });

  it("addTask does nothing if no user", () => {
    jest
      .spyOn(require("../../lib/auth-context"), "useAuth")
      .mockReturnValue({ user: null });
    const { result } = renderHook(() => taskSync.useTaskSync());
    act(() => {
      result.current.addTask(mockTask);
    });
    expect(mockAddToSyncQueue).not.toHaveBeenCalled();
  });
});
