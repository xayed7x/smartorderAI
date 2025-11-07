// File: app/api/analyze-image/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// --- SUPABASE CLIENT SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- GEMINI AI CLIENT SETUP ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
if (!GEMINI_API_KEY)
  throw new Error("GEMINI_API_KEY environment variable is not set.");
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using the correct, specified model

// --- TYPE DEFINITIONS ---
type AnalyzeRequest = { imageBase64: string; imageMime: string };
type Product = {
  id: string;
  product_name: string;
  product_code: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  tags: string[];
};

// --- HELPER FUNCTION: Convert Base64 to Gemini-readable format ---
const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

// --- MAIN API ENDPOINT ---
export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    if (!body.imageBase64 || !body.imageMime) {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }

    const userImagePart = fileToGenerativePart(
      body.imageBase64,
      body.imageMime
    );

    // STEP 1: Get keywords from the image using Gemini AI
    const promptForKeywords = `Analyze this image of a clothing item.
    Based on what you see, generate a list of 5-7 relevant search keywords (tags).
    Focus on type, style, color, pattern, and any visible text or branding.
    Return ONLY a comma-separated list of keywords. For example: polo shirt, navy blue, white stripes, contrast collar, men's wear, bison`;

    let result = await model.generateContent([
      promptForKeywords,
      userImagePart,
    ]);
    let keywords = result.response
      .text()
      .split(",")
      .map((k) => k.trim().toLowerCase()); // Convert to lowercase for consistency

    if (keywords.length === 0) {
      return NextResponse.json({
        foundProduct: null,
        message: "Sorry, the AI could not identify keywords from the image.",
      });
    }

    // STEP 2: Search for products in Supabase using the keywords
    // We use `rpc` to call a custom database function for better search logic.
    // This function needs to be created in Supabase.
    const { data: candidateProducts, error: dbError } = await supabase.rpc(
      "search_products_by_tags",
      { search_tags: keywords }
    );

    if (dbError || !candidateProducts) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to search for products." },
        { status: 500 }
      );
    }

    if (candidateProducts.length === 0) {
      return NextResponse.json({
        foundProduct: null,
        message: "Sorry, we couldn't find a matching product in our catalog.",
      });
    }

    let finalProduct: Product;

    // STEP 3: Decide if visual comparison is needed
    if (candidateProducts.length === 1) {
      finalProduct = candidateProducts[0];
    } else {
      const productOptions = candidateProducts
        .map(
          (p) =>
            `Product Code: ${p.product_code}, Name: ${
              p.product_name
            }, Tags: ${p.tags.join(", ")}`
        )
        .join("\n");
      const comparisonPrompt = `You are a product matching expert. A user sent an image. I found these potential matches from my database:\n\n${productOptions}\n\nBased on the user's image, which of these products is the EXACT match? Analyze details like stripes, collar, and branding. Respond with ONLY the Product Code of the winner (e.g., "NBP-001").`;

      result = await model.generateContent([comparisonPrompt, userImagePart]);
      const bestProductCode = result.response.text().trim();

      const matchedProduct = candidateProducts.find(
        (p) => p.product_code === bestProductCode
      );

      finalProduct = matchedProduct || candidateProducts[0]; // Fallback to the first match if AI fails
    }

    // STEP 4: Return the details of the final, identified product
    return NextResponse.json({
      foundProduct: {
        id: finalProduct.id,
        name: finalProduct.product_name,
        price: finalProduct.price,
        stock: finalProduct.stock_quantity,
        imageUrl: finalProduct.image_url,
      },
    });
  } catch (err: any) {
    console.error("Critical Error in analyze-image route:", err);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${err.message}` },
      { status: 500 }
    );
  }
}
