
"use client";

import "./ChatWindow.scss";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, UserRound, Send } from "lucide-react";
import LogoutButton from "../LogoutButton/LogoutButton";
import GoogleLogin from "../GoogleLogin/GoogleLogin";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWindow() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  console.log(showLoginPopup,"showLoginPopup>>>>>")
  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message;

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      // Handle API errors
      if (!response.ok) {
  const data = await response.json().catch(() => ({}));

  console.log("API STATUS:", response.status);
  console.log("API RESPONSE:", data);

  if (data.error === "LOGIN_REQUIRED") {
    console.log("LOGIN REQUIRED - SHOW POPUP");

    setShowLoginPopup(true);
    return;
  }

  throw new Error(data.error || "Something went wrong");
}

      const data = await response.json();

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);

    } catch (error) {
      console.error("OpenRouter API Error:", error);

      const errorText =
        "Sorry, something went wrong. Please try again.";

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: errorText,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const lastMessage = messages[messages.length - 1];

  const showTyping =
    loading &&
    !(lastMessage?.role === "assistant" && lastMessage.content);

  return (
    <div className="chat-page">
      <div className="chat-window">

        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-title">
            <Bot size={24} />
            <h2>ChatBot</h2>
          </div>

          <div className="chat-header-actions">
            <span className="online-status"></span>
            <LogoutButton />
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages">

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.role === "user" ? "user" : "bot"
              }`}
            >

              {/* AI Icon */}
              {msg.role === "assistant" && (
                <div className="message-icon">
                  <Bot size={20} />
                </div>
              )}

              {/* Message Content */}
              <div
                className={`message-content ${
                  msg.role === "assistant"
                    ? "assistant-message"
                    : ""
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>

              {/* User Icon */}
              {msg.role === "user" && (
                <div className="message-icon">
                  <UserRound size={20} />
                </div>
              )}

            </div>
          ))}

          {/* AI Loading Animation */}
          {showTyping && (
            <div className="message bot">
              <div className="message-icon">
                <Bot size={20} />
              </div>

              <div className="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

        </div>

        {/* Chat Input */}
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />

          <button
            aria-label="Send message"
            onClick={handleSend}
            disabled={loading || !message.trim()}
          >
            <Send size={20} />
          </button>
        </div>

        {/* Login Popup */}
        {showLoginPopup && (
          <div
            className="login-popup-overlay"
            onClick={() => setShowLoginPopup(false)}
          >
            <div
              className="login-popup"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="popup-close"
                onClick={() => setShowLoginPopup(false)}
              >
                ×
              </button>

              <h2>Please Login to Continue</h2>

              <p>
                You have used your 3 free questions.
                Please login to continue chatting.
              </p>

              <GoogleLogin />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
