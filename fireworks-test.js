import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://api.fireworks.ai/inference/v1",
  apiKey: process.env.FIREWORKS_API_KEY,
});

async function testFireworks() {
  if (!process.env.FIREWORKS_API_KEY) {
    console.error("FIREWORKS_API_KEY is not set!");
    process.exit(1);
  }
  try {
    const completion = await openai.chat.completions.create({
      model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
      messages: [{ role: "user", content: "Say this is a test" }],
    });
    console.log("Fireworks API response:", completion.choices[0].message.content);
  } catch (error) {
    console.error("Fireworks API error:", error);
  }
}

testFireworks(); 