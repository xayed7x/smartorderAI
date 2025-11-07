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

    let isGemini25ProAvailable = false;
    let isGemini25FlashAvailable = false;

    console.log("-------------------------------------------");
    console.log("✅ Models available for your key:");

    modelNames.forEach((name) => {
      console.log(`- ${name}`);
      if (name.includes("gemini-2.5-pro")) {
        isGemini25ProAvailable = true;
      }
      if (name.includes("gemini-2.5-flash")) {
        isGemini25FlashAvailable = true;
      }
    });

    console.log("-------------------------------------------");

    if (isGemini25ProAvailable && isGemini25FlashAvailable) {
      console.log(
        "🟢 SUCCESS: Great news! Your API key has access to both Gemini 2.5 Pro and Gemini 2.5 Flash models."
      );
    } else {
        if (!isGemini25ProAvailable) {
            console.log("🔴 ERROR: Gemini 2.5 Pro was not found.");
        }
        if (!isGemini25FlashAvailable) {
            console.log("🔴 ERROR: Gemini 2.5 Flash was not found.");
        }
      console.log(
        "Please ensure your API key is enabled for the latest models in your Google Cloud project."
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
