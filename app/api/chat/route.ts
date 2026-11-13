
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabase } from "@/lib/supabase";

const COOKIE_NAME = "guest_questions";
const GUEST_LIMIT = 3;

function createSignature(count: number, secret: string) {
  return createHmac("sha256", secret)
    .update(String(count))
    .digest("hex");
}

function getGuestCount(
  value: string | undefined,
  secret: string
) {
  if (!value) return 0;

  const [countText, signature] = value.split(".");

  console.log(countText,signature,"countText,signature>>>>>")
  const count = Number(countText);

  if (
    !Number.isInteger(count) ||
    count < 0 ||
    count > GUEST_LIMIT ||
    !signature
  ) {
    return 0;
  }

  const expectedSignature = createSignature(count, secret);

  console.log(signature,expectedSignature,"signature,expectedSignature>>>>>")

  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  console.log(actualBuffer,expectedBuffer,"actualBuffer,expectedBuffer>>>>>")

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return 0;
  }
  console.log(count,"count>>>>>")

  return count;
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const session = await auth();
    console.log("SESSION DATA:", session);
console.log("IS USER LOGGED IN:", !!session);
    const cookieStore = await cookies();

// cookieStore.delete("guest_questions");
// console.log(cookieStore,"cookieStore>>>>>")

    let currentCount = 0;
    const secret = process.env.AUTH_SECRET;

    // Guest question limit check
    if (!session) {
      if (!secret) {
        return Response.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      currentCount = getGuestCount(
        cookieStore.get(COOKIE_NAME)?.value,
        secret
      );

      if (currentCount >= GUEST_LIMIT) {
        return Response.json(
          {
            error: "LOGIN_REQUIRED",
            message: "Please login to continue",
          },
          { status: 401 }
        );
      }
    }

    // OpenRouter API request
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
          stream: false,
        }),
        signal: request.signal,
      }
    );

    // Handle API errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      return Response.json(
        {
          error: error.error?.message || "OpenRouter API Error",
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log(data,"data>>>>>")

    const aiMessage = data.choices?.[0]?.message?.content;
    console.log(aiMessage,"aiMessage>>>>>")

    if (typeof aiMessage !== "string") {
      return Response.json(
        { error: "Invalid AI response" },
        { status: 500 }
      );
    }

    // Save logged-in user's question
if (session?.user?.email) {
  const result = await supabase
    .from("chat_questions")
    .insert({
      user_email: session.user.email,
      question: message,
    });

const questionSaveError = result.error;
  if (questionSaveError) {
    console.error("Question save error:", questionSaveError);
  }
}

    // Update guest question count
    if (!session) {
      const nextCount = currentCount + 1;
      const signature = createSignature(nextCount, secret!);

      cookieStore.set(
        COOKIE_NAME,
        `${nextCount}.${signature}`,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
        }
      );
    }

    // Send AI answer to frontend
    return Response.json({
      reply: aiMessage,
    });

  } catch (error) {
    console.error("Chat API Error:", error);

    return Response.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
