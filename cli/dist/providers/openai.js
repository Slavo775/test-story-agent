export async function chatOpenAI({ system, user, model, baseUrl = "https://api.openai.com/v1", temperature = 0.2, }) {
    const key = process.env.OPENAI_API_KEY;
    if (!key)
        throw new Error("Missing OPENAI_API_KEY");
    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            temperature,
            messages: [
                { role: "system", content: system },
                { role: "user", content: user },
            ],
            response_format: { type: "json_object" },
        }),
    });
    if (!res.ok)
        throw new Error(`${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content || "";
}
