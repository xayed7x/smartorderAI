// File: app/api/create-order/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const body: { productId: string; customerDetailsText?: string } = await req.json();

    if (!body.productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    let customerDetailsJSON: object = { source: 'Button Click' };

    // If text details are provided, use AI to parse them
    if (body.customerDetailsText) {
      const parsingPrompt = `You are a data extraction expert. Parse the following text to extract the customer's name, address, and phone number.
      Return ONLY a valid JSON object with the keys "name", "address", and "phone". If a field is missing, set its value to null.
      Text to parse: "${body.customerDetailsText}"`;
      
      const result = await model.generateContent(parsingPrompt);
      const jsonString = result.response.text().replace(/```json\n?|\n?```/g, ''); // Clean up markdown
      try {
        customerDetailsJSON = JSON.parse(jsonString);
      } catch (e) {
        console.error("Failed to parse JSON from AI response:", e);
        // Fallback to storing the raw text if JSON parsing fails
        customerDetailsJSON = { source: 'Chatbot Raw Text', raw: body.customerDetailsText };
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        { 
          product_id: body.productId,
          customer_details: customerDetailsJSON
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create order in database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: data.id });

  } catch (err: any) {
    console.error("Error in create-order route:", err);
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
  }
}