import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config(); // load .env when running locally

export async function handler(event) {
  try {
    const { prompt } = JSON.parse(event.body);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`, // reads from .env or Netlify
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({
        output: data.choices?.[0]?.message?.content || "[No output]",
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
