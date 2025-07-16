import * as offline from "../../lib/offline-mode";

describe("offline-mode", () => {
  it("OFFLINE_MODE is true", () => {
    expect(offline.OFFLINE_MODE).toBe(true);
  });

  it("createOfflineClient returns mock client with expected methods", async () => {
    const client = offline.createOfflineClient();
    expect(client).toHaveProperty("auth");
    expect(client).toHaveProperty("from");
    // Test auth methods
    await expect(client.auth.getSession()).resolves.toEqual({
      data: { session: null },
      error: null,
    });
    expect(typeof client.auth.onAuthStateChange).toBe("function");
    await expect(client.auth.signUp()).resolves.toEqual({
      data: null,
      error: expect.any(Error),
    });
    await expect(client.auth.signInWithPassword()).resolves.toEqual({
      data: null,
      error: expect.any(Error),
    });
    await expect(client.auth.signOut()).resolves.toEqual({ error: null });
    // Test from methods
    const from = client.from();
    await expect(from.select().eq().order()).resolves.toEqual({
      data: [],
      error: null,
    });
    await expect(from.select().eq().single()).resolves.toEqual({
      data: null,
      error: null,
    });
    await expect(from.select().order()).resolves.toEqual({
      data: [],
      error: null,
    });
    await expect(from.insert()).resolves.toEqual({ data: null, error: null });
    await expect(from.update().eq()).resolves.toEqual({
      data: null,
      error: null,
    });
    await expect(from.delete().eq()).resolves.toEqual({
      data: null,
      error: null,
    });
  });

  it("logOfflineMode logs the correct message", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    offline.logOfflineMode("test");
    expect(spy).toHaveBeenCalledWith(
      "[Offline Mode] test - Supabase integration is disabled"
    );
    spy.mockRestore();
  });
});
