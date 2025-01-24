import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { VectorStore } from "@langchain/core/vectorstores";
// import { logConversation } from "./logger";

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
    const relevantDocs = await vectorStore.similaritySearch(inquiryResult, 5);
    const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    console.log("context", context);

    // Log conversation data
    // logConversation({
    //   timestamp: new Date().toISOString(),
    //   userPrompt,
    //   conversationHistory,
    //   context
    // });

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
      conversationHistory
    });
  } catch (error) {
    console.error("Error processing message:", error);
    throw new Error("Failed to process your message");
  }
}

const inquiryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `วิเคราะห์คำถามผู้ใช้และประวัติการสนทนา เพื่อสร้างคำถามหลักสำหรับค้นหาคำตอบจากฐานความรู้
    
    กฎ:
    1. ให้ความสำคัญกับ "{userPrompt}" มากกว่า "{conversationHistory}"
    2. ละเว้นส่วนที่ไม่เกี่ยวข้องใน "{conversationHistory}"
    3. สรุปคำถามให้เป็นประโยคเดียว (ไม่ต้องมีเครื่องหมายวรรคตอน)
    4. หากไม่สามารถสรุปคำถามได้ ให้ใช้ "{userPrompt}" ต้นฉบับ`,
  ],
  [
    "human",
    `คำถามผู้ใช้: {userPrompt}\n\nประวัติสนทนา: {conversationHistory}`
  ],
]);

const qaPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `คุณเป็นผู้ช่วย AI ที่เป็นแฟนพันธุ์แท้ของ "{context}" โดยมีความรู้ลึกและสามารถตอบคำถามได้อย่างละเอียดและแม่นยำ

    📚 **แหล่งข้อมูล**
    ----------------------------------
    {context}
    ----------------------------------

    ✅ **กฎการตอบ**
    1. ตอบคำถามด้วยความรู้เชิงลึกและข้อมูลเฉพาะทางเกี่ยวกับ "{context}"
    2. ใช้ภาษาพูดธรรมชาติเหมือนมนุษย์ แต่แสดงความตื่นเต้นและความชื่นชอบใน "{context}"
    3. ระบุข้อมูลเหล่านี้แทรกในเนื้อหา:
       - ข้อมูลเชิงประวัติศาสตร์หรือที่มา (ถ้ามี)
       - ข้อมูลเชิงเทคนิคหรือรายละเอียดเฉพาะ
       - เกร็ดความรู้หรือเรื่องราวที่น่าสนใจ
    4. หากข้อมูลไม่ครบ:
       - บอกชัดเจนว่าข้อมูลใดขาดหาย
       - เสนอช่องทางติดต่อหรือแหล่งข้อมูลเพิ่มเติม

    🚫 **ข้อห้าม**
    - ใช้สัญลักษณ์หรือรูปแบบข้อความที่ดูเป็นระบบเกินไป (เช่น ➤, ★)
    - แบ่งส่วนคำตอบเป็นหัวข้อย่อยเว้นแต่จำเป็น
    - ใช้คำฟอร์แมลเช่น "ท่าน", "ครับ/ค่ะ"

    ✨ **ตัวอย่างรูปแบบคำตอบ**
    - คำถามเชิงประวัติศาสตร์:
    "เรื่องนี้เกิดขึ้นในปี 1999 เมื่อตัวละครหลักได้พบกับเหตุการณ์สำคัญครั้งแรก ซึ่งเป็นจุดเปลี่ยนที่ทำให้เรื่องราวพัฒนาต่อไปอย่างน่าติดตาม!"

    - คำถามเชิงเทคนิค:
    "ตัวละครนี้มีพลังพิเศษที่เรียกว่า 'พลังแสง' ซึ่งสามารถใช้ได้เฉพาะตอนกลางคืนเท่านั้น ตามที่อธิบายไว้ในตอนที่ 5 ของซีรีส์ครับ"

    - คำถามทั่วไป:
    "เรื่องนี้เป็นที่นิยมเพราะมีพล็อตที่ซับซ้อนและตัวละครที่มีความลึก ทำให้แฟนๆ ติดตามอย่างต่อเนื่องมาตลอด 10 ปี!"`
  ],
  ["human", "คำถาม: {question}"]
]);
