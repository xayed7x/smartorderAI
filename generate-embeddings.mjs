// File: generate-embeddings.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// --- SETUP ---
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use the service key for admin-level access
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
  console.error("Missing environment variables. Make sure Supabase URL, Service Key, and OpenAI API Key are in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const VISION_MODEL = 'gpt-4o';
const EMBEDDING_MODEL = 'text-embedding-3-small';

// --- CORE FUNCTION: GENERATE EMBEDDING ---
async function generateEmbedding(imageUrl, productName) {
  console.log(`   - Generating text description with ${VISION_MODEL} for: ${productName}`);
  
  // 1. Generate a detailed text description of the image using a multimodal model (GPT-4o).
  const visionResponse = await openai.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: `Generate a detailed, factual description of this product image suitable for creating a searchable vector embedding. Focus on objective attributes like the item's type, color, shape, material, texture, and any unique visual features. Product Name: ${productName}` 
          },
          { 
            type: 'image_url', 
            image_url: { url: imageUrl, detail: 'low' } // Use low detail for cost-efficiency
          },
        ],
      },
    ],
  });

  const description = visionResponse.choices[0].message.content;

  if (!description) {
    throw new Error("Could not generate a text description for the image.");
  }

  console.log(`   - Generated Description: "${description.substring(0, 100)}"...`);
  console.log(`   - Creating embedding with ${EMBEDDING_MODEL}...`);

  // 2. Create an embedding from the generated text description.
  const embeddingResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: description,
  });

  // The response contains the embedding vector.
  const embedding = embeddingResponse.data[0].embedding;

  if (!embedding || embedding.length !== 1536) {
      throw new Error(`Failed to generate a valid ${EMBEDDING_MODEL} embedding.`);
  }

  return embedding;
}

// --- MAIN EXECUTION LOGIC ---
async function main() {
  console.log("Starting OpenAI embedding generation process...");

  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, product_name, image_url')
    .is('image_embedding', null);

  if (fetchError) {
    console.error("Error fetching products from Supabase:", fetchError.message);
    return;
  }

  if (products.length === 0) {
    console.log("✅ All products already have embeddings. Nothing to do.");
    return;
  }

  console.log(`Found ${products.length} products to process.`);

  for (const product of products) {
    try {
      console.log(`
Processing product: ${product.product_name} (ID: ${product.id})`);
      const embeddingVector = await generateEmbedding(product.image_url, product.product_name);

      console.log("   - Saving 1536-dimension embedding to Supabase...");
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_embedding: embeddingVector })
        .eq('id', product.id);

      if (updateError) {
        console.error(`   - 🚨 Failed to save embedding for product ${product.id}:`, updateError.message);
      } else {
        console.log(`   - ✅ Successfully generated and saved embedding for ${product.product_name}.`);
      }
    } catch (error) {
      console.error(`   - 🚨 An unexpected error occurred for product ${product.id}:`, error.message);
    }
  }
  
  console.log("\nEmbedding generation process finished.");
}

main();
