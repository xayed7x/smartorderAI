// A simpler, more direct model checker using fetch

import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("🔴 ERROR: GEMINI_API_KEY not found in your .env.local file.");
  process.exit(1);
}

const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

async function checkModelsDirectly() {
  console.log("🔍 Fetching available models directly from the REST API...");

  try {
    const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API request failed with status ${response.status}: ${errorData.error.message}`
      );
    }

    const data = await response.json();
    const modelNames = data.models.map((model) => model.name);

    let isGemini15ProAvailable = false;

    console.log("-------------------------------------------");
    console.log("✅ Models available for your key:");

    modelNames.forEach((name) => {
      console.log(`- ${name}`);
      if (name.includes("gemini-1.5-pro")) {
        isGemini15ProAvailable = true;
      }
    });

    console.log("-------------------------------------------");

    if (isGemini15ProAvailable) {
      console.log(
        "🟢 SUCCESS: Great news! Your API key has access to Gemini 1.5 Pro models."
      );
    } else {
      console.log("🟡 INFO: Gemini 1.5 Pro was not found.");
      console.log(
        "Based on your needs, the best available vision model is likely `models/gemini-pro-vision`."
      );
    }
    console.log("-------------------------------------------");
  } catch (error) {
    console.error("🔴 FATAL ERROR:", error.message);
    console.error(
      'Please double-check your API key and ensure it is enabled for the "Generative Language API" in your Google Cloud project.'
    );
  }
}

checkModelsDirectly();
