"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import NavigationBar from "@/components/layout/navigation-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Loader2, Send } from "lucide-react";
import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  display: "swap",
  preload: true,
});

// --- TYPE DEFINITIONS ---
interface Message {
  id: string;
  sender: "user" | "bot" | "system";
  text?: string;
  product?: Product;
  imageUrl?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
}

// Gemini-specific type for chat history
type GeminiChatMessage = { role: 'user' | 'model'; parts: { text: string }[] };

// --- HELPER COMPONENTS ---
function LoaderIcon() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

// --- MAIN COMPONENT ---
export default function LandingPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "initial", sender: "bot", text: "Hello! Upload an image of a product or ask me anything." },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isCollectingInfo, setIsCollectingInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // This runs every time messages, activeProduct, or isCollectingInfo changes
    const chatState = {
      messages,
      activeProduct,
      isCollectingInfo,
    };
    localStorage.setItem('chatSession', JSON.stringify(chatState));
  }, [messages, activeProduct, isCollectingInfo]);

  useEffect(() => {
    // This runs only once on component mount
    const savedSession = localStorage.getItem('chatSession');
    if (savedSession) {
      try {
        const chatState = JSON.parse(savedSession);
        setMessages(chatState.messages || []);
        setActiveProduct(chatState.activeProduct || null);
        setIsCollectingInfo(chatState.isCollectingInfo || false);
      } catch (error) {
        console.error("Failed to parse chat session from localStorage", error);
      }
    }
  }, []); // Empty array ensures this runs only once

  // --- ORDER CREATION HANDLER (Button Click) ---
  const handlePlaceOrderClick = async () => {
    if (!activeProduct) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: activeProduct.id }), // No customer details text
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Order placement failed.");

      setOrderPlaced(true);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "system", text: `Order placed successfully! Order ID: ${result.orderId}` },
      ]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "system", text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- API CALL HANDLERS ---
  const analyzeImage = async (imageBase64: string, imageMime: string) => {
    setIsLoading(true);
    setOrderPlaced(false);
    setIsCollectingInfo(false); // Reset info collection on new image
    const pureBase64 = imageBase64.split(",")[1];

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: pureBase64, imageMime }),
      });

      if (!response.ok) throw new Error((await response.json()).error || "Analysis failed");

      const result: { foundProduct: Product | null; message?: string } = await response.json();

      if (result.foundProduct) {
        setActiveProduct(result.foundProduct);
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", product: result.foundProduct }]);
      } else {
        setActiveProduct(null);
        const botText = result.message || "Sorry, I couldn't identify the product.";
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", text: botText }]);
      }
    } catch (error: any) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), sender: "user", text: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    const currentMessageText = inputValue;
    setInputValue("");
    setIsLoading(true);

    if (isCollectingInfo) {
      // --- LOGIC FOR CREATING ORDER WITH DETAILS ---
      if (!activeProduct) {
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "system", text: "Error: No active product to order." }]);
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: activeProduct.id, customerDetailsText: currentMessageText }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || "Order placement failed.");
        setOrderPlaced(true);
        setIsCollectingInfo(false); // Exit collection mode
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: "system", text: `Order placed successfully! Order ID: ${result.orderId}` },
        ]);
      } catch (error: any) {
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "system", text: `Error: ${error.message}` }]);
      }

    } else {
      // --- LOGIC FOR NORMAL CHAT ---
      const chatHistory: GeminiChatMessage[] = messages
        .filter(msg => !!msg.text)
        .map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.text as string }] }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productContext: activeProduct, chatHistory, userMessage: currentMessageText }),
        });

        if (!response.ok) throw new Error((await response.json()).error || "Chat API failed");

        const result: { reply: string; intent?: string } = await response.json();
        const cleanedReply = result.reply.replace('[INTENT:COLLECT_INFO]', '').trim();

        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", text: cleanedReply }]);

        if (result.intent === 'COLLECT_INFO') {
          setIsCollectingInfo(true);
        }
      } catch (error: any) {
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", text: `Error: ${error.message}` }]);
      }
    }
    setIsLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const imageBase64 = loadEvent.target?.result as string;
      if (imageBase64) {
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", imageUrl: imageBase64 }]);
        analyzeImage(imageBase64, file.type);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full min-h-screen relative bg-[#F7F5F3] overflow-x-hidden flex flex-col justify-start items-center">
      <NavigationBar />
      <div className="flex-1 flex flex-col items-center justify-start pt-24 px-4 pb-8 w-full">
        <div className="w-full max-w-2xl flex flex-col items-center gap-6 mb-12">
          <h1 className={`text-4xl md:text-5xl lg:text-6xl text-[#37322F] text-center leading-tight ${instrumentSerif.className}`}>
            Automate Social Commerce Orders Instantly
          </h1>
          <p className="text-lg md:text-xl text-[rgba(55,50,47,0.80)] text-center font-sans">
            Our AI understands customer screenshots and messages. Try the live demo below.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <div className="border border-[rgba(55,50,47,0.12)] rounded-2xl bg-white flex flex-col overflow-hidden shadow-sm h-[600px]">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {messages.map((msg) => {
                let content: React.ReactNode;

                if (msg.text) {
                  content = msg.text;
                } else if (msg.imageUrl) {
                  content = <img src={msg.imageUrl} alt="User upload" className="max-w-xs rounded-lg" />;
                } else if (msg.product) {
                  const product = msg.product;
                  content = (
                    <div className="flex flex-col gap-3 p-2 rounded-lg bg-white border border-gray-200">
                      <img src={product.imageUrl} alt={product.name} className="rounded-md object-cover w-full h-48" />
                      <div className="p-2">
                        <p className="font-bold text-base text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">Price: BDT {product.price.toLocaleString()}</p>
                        <p className="text-sm text-green-600">In Stock: {product.stock} units</p>
                      </div>
                      <Button size="sm" className="w-full mt-2" onClick={handlePlaceOrderClick} disabled={orderPlaced}>
                        {orderPlaced ? "Order Placed!" : "✅ Place Order"}
                      </Button>
                    </div>
                  );
                }

                if (!content) return null;

                return (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                      msg.sender === "user" ? "bg-blue-500 text-white rounded-br-none" : msg.sender === 'system' ? 'bg-yellow-200 text-yellow-800 text-xs text-center w-full' : "bg-[#F0EEEB] text-[#37322F] rounded-bl-none"
                    } font-sans text-sm leading-relaxed`}>
                      {content}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#F0EEEB] text-[#37322F] px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-2">
                    <LoaderIcon />
                    <span className="font-sans text-sm">Bot is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-[rgba(55,50,47,0.12)] p-2">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  type="text"
                  placeholder={isCollectingInfo ? "Please enter your Name, Address, and Phone..." : "Type a message or upload an image..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="ghost" size="icon"><Send className="h-5 w-5" /></Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}