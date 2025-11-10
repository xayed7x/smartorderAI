// File: app/api/analyze-image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// --- Singleton Pattern for the AI Pipeline ---
// This ensures we only load the heavy AI model once, not on every API call.
class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/clip-vit-base-patch32';
  static instance: any = null; // Using 'any' to avoid complex type issues with the dynamic import

  static async getInstance(progress_callback: any = null) {
    if (this.instance === null) {
      // Dynamically import the library only when it's needed for the first time.
      // This is the key to solving the Webpack bundling issue.
      const { pipeline } = await import('@xenova/transformers');
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// --- MAIN API ENDPOINT ---
export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64 field" }, { status: 400 });
    }
    
    // 1. Initialize the AI pipeline (or get the existing instance)
    const extractor = await PipelineSingleton.getInstance();

    // The library can directly handle a Base64 string if formatted correctly
    const image_data = `data:image/jpeg;base64,${imageBase64}`;

    // 2. Generate the embedding for the user's image
    const query_embedding_tensor = await extractor(image_data, {
      pooling: 'mean',
      normalize: true,
    });
    const query_embedding = Array.from(query_embedding_tensor.data);

    // 3. Call the Supabase RPC function to find the best match
    const { data, error } = await supabase.rpc('match_products', {
      query_embedding: query_embedding,
      match_threshold: 0.8, // Adjust this threshold for accuracy
      match_count: 1,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      throw new Error("Failed to match product in database.");
    }

    // 4. Return the result
    return NextResponse.json({ foundProduct: data ? data[0] : null });

  } catch (error: any) {
    console.error("Error in analyze-image route:", error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}