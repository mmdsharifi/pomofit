import * as supabaseClient from "../../lib/supabase-client";

describe("supabase-client", () => {
  it("calls logOfflineMode and returns offline client", () => {
    const logSpy = jest
      .spyOn(require("../../lib/offline-mode"), "logOfflineMode")
      .mockImplementation(() => {});
    const offlineClient = { test: true };
    jest
      .spyOn(require("../../lib/offline-mode"), "createOfflineClient")
      .mockReturnValue(offlineClient);
    const client = supabaseClient.createClient();
    expect(logSpy).toHaveBeenCalledWith("Creating Supabase client");
    expect(client).toBe(offlineClient);
    logSpy.mockRestore();
  });
});
