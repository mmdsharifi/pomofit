const CHUNK_FLAG = "__pomofitChunkRetry";
const MATCHERS = ["ChunkLoadError", "loading chunk", "missing chunk"];

const isChunkError = (error: unknown) => {
  if (!error) return false;
  const message = (error as Error)?.message || String(error);
  const name = (error as Error)?.name || "";
  return (
    name === "ChunkLoadError" ||
    MATCHERS.some((matcher) => message.toLowerCase().includes(matcher.toLowerCase()))
  );
};

export function withChunkReload<T>(importer: () => Promise<T>) {
  return importer().catch((error) => {
    if (typeof window !== "undefined" && isChunkError(error)) {
      const flag = window.sessionStorage.getItem(CHUNK_FLAG);
      if (!flag) {
        window.sessionStorage.setItem(CHUNK_FLAG, "1");
        window.location.reload();
      } else {
        window.sessionStorage.removeItem(CHUNK_FLAG);
      }
    }
    throw error;
  });
}
