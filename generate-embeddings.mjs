// File: generate-embeddings.mjs

import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // We still need this to fetch the image

// Load environment variables
dotenv.config({ path: '.env.local' });

// --- CLIENT INITIALIZATION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPER FUNCTIONS ---
// Lazy-load the pipeline to avoid loading it on every call
let extractor = null;

async function embedImage(imageUrl) {
  if (!extractor) {
    console.log("Initializing feature extraction pipeline (this might take a moment)...");
    // Use Xenova/clip-vit-base-patch32, a powerful and efficient model
    extractor = await pipeline("feature-extraction", "Xenova/clip-vit-base-patch32");
    console.log("Pipeline initialized.");
  }

  // Fetch the image from the public URL
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  // We need the raw image data, which can be passed directly to the extractor
  const imageBuffer = await response.arrayBuffer();

  // Extract the embedding from the image
  const embedding = await extractor(new Uint8Array(imageBuffer), {
    pooling: "mean",
    normalize: true,
  });

  // Convert the tensor data to a plain JavaScript array
  return Array.from(embedding.data);
}

async function storeEmbedding(productId, embedding) {
  const { error } = await supabase
    .from("products")
    .update({ image_embedding: `[${embedding.join(',')}]` }) // Format for pgvector
    .eq("id", productId);
  
  if (error) {
    throw new Error(`Supabase update failed: ${error.message}`);
  }
}

// --- MAIN SCRIPT LOGIC ---
async function main() {
  console.log("Fetching products that need embeddings...");
  
  const { data: products, error } = await supabase
    .from("products")
    .select("id, image_url, product_name")
    .is("image_embedding", null);

  if (error) {
    console.error("❌ Failed to fetch products:", error.message);
    return;
  }

  if (!products || products.length === 0) {
    console.log("✅ All products already have embeddings. Nothing to do.");
    return;
  }
  
  console.log(`Found ${products.length} products to process.`);

  for (const product of products) {
    try {
      console.log(`Embedding: ${product.product_name}`);
      const embedding = await embedImage(product.image_url);
      await storeEmbedding(product.id, embedding);
      console.log(`✅ Stored embedding for: ${product.product_name}`);
    } catch (err) {
      console.error(`❌ Failed to process ${product.product_name}:`, err.message);
    }
  }
  
  console.log("\nEmbedding generation process finished.");
}

// Run the main function
main();