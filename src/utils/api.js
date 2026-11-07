// Error bodies aren't always JSON (e.g. a Vercel timeout page), so fall back if parsing fails
export const readError = async (response, fallback) => {
    try {
        const data = await response.json();
        return data.error || fallback;
    } catch {
        return fallback;
    }
};
