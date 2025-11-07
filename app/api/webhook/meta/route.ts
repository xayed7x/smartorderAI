// File: app/api/webhook/meta/route.ts

import { NextRequest, NextResponse } from 'next/server';

// --- Environment Variables ---
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN; // Make sure this is in .env.local

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// --- HELPER FUNCTION TO SEND REPLY ---
async function sendReply(recipientId: string, messageText: string) {
  const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  
  const body = {
    recipient: { id: recipientId },
    message: { text: messageText },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error("Meta API Error:", data);
    } else {
      console.log("Successfully sent reply to Meta:", data);
    }
  } catch (error) {
    console.error("Failed to send request to Meta:", error);
  }
}

// --- UPDATED POST HANDLER ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Incoming Webhook Event:", JSON.stringify(body, null, 2));

    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          if (event.message && !event.message.is_echo) {
            // It's a real message from a user
            const senderId = event.sender.id;
            console.log(`Received message from sender: ${senderId}`);
            
            // Send a test reply to trigger the API call requirement
            await sendReply(senderId, "হ্যালো! আমরা আপনার মেসেজ পেয়েছি। এটি একটি টেস্ট রিপ্লাই। 😊");
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error("Error processing webhook event:", error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}