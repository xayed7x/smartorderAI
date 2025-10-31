// File: app/api/chat/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// --- TYPE DEFINITIONS ---
type ProductContext = {
  id: string; // Crucially, we need the product ID to create an order
  name: string;
  price: number;
  stock: number;
  description?: string;
};
type ChatMessage = { role: 'user' | 'model'; parts: { text: string }[] };
type ChatRequest = {
  productContext: ProductContext | null;
  chatHistory: ChatMessage[];
  userMessage: string;
};

// --- SUPABASE CLIENT SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- GEMINI AI CLIENT SETUP ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set.');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// --- MAIN API ENDPOINT ---
export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    if (!body.userMessage || !body.chatHistory) {
      return NextResponse.json({ error: 'Missing user message or chat history' }, { status: 400 });
    }

    // 1. Construct the Master Prompt with Intent Detection Instruction
    const systemPrompt = `You are 'ShopMate' (শপমেট), an exceptionally friendly, polite, and helpful customer support agent for an e-commerce store in Bangladesh.

*** YOUR PERSONALITY RULES ***
1.  **Islamic Greeting:** You MUST always start the very first interaction or respond to greetings like "Hi" or "Hello" with the full Islamic greeting: "Assalamualaikum Warahmatullahi Wabarakatuh" (আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহি ওয়াবারাকাতুহ).
2.  **Language:** You MUST always respond in clear, natural Bengali (Bangla).
3.  **Use of Emojis:** You should use relevant emojis to make the conversation more engaging and friendly. For example: 😊 for friendly messages, ✅ for confirmations, 📦 for order details, 🤔 for questions. Use them naturally, not excessively.
4.  **Tone:** Your tone should be warm, respectful, and highly professional.

*** INTENT DETECTION RULE ***
If a user expresses a clear intent to buy or place an order, your primary goal is to collect their details.
Ask a follow-up question like "অবশ্যই! 😊 আপনার অর্ডারটি কনফার্ম করার জন্য, অনুগ্রহ করে আপনার নাম, সম্পূর্ণ ঠিকানা এবং ফোন নম্বর দিন।"
Then, you MUST append a special, non-visible token to the very end of your response: [INTENT:COLLECT_INFO].

Example 1: User says "দাম কত?". Your response: "এই পণ্যটির দাম 1250 টাকা। 👍"
Example 2: User says "অর্ডার করে দিন". Your response: "অবশ্যই! 😊 আপনার অর্ডারটি কনফার্ম করার জন্য, অনুগ্রহ করে আপনার নাম, সম্পূর্ণ ঠিকানা এবং ফোন নম্বর দিন।[INTENT:COLLECT_INFO]"
`;

    let productInfo = "The user has not selected a specific product yet. Answer their general questions politely.";
    if (body.productContext) {
      productInfo = `You are currently discussing this product:
      - Name: ${body.productContext.name}
      - Price: ${body.productContext.price} BDT
      - In Stock: ${body.productContext.stock} units`;
    }

    const fullPrompt = `${systemPrompt}\n\n${productInfo}`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: fullPrompt }] },
        { role: 'model', parts: [{ text: "জি, আমি শপমেট। আপনাকে কীভাবে সাহায্য করতে পারি?" }] },
        ...body.chatHistory
      ]
    });

    const result = await chat.sendMessage(body.userMessage);
    const aiResponseText = result.response.text();

    // 2. Check for the Collect Info Intent Token
    const intentToCollectInfo = aiResponseText.includes('[INTENT:COLLECT_INFO]');
    const cleanedReply = aiResponseText.replace('[INTENT:COLLECT_INFO]', '').trim();

    return NextResponse.json({ reply: cleanedReply, intent: intentToCollectInfo ? 'COLLECT_INFO' : undefined });

  } catch (err: any) {
    console.error("Error in chat route:", err);
    return NextResponse.json({ error: `An unexpected error occurred: ${err.message}` }, { status: 500 });
  }
}