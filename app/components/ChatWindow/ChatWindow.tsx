
// "use client";

// import "./ChatWindow.scss";
// import { useState } from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import { Bot, UserRound, Send, Hand } from "lucide-react";

// // Message type
// type Message = {
//   role: "user" | "assistant";
//   content: string;
// };

// export default function ChatWindow() {
//   const [message, setMessage] = useState("");
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [loading, setLoading] = useState(false);

//   const handleSend = async () => {
//     if (!message.trim() || loading) return;

//     const userMessage = message;

//     // Add user message
//     setMessages((prevMessages) => [
//       ...prevMessages,
//       {
//         role: "user",
//         content: userMessage,
//       },
//     ]);

//     setMessage("");
//     setLoading(true);

//     try {
//       const response = await fetch("/api/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           message: userMessage,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Something went wrong");
//       }

//       // Add AI response
//       if (data.reply) {
//         setMessages((prevMessages) => [
//           ...prevMessages,
//           {
//             role: "assistant",
//             content: data.reply,
//           },
//         ]);
//       }
//     } catch (error) {
//       console.error("OpenRouter API Error:", error);

//       setMessages((prevMessages) => [
//         ...prevMessages,
//         {
//           role: "assistant",
//           content: "Sorry, something went wrong. Please try again.",
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="chat-window">

//       {/* Chat Header */}
//       <div className="chat-header">
//         <div className="chat-title">
//           <Bot size={24} />
//           <h2>ChatBot</h2>
//         </div>

//         <span className="online-status"></span>
//       </div>

//       {/* Chat Messages */}
//       <div className="chat-messages">
//         {/* User and AI Messages */}
//         {messages.map((message, index) => (
//           <div
//             key={index}
//             className={
//               message.role === "user"
//                 ? "user-message"
//                 : "assistant-message"
//             }
//           >
//             {message.role === "assistant" ? (
//               <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                 {message.content}
//               </ReactMarkdown>
//             ) : (
//               message.content
//             )}
//           </div>
//         ))}

//         {/* AI Loading Animation */}
//         {loading && (
//           <div className="message bot">
//             <div className="message-icon">
//               <Bot size={20} />
//             </div>

//             <div className="message-content typing-indicator">
//               <span></span>
//               <span></span>
//               <span></span>
//             </div>
//           </div>
//         )}

//       </div>

//       {/* Chat Input */}
//       <div className="chat-input">

//         <input
//           type="text"
//           placeholder="Type your message..."
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") handleSend();
//           }}
//         />

//         <button
//           aria-label="Send message"
//           onClick={handleSend}
//           disabled={loading || !message.trim()}
//         >
//           <Send size={20} />
//         </button>

//       </div>

//     </div>
//   );
// }



"use client";

import "./ChatWindow.scss";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, UserRound, Send } from "lucide-react";
import LogoutButton from "../LogoutButton/LogoutButton";

// Message type
type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWindow() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

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

      // Errors (before streaming) still come back as JSON
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      // Add an empty assistant message that we fill as text arrives
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "" },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        // Append the new text to the last (assistant) message
        setMessages((prevMessages) => {
          const updated = [...prevMessages];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + chunk,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("OpenRouter API Error:", error);

      const errorText = "Sorry, something went wrong. Please try again.";

      setMessages((prevMessages) => {
        const last = prevMessages[prevMessages.length - 1];

        // Stream broke midway: keep the partial answer, add a note
        if (last?.role === "assistant") {
          const updated = [...prevMessages];
          updated[updated.length - 1] = {
            ...last,
            content: last.content
              ? `${last.content}\n\n⚠️ ${errorText}`
              : errorText,
          };
          return updated;
        }

        return [...prevMessages, { role: "assistant", content: errorText }];
      });
    } finally {
      setLoading(false);
    }
  };

  // While loading, show typing dots until the assistant bubble has text
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
            // Skip the empty assistant bubble while waiting for the first words
            msg.role === "assistant" && !msg.content ? null : (
            <div
              key={index}
              className={`message ${
                msg.role === "user" ? "user" : "bot"
              }`}
            >

              {/* AI Icon - Left Side */}
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

              {/* User Icon - Right Side */}
              {msg.role === "user" && (
                <div className="message-icon">
                  <UserRound size={20} />
                </div>
              )}

            </div>
            )
          ))}

          {/* AI Loading Animation - only until the first words arrive */}
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

      </div>
    </div>
  );
}
