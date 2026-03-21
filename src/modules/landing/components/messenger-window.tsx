"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { Input, Textarea } from "@/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared";

import { LiquidGlass } from ".";

interface MessengerWindowProps {
  onClose: () => void;
}

// TODO: Replace with real AI chat integration (e.g. OpenAI / Anthropic API)
function ChatTab() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Hi! I'm an AI assistant. Feel free to ask me anything about this portfolio.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [
      ...prev,
      userMessage,
      // TODO: Replace this placeholder with actual AI API call
      {
        role: "assistant",
        content:
          "Thanks for your message! AI responses are not yet connected — TODO: wire up AI API.",
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user" ? "bg-cyan-500/30 text-white" : "bg-white/10 text-white/80"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-white/10 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-500/50"
        />
        <button
          onClick={handleSend}
          className="rounded-xl bg-cyan-500/30 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/40"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// TODO: Connect to a real email sending service (e.g. Resend, EmailJS, or backend API)
function ContactTab() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
          <span className="text-xl text-green-400">✓</span>
        </div>
        <p className="font-medium text-white">Message sent!</p>
        <p className="text-sm text-white/50">
          {/* TODO: Note - this is UI only. Wire up email API to actually send messages */}
          I&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: Connect to email sending API (Resend / EmailJS / backend endpoint)
        setSubmitted(true);
      }}
      className="space-y-3"
    >
      <Input
        label="Name"
        placeholder="Your name"
        inputWrapperClassName="bg-white/5 border-white/10 rounded-xl"
        labelWrapperClassName="text-white/50"
        className="text-white/50"
        size="sm"
      />
      <Input
        label="Email"
        placeholder="your@email.com"
        inputWrapperClassName="bg-white/5 border-white/10 rounded-xl"
        labelWrapperClassName="text-white/50"
        className="text-white/50"
        size="sm"
        type="email"
      />
      <Textarea
        label="Message"
        placeholder="Your message..."
        textareaWrapperClassName="bg-white/5 border-white/10 rounded-xl"
        labelWrapperClassName="text-white/50"
        className="text-white/50"
        size="sm"
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-cyan-500/30 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/40"
      >
        Send Message
      </button>
    </form>
  );
}

export function MessengerWindow({ onClose }: MessengerWindowProps) {
  return (
    <motion.div
      layoutId="messenger-container"
      className="fixed right-6 bottom-6 z-50 h-[500px] w-[350px]"
    >
      <LiquidGlass
        blur="xl"
        glow
        className="flex h-full w-full flex-col overflow-hidden bg-black/60"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <h3 className="font-semibold text-white">Send message</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            aria-label="Close chatbox"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-full shrink-0 rounded-none border-b border-white/10 bg-transparent">
            <TabsTrigger
              value="chat"
              className="flex-1 text-white/60 data-[state=active]:text-white"
            >
              Chat AI
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="flex-1 text-white/60 data-[state=active]:text-white"
            >
              Email Me
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="m-0 flex h-[calc(500px-130px)] flex-col">
            <ChatTab />
          </TabsContent>

          <TabsContent
            value="contact"
            className="m-0 h-[calc(500px-130px)] overflow-auto overscroll-contain p-4"
          >
            <ContactTab />
          </TabsContent>
        </Tabs>
      </LiquidGlass>
    </motion.div>
  );
}
