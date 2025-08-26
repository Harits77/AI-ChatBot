import { useState, useRef, useEffect } from "react";

export default function DeepSeekChatbot() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const message = inputMessage.trim();
    if (!message || isLoading) return;
    const newUserMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage("");
    setIsLoading(true);
    const body = {
      session_id: sessionId,
      messages: [{ role: "user", content: message }],
    };
    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.session_id);
        const botMessage = { role: "bot", content: data.reply };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const errorMessage = {
          role: "error",
          content: `Error: ${data.detail || "Something went wrong"}`,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = {
        role: "error",
        content: "Request failed! Please check your connection.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === "user";
    const isError = message.role === "error";
    return (
      <div className={`flex items-start gap-3 mb-4 ${isUser || isError ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500' : isError ? 'bg-red-500' : 'bg-gradient-to-br from-purple-400 to-pink-400'}`}>
          {isUser ? (
            <span className="text-white text-base font-bold">👤</span>
          ) : isError ? (
            <span className="text-white text-base font-bold">!</span>
          ) : (
            <span className="text-white text-base font-bold">🤖</span>
          )}
        </div>
        <div className={`max-w-[75%] p-3 rounded-2xl ${isUser ? 'bg-blue-500 text-white rounded-br-sm' : isError ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'}`}>
          <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="max-w-[900px] mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-700">DeepSeek Bot</h1>
              <p className="text-sm text-gray-500">
                {sessionId
                  ? `Session: ${sessionId.slice(-8)}`
                  : "New conversation"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Online</span>
            </div>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to DeepSeek Bot!</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Start a conversation by typing your message below. I'm here to
                help with any questions you have.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                <span className="text-white text-base font-bold">🤖</span>
              </div>
              <div className="max-w-[75%] p-3 rounded-2xl bg-gray-100 text-gray-700 rounded-bl-sm">
                <div className="flex items-center gap-2">
                  <div className="w-[18px] h-[18px] border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[0.95rem] text-gray-500">DeepSeek is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none text-base transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none max-h-32"
                style={{ minHeight: "48px", height: "auto" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 128) + "px";
                }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full flex items-center justify-center text-base font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}