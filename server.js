import { WebSocketServer } from "ws";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, AIMessage } from "langchain/schema";
import { v4 as uuidv4 } from "uuid";

// You can add LangGraph and LangSmith monitoring here as needed

const wss = new WebSocketServer({ port: 3001 });

console.log("WebSocket server running on ws://localhost:3001");

wss.on("connection", (ws) => {
  ws.id = uuidv4();
  ws.on("message", async (message) => {
    const userMsg = message.toString();
    let response = "";
    try {
      // Choose your model here. Example: Google Generative AI
      const chat = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY || "",
        model: "gemini-pro",
      });
      const result = await chat.call([new HumanMessage(userMsg)]);
      response = result.content;
    } catch (err) {
      response = "Sorry, there was an error: " + (err?.message || err);
    }
    ws.send(response);
  });
});
