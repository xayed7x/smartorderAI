SmartOrder AI: Master Project Document (v1.0)
This document provides the complete context for the SmartOrder AI application. Feed this to any new AI chat instance to get it up to speed instantly.

1. High-Level Overview
   Project Name: SmartOrder AI
   Vision: A scalable SaaS application that helps social commerce businesses automate order processing using a conversational AI assistant.
   MVP v1.0 Goal: A fully functional web application that demonstrates the core features: AI-powered product identification from an image, a stateful conversational interface for customer support and order placement, and a dashboard for the business owner to view and manage orders.
2. Technology Stack & Key Libraries
   Framework: Next.js 14 (App Router)
   Package Manager: pnpm
   Database: Supabase (PostgreSQL) for products and orders tables.
   Image Storage: Supabase Storage
   AI Model: Google's gemini-2.5-pro via the @google/generative-ai library.
   Styling: Tailwind CSS
   UI Components: shadcn/ui
   Deployment: Vercel
3. Core Architecture & Workflows
   Our system has three intelligent backend APIs that work together:
   A. /api/analyze-image (The Product Identifier):
   Purpose: To identify a specific product from a user-uploaded image.
   Workflow (Two-Step AI):
   AI Analysis: Receives an image, calls Gemini to generate descriptive keywords/tags.
   Database Search: Uses these keywords to run a search against the products table in Supabase (via a custom search_products_by_tags SQL function).
   AI Visual Comparison: If multiple products are found, it makes a second call to Gemini, showing it the user's image and the candidate product images to determine the single best match.
   Response: Returns a JSON object of the single identified product (foundProduct) with its name, price, stock, etc.
   B. /api/chat (The Conversational Brain):
   Purpose: To act as a stateful, AI-powered customer support agent.
   Workflow (Intent Recognition):
   Receives the user's message, the conversation history, and the activeProduct context from the frontend.
   Constructs a "Master Prompt" for Gemini, defining its persona ('ShopMate'), giving it the product context, and instructing it to respond in Bengali with emojis.
   Crucially, it includes a rule to detect "intent to order." If found, the AI's response is appended with a special token: [INTENT:COLLECT_INFO].
   Response: Returns the AI's natural language reply.
   C. /api/create-order (The Order Processor):
   Purpose: To create a final order in the database.
   Workflow (AI-Powered Data Parsing):
   Receives a productId and an optional customerDetailsText (raw text like "My name is Zayed, address...").
   If customerDetailsText exists, it makes a call to Gemini with a prompt to parse this text into a structured JSON object ({ "name": "...", "address": "...", "phone": "..." }).
   Response: It inserts a new row into the orders table in Supabase, with the product_id and the structured customer_details JSON.
4. File & Folder Structure (Key Files)
   app/layout.tsx: The root layout, contains the shared Navbar and applies the custom "Hind Siliguri" font.
   app/page.tsx: The main chat interface. It's a client component that manages all conversation state (messages, activeProduct, isCollectingInfo).
   app/orders/page.tsx: The business owner's dashboard. A server component that fetches and displays all orders.
   app/products/page.tsx: The public product catalog page.
   app/api/analyze-image/route.ts: Implements the "Product Identifier" logic.
   app/api/chat/route.ts: Implements the "Conversational Brain" logic.
   app/api/create-order/route.ts: Implements the "Order Processor" logic.
   components/: Contains all UI components (Navbar.tsx, OrderCard.tsx, ProductCard.tsx).
   lib/supabase.ts: Initializes and exports the Supabase client.
5. Setup Instructions
   Environment Variables (.env.local):
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   GEMINI_API_KEY
   Installation: pnpm install
   Run Development Server: pnpm run dev
6. Development Log (Changelog)
   v1.0: MVP Completion (Date: [আজকের তারিখ])
   Objective: Completed the entire core functionality for the Minimum Viable Product.
   Features Implemented:
   Backend: Developed three core APIs for product analysis, conversational chat with intent detection, and intelligent order creation.
   Frontend: Built a fully stateful chat interface that manages conversation context and intelligently calls the correct backend APIs.
   Dashboard & Catalog: Created pages for viewing orders (/orders) and browsing all products (/products).
   UI/UX: Implemented a consistent header/layout and improved Bengali font rendering.
   Files Created/Modified:
   Created: /api/chat, /api/create-order, /products/page.tsx, Navbar.tsx, ProductCard.tsx.
   Modified: /api/analyze-image, /page.tsx, /orders/page.tsx, /layout.tsx, OrderCard.tsx.
   Current Status: The application is feature-complete for the MVP and ready for initial deployment and client demonstration.
