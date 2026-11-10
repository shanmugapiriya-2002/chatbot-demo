export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
          stream: true,
        }),
        // If the user closes the tab, stop the OpenRouter request too
        signal: request.signal,
      }
    );

    // Errors before streaming starts come back as normal JSON
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      return Response.json(
        {
          error: error.error?.message || "OpenRouter API Error",
        },
        { status: response.status }
      );
    }

    if (!response.body) {
      return Response.json(
        { error: "Stream not available" },
        { status: 500 }
      );
    }

    // OpenRouter sends Server-Sent Events (SSE):
    //   data: {"choices":[{"delta":{"content":"Hel"}}]}
    //   data: {"choices":[{"delta":{"content":"lo"}}]}
    //   : OPENROUTER PROCESSING      <- comment, ignore
    //   data: [DONE]
    // We parse those lines here and send ONLY the text to the browser.
    const upstream = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await upstream.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // A network chunk can end in the middle of a line,
            // so only process complete lines and keep the rest.
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const rawLine of lines) {
              const line = rawLine.trim();

              // Skip empty lines and SSE comments
              if (!line.startsWith("data:")) continue;

              const data = line.slice(5).trim();
              if (data === "[DONE]") {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);

                // Error that happens in the middle of the stream
                if (parsed.error) {
                  controller.enqueue(
                    encoder.encode(
                      `\n\n⚠️ ${parsed.error.message || "Stream error"}`
                    )
                  );
                  controller.close();
                  return;
                }

                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // Ignore malformed JSON lines
              }
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
      cancel() {
        upstream.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    return Response.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
