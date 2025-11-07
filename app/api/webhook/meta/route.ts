// File: app/api/webhook/meta/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// --- CLIENT & ENV SETUP ---
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set.');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- TYPE DEFINITIONS ---
type Product = { id: string; product_name: string; product_code: string; price: number; stock_quantity: number; image_url: string; category: string; };

// --- HELPER FUNCTION: Send reply via Meta Graph API ---
async function sendReply(recipientId: string, messageText: string) {
  const messageData = {
    recipient: { id: recipientId },
    message: { text: messageText },
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    });
    const responseData = await response.json();
    console.log('Message sent successfully:', responseData);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

// --- HELPER FUNCTION: Convert image to Gemini-readable format ---
const imageToGenerativePart = (buffer: Buffer, mimeType: string) => {
  return { inlineData: { data: buffer.toString('base64'), mimeType } };
};

// --- WEBHOOK VERIFICATION (GET) ---
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error("Webhook verification failed.");
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// --- MAIN WEBHOOK LOGIC (POST) ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(JSON.stringify(body, null, 2)); // Log incoming event

    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          if (event.message) {
            const senderId = event.sender.id;
            const message = event.message;

            // --- IMAGE MESSAGE LOGIC ---
            if (message.attachments && message.attachments[0].type === 'image') {
              const imageUrl = message.attachments[0].payload.url;
              
              // --- Start of the 3-Step AI Analysis ---
              const imageResponse = await fetch(imageUrl);
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const userImagePart = imageToGenerativePart(imageBuffer, imageResponse.headers.get('content-type') || 'image/jpeg');

              // 1. Quick Analysis with Flash Model
              const flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
              const categoryPrompt = "Analyze this image and return only a valid JSON object with one key: 'category' (e.g., 'Polo Shirt', 'Jeans').";
              let result = await flashModel.generateContent([categoryPrompt, userImagePart]);
              const { category } = JSON.parse(result.response.text().replace(/```json|```/g, ''));

              if (!category) {
                 await sendReply(senderId, "দুঃখিত, আমি এই ছবিটি থেকে পণ্যের ধরণটি বুঝতে পারিনি।");
                 continue; // Move to the next event
              }

              // 2. Database Search by Category
              const { data: candidateProducts } = await supabase.from('products').select('*').eq('category', category);

              if (!candidateProducts || candidateProducts.length === 0) {
                await sendReply(senderId, `দুঃখিত, আমাদের ক্যাটালগে '${category}' ক্যাটাগরির কোনো পণ্য খুঁজে পাওয়া যায়নি।`);
                continue;
              }
              
              // 3. Precise Visual Comparison with Pro Model
              // (For simplicity in this final step, we are using the first match. The full visual comparison can be re-added.)
              const finalProduct = candidateProducts[0]; // Simplified logic for demonstration

              const replyText = `আমরা আপনার জন্য এই পণ্যটি খুঁজে পেয়েছি! 😊

নাম: ${finalProduct.product_name}
মূল্য: BDT ${finalProduct.price}
স্টকে আছে: ${finalProduct.stock_quantity} units

আপনি কি এটি অর্ডার করতে চান?`;
              await sendReply(senderId, replyText);

            // --- TEXT MESSAGE LOGIC ---
            } else if (message.text) {
              const userText = message.text;
              // For now, handle simple text messages
              const replyText = `হ্যালো! আমরা আপনার মেসেজ পেয়েছি। পণ্যের বিবরণ জানতে অনুগ্রহ করে একটি ছবি পাঠান। 😊`;
              await sendReply(senderId, replyText);
            }
          }
        }
      }
    }
    
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error("Error in webhook POST:", error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
