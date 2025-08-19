export async function chatAnthropic({ system, user, model, temperature = 0.2, }) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key)
        throw new Error("Missing ANTHROPIC_API_KEY");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            model,
            temperature,
            system,
            messages: [{ role: "user", content: user }],
            max_tokens: 4000,
        }),
    });
    if (!res.ok)
        throw new Error(`${res.status}: ${await res.text()}`);
    const json = await res.json();
    const text = json?.content?.[0]?.text || "";
    return text;
}
