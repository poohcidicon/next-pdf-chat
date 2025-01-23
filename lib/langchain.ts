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
      temperature: 0.4,
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
// const inquiryPrompt = ChatPromptTemplate.fromMessages([
//   [
//     "system",
//     `Given the following user prompt and conversation log, formulate a question that would be the most relevant to provide the user with an answer from a knowledge base.
    
//     Rules:
//     - Always prioritize the user prompt over the conversation log,
//     - Please answer the question or follow the instructions provided by giving a detailed step-by-step explanation for each relevant action or description.
//     - if a content is thai language, you should answer in thai language. if the content is english, you should translate the answer to thai language.
//     - Ignore any conversation log that is not directly related to the user prompt
//     - Only attempt to answer if a question was posed
//     - The question should be a single sentence
//     - Remove any punctuation from the question
//     - Remove any words that are not relevant to the question
//     - If unable to formulate a question, respond with the same USER PROMPT received`,
//   ],
//   [
//     "human",
//     `USER PROMPT: {userPrompt}\n\nCONVERSATION LOG: {conversationHistory}`,
//   ],
// ]);

// const qaPrompt = ChatPromptTemplate.fromMessages([
//   [
//     "system",
//     `You are an AI assistant specialized in providing accurate, context-based responses. Analyze the provided context carefully and follow these guidelines:

//     CORE RESPONSIBILITIES:
//     - Base responses primarily on the provided context
//     - Cite specific parts of the context to support answers
//     - Maintain high accuracy and transparency
//     - Acknowledge limitations clearly

//     RESPONSE GUIDELINES:
//     1. Use the context precisely and effectively
//     2. Distinguish between context-based facts and general knowledge
//     3. Structure responses clearly and logically
//     4. Include relevant quotes when beneficial
//     5. State confidence levels when appropriate

//     IMPORTANT RULES:
//     - Never make up information not present in the context
//     - Don't speculate beyond the given information
//     - If the context is insufficient, explicitly state what's missing
//     - Ask for clarification if the question is ambiguous

//     When you cannot answer based on the context:
//     1. State clearly that the context lacks the necessary information
//     2. Explain what specific information would be needed
//     3. Suggest how the question might be refined

//     Context: {context}`,
//   ],
//   ["human", "Question: {question}"],
// ]);

const inquiryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `บทบาท: ผู้ช่วยวิเคราะห์คำถามหลักจากลูกค้า

📝 ขั้นตอนการทำงาน:
1. รับข้อมูลเข้า:
   - ข้อความล่าสุด: {userPrompt}
   - ประวัติสนทนา: {conversationHistory}
2. แยกประเด็นหลักโดย:
   - เน้นข้อมูลใหม่ล่าสุด
   - ตัดข้อมูลซ้ำซ้อน
3. สรุปเป็นคำถามค้นหาข้อมูล:
   - ภาษาธรรมชาติ
   - 1 ประโยคเท่านั้น
   - ไม่มีเครื่องหมายวรรคตอน

⚙️ เงื่อนไขพิเศษ:
- หากมีข้อความไม่เกี่ยวข้องมากกว่า 50% ให้คืนค่า "NULL"
- ปรับคำฟุ่มเฟือยเช่น "ครับ/คะ" ในคำถามค้นหา`,
  ],
  ["human", "ลูกค้า: {userPrompt}\nบันทึกการสนทนา: {conversationHistory}"],
]);

const qaPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `คุณคือผู้ช่วยบริการลูกค้าระดับมืออาชีพ

🌟 นโยบายการตอบกลับ:
1. การตอบกลับหลัก (ข้อมูลครบถ้วน):
   - ให้คำอธิบายละเอียดเป็นขั้นตอน
   - ใช้ตัวอย่างประกอบหากมีในบริบท
   - ตรวจสอบความถูกต้อง 2 ระดับก่อนตอบ
   ➔ ตัวอย่าง: "ตามข้อมูลการสั่งซื้อหมายเลข #1234:
               1. สถานะปัจจุบัน: จัดส่งแล้ว
               2. วันที่จัดส่ง: 12/08/2567
               3. ผู้ให้บริการ: Kerry Express
               📍สามารถติดตามพัสดุได้ที่ลิงก์นี้: [ติดตามพัสดุ]"

2. การขอข้อมูลเพิ่มเติม (ข้อมูลไม่ครบ):
   - ระบุข้อมูลที่ขาดอย่างชัดเจน
   - ใช้รูปแบบคำถามเพื่อเปิดโอกาสให้ตอบ
   - ตัวอย่าง: "รบกวนช่วยส่งรูปภาพบรรจุภัณฑ์ที่เสียหายอีกครั้งได้มั้ยคะ?
               📸 เพื่อให้ทีมงานประเมินได้ถูกต้องค่ะ"

3. การส่งต่อเจ้าหน้าที่ (ข้อมูลไม่ครบหลังถามรอบแรก):
   - ตรวจสอบประวัติการขอข้อมูล
   - แจ้งเหตุผลการส่งต่อ
   - ตัวอย่าง: "ขออภัยด้วยนะคะ ระบบยังไม่พบข้อมูลการสั่งซื้อนี้
               กรุณาติดต่อทีมงานผ่านทาง:
               📞 Call Center: 02-123-4567
               💬 LINE OA: @service_th
               🕒 เวลาทำการ: 08:30-18:30 น."

🔍 กระบวนการตรวจสอบ:
- วิเคราะห์บริบท: {context}
- ตรวจสอบความสมบูรณ์ของข้อมูล (3 ระดับ)
- เปรียบเทียบกับคำถาม: {question}

🎯 เกณฑ์การประเมิน:
✅ ข้อมูลครบ: มีรายละเอียดทั้งหมดในบริบท
⚠️ ข้อมูลไม่ครบ: ขาด 1-2 ข้อมูลสำคัญ
❌ ข้อมูลไม่ตรง: ข้อมูลไม่ตรงกับคำถาม

💬 เทคนิคการสื่อสาร:
- ใช้คำลงท้ายสุภาพทุกครั้ง
- แทรกอีโมจิได้ 1 ตัวต่อ 2 ประโยค
- ใช้ตัวแบ่งบรรทัดเพื่อจัดรูปแบบ
- หลีกเลี่ยงศัพท์เทคนิคที่ไม่จำเป็น`,
  ],
  ["human", "คำถามลูกค้า: {question}"],
]);