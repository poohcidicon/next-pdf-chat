import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { VectorStore } from "@langchain/core/vectorstores";

interface ProcessMessageArgs {
  userPrompt: string;
  conversationHistory: string;
  vectorStore: VectorStore;
  model: ChatOpenAI;
}

export async function processUserMessage({
  userPrompt,
  conversationHistory,
  vectorStore,
  model,
}: ProcessMessageArgs) {
  try {
    // Create non-streaming model for inquiry generation
    const nonStreamingModel = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
      streaming: false,
    });

    // Generate focused inquiry using non-streaming model
    const inquiryResult = await inquiryPrompt
      .pipe(nonStreamingModel)
      .pipe(new StringOutputParser())
      .invoke({
        userPrompt,
        conversationHistory,
      });

    // Get relevant documents
    const relevantDocs = await vectorStore.similaritySearch(inquiryResult, 3);
    const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    // Generate answer using streaming model
    // const answer = await qaPrompt
    //   .pipe(model)
    //   .pipe(new StringOutputParser())
    //   .stream({
    //     context,
    //     question: inquiryResult,
    //   });

    return qaPrompt.pipe(model).pipe(new StringOutputParser()).stream({
      context,
      question: inquiryResult,
    });
  } catch (error) {
    console.error("Error processing message:", error);
    throw new Error("Failed to process your message");
  }
}

// Updated prompt templates
const inquiryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Given the following user prompt and conversation log, formulate a question that would be the most relevant to provide the user with an answer from a knowledge base.
    
    Rules:
    - Always prioritize the user prompt over the conversation log
    - Ignore any conversation log that is not directly related to the user prompt
    - Only attempt to answer if a question was posed
    - The question should be a single sentence
    - Remove any punctuation from the question
    - Remove any words that are not relevant to the question
    - If unable to formulate a question, respond with the same USER PROMPT received`,
  ],
  [
    "human",
    `USER PROMPT: {userPrompt}\n\nCONVERSATION LOG: {conversationHistory}`,
  ],
]);

const qaPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an AI assistant specialized in providing accurate, context-based responses. Analyze the provided context carefully and follow these guidelines:

    CORE RESPONSIBILITIES:
    - Base responses primarily on the provided context
    - Cite specific parts of the context to support answers
    - Maintain high accuracy and transparency
    - Acknowledge limitations clearly

    RESPONSE GUIDELINES:
    1. Use the context precisely and effectively
    2. Distinguish between context-based facts and general knowledge
    3. Structure responses clearly and logically
    4. Include relevant quotes when beneficial
    5. State confidence levels when appropriate

    IMPORTANT RULES:
    - Never make up information not present in the context
    - Don't speculate beyond the given information
    - If the context is insufficient, explicitly state what's missing
    - Ask for clarification if the question is ambiguous

    When you cannot answer based on the context:
    1. State clearly that the context lacks the necessary information
    2. Explain what specific information would be needed
    3. Suggest how the question might be refined

    Context: {context}`,
  ],
  ["human", "Question: {question}"],
]);
