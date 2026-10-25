export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { sessionSecret } = await import("./lib/session-security");
    sessionSecret();
  }
}
