import { readError } from "./api";

test("readError returns the backend's error message", async () => {
    const response = new Response(JSON.stringify({ error: "Prompt is required" }));
    expect(await readError(response, "fallback")).toBe("Prompt is required");
});

test("readError falls back when the body has no error", async () => {
    expect(await readError(new Response("{}"), "fallback")).toBe("fallback");
});

test("readError falls back when the body isn't JSON", async () => {
    expect(await readError(new Response("<html>"), "fallback")).toBe("fallback");
});
