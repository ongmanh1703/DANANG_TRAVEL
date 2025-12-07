"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

// ----- THÊM: key lưu trữ & hàm lấy user hiện tại -----
const CHAT_STORAGE_KEY = "danangTravelChat";
const CHAT_USER_KEY = "danangTravelChatUser";

const getCurrentUserId = (): string => {
  try {
    const raw = localStorage.getItem("user"); // tuỳ app, bạn đang lưu user ở key này
    if (!raw) return "guest";
    const u = JSON.parse(raw);
    return (
      u?._id ||
      u?.id ||
      u?.email ||
      u?.username ||
      "guest"
    ).toString();
  } catch {
    return "guest";
  }
};
// ------------------------------------------------------

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);

  // userId hiện tại (dùng cho logic reset chat theo tài khoản)
  const [currentUserId] = useState<string>(() => {
    if (typeof window === "undefined") return "guest";
    return getCurrentUserId();
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const userId = getCurrentUserId();
      const lastUserId = localStorage.getItem(CHAT_USER_KEY);

      // Nếu lịch sử chat thuộc user khác => xoá lịch sử cũ
      if (lastUserId && lastUserId !== userId) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }

      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved, (key, value) =>
          key === "timestamp" ? new Date(value) : value
        );
      }
    } catch {
      // ignore
    }

    // lịch sử mặc định khi chưa có gì
    return [
      {
        id: "1",
        type: "bot",
        content:
          "Xin chào! Tôi là **Trợ lý Du lịch Đà Nẵng**.\n\n" +
          "Tôi có thể giúp bạn:\n" +
          "• Gợi ý địa điểm đẹp: Bà Nà, Ngũ Hành Sơn, Hội An...\n" +
          "• Lịch trình du lịch 1-3 ngày\n" +
          "• Ẩm thực đặc sản: Mì Quảng, bánh tráng cuốn thịt heo\n" +
          "• Phương tiện di chuyển, khách sạn giá tốt\n" +
          "• Thời tiết, lễ hội, tips tiết kiệm\n\n" +
          "Bạn muốn khám phá điều gì hôm nay?",
        timestamp: new Date(),
      },
    ];
  });

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // GỢI Ý CÂU HỎI NHANH
  const quickQuestions = [
    "Gợi ý lịch trình 3 ngày ở Đà Nẵng",
    "Những món ăn đặc sản nhất định phải thử ở Đà Nẵng?",
    "Ở Đà Nẵng nên ở khu nào cho tiện đi chơi?",
    "Thời tiết Đà Nẵng tháng này đi biển ổn không?",
    "Từ Đà Nẵng đi Hội An thì di chuyển như thế nào?",
  ];

  // THÊM: trạng thái hiển thị gợi ý
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Gemini AI
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  const [modelName, setModelName] = useState<string>("gemini-1.5-flash");

  // Kiểm tra model mới nhất
  useEffect(() => {
    const checkModels = async () => {
      if (!genAI) return;
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();
        const models = data.models || [];

        const preferred = [
          "gemini-2.5-flash",
          "gemini-1.5-pro",
          "gemini-1.5-flash",
          "gemini-pro",
        ].find((name) => models.some((m: any) => m.name.includes(name)));

        if (preferred) {
          const fullName =
            models.find((m: any) => m.name.includes(preferred))?.name ||
            "gemini-1.5-flash";
          setModelName(fullName.split(":")[0]);
        }
      } catch (error) {
        console.warn("Không thể lấy danh sách model, dùng mặc định:", error);
      }
    };
    checkModels();
  }, [genAI, apiKey]);

  // Lưu tin nhắn THEO USER
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_USER_KEY, currentUserId);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, currentUserId]);

  // TỰ ĐỘNG CUỘN XUỐNG CUỐI
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isTyping, isOpen]);

  // TỰ ĐỘNG FOCUS INPUT KHI MỞ CHAT
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // nhận thêm tham số text dùng cho câu hỏi gợi ý
  const handleSendMessage = async (text?: string) => {
    const content = (text ?? inputValue).trim();
    if (!content || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!text) setInputValue(""); // nếu gõ tay thì clear input

    setIsTyping(true);

    try {
      if (!genAI) throw new Error("Thiếu VITE_GEMINI_API_KEY");

      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      });

      const history = messages
        .slice(-6)
        .map((m) => `${m.type === "user" ? "Khách" : "Trợ lý"}: ${m.content}`)
        .join("\n");

      const prompt = `
Bạn là **Trợ lý Du lịch Đà Nẵng**, trả lời bằng **tiếng Việt**, **ngắn gọn, thân thiện, hấp dẫn**, dùng emoji phù hợp. 
Chủ đề chính: Du lịch Đà Nẵng, Hội An, Huế, Bà Nà, ẩm thực, di chuyển, thời tiết, khách sạn, lịch trình.

- Dùng định dạng: **in đậm**, *nghiêng*, danh sách • nếu cần
- Gợi ý cụ thể: tên quán, giá tham khảo, giờ mở cửa, cách đi
- Nếu hỏi thời tiết: trả lời theo mùa (hiện tại là ${new Date().toLocaleString(
        "vi-VN",
        { month: "long", year: "numeric" }
      )})
- Nếu hỏi lịch trình: gợi ý 1-3 ngày hợp lý
- Nếu không biết: nói "Mình chưa rõ, bạn có thể hỏi thêm nhé!"

Lịch sử:
${history}

Câu hỏi: ${userMessage.content}
`;

      let responseText = "";
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          const result = await model.generateContent(prompt);
          responseText = (await result.response.text()).trim();
          break;
        } catch (error: any) {
          if (retryCount === maxRetries) throw error;
          retryCount++;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          responseText || "Xin lỗi, mình chưa hiểu. Bạn có thể hỏi lại không?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Lỗi AI:", error);
      const errMsg = error.message.includes("API key")
        ? "Hệ thống AI tạm thời không khả dụng."
        : "Mình đang gặp lỗi nhỏ, thử lại nhé!";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: errMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Nút nổi */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="rounded-full w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all"
            >
              <MessageCircle className="h-7 w-7" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cửa sổ chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-4 w-[420px] h-[560px] z-50"
          >
            <Card className="h-full flex flex-col shadow-2xl border-0 overflow-hidden">
              <CardHeader className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text_base font-bold">
                    <Bot className="mr-2 h-5 w-5" />
                    Trợ lý Du lịch Đà Nẵng
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 px-4 pt-4">
                  <div className="space-y-4 pr-6">
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`flex items-start gap-2 pb-4 ${
                            msg.type === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {msg.type === "bot" && (
                            <Avatar className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500">
                              <AvatarFallback className="text-white">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                              msg.type === "user"
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {msg.content}
                          </div>

                          {msg.type === "user" && (
                            <Avatar className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-500">
                              <AvatarFallback className="text-white">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </motion.div>
                      ))}

                      {/* Typing indicator */}
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2"
                        >
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500">
                            <AvatarFallback className="text-white">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted px-3 py-2 rounded-xl">
                            <div className="flex gap-1">
                              <div
                                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              />
                              <div
                                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              />
                              <div
                                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Điểm cuộn xuống cuối */}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                {/* GỢI Ý CÂU HỎI NHANH – CHỈ HIỆN TRƯỚC KHI NHẤN LẦN ĐẦU */}
                {showSuggestions && (
                  <div className="px-3 pb-2 pt-1 flex flex-wrap gap-2">
                    {quickQuestions.map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        className="text-xs rounded-full"
                        disabled={isTyping}
                        onClick={() => {
                          // ẩn toàn bộ gợi ý ngay khi click câu đầu tiên
                          setShowSuggestions(false);
                          handleSendMessage(q);
                        }}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Hỏi về Đà Nẵng..."
                      className="flex-1 h-11 text-sm"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isTyping}
                      size="icon"
                      className="h-11 w-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
