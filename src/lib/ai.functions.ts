import { createServerFn } from "@tanstack/react-start";

type Suggestion = { medicine: string; suggestedQty: number; urgency: "High" | "Medium" | "Low"; reason: string };

export const recommendRestock = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input as { stock: Array<{ name: string; qty: number; reorderPoint: number; soldLast30: number; price: number; expiry: string }> })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const lines = data.stock
      .map((item) => `${item.name}: on hand ${item.qty}, reorder point ${item.reorderPoint}, sold last 30 days ${item.soldLast30}, price $${item.price}, expiry ${item.expiry}`)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `You are a pharmacy inventory analyst. Using the stock and sales data below, pick the 5 medicines most urgently needing restock and give a suggested order quantity covering about 45 days of demand. Be concise.\n\n${lines}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "restock_suggestions",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["suggestions"],
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["medicine", "suggestedQty", "urgency", "reason"],
                    properties: {
                      medicine: { type: "string" },
                      suggestedQty: { type: "number" },
                      urgency: { type: "string", enum: ["High", "Medium", "Low"] },
                      reason: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      if (res.status === 402) throw new Error("AI credits are used up. Add credits to keep using recommendations.");
      if (res.status === 429) throw new Error("Too many requests right now. Try again in a moment.");
      throw new Error(`Recommendations unavailable (${res.status}). ${detail.slice(0, 160)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.split("\n").find((entry) => entry.startsWith("data: "));
        if (!line) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") text += event.delta;
          if (event.type === "response.completed" && typeof event.response?.output_text === "string" && !text) text = event.response.output_text;
        } catch {
          // ignore keepalive / non-JSON frames
        }
      }
    }

    try {
      const parsed = JSON.parse(text) as { suggestions: Suggestion[] };
      return { suggestions: parsed.suggestions ?? [] };
    } catch {
      throw new Error("Could not read the AI response. Please try again.");
    }
  });
