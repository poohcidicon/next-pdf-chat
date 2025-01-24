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
      temperature: 0.5,
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
    `คุณเป็นผู้ช่วย AI ที่เชี่ยวชาญเอกสารบริษัท โดยยึดหลักการดังนี้:

    📚 **แหล่งข้อมูล**
    ----------------------------------
    {context}
    ----------------------------------

    ✅ **กฎการตอบ**
    1. วิเคราะห์ประเภทคำถามให้ชัดเจน:
       - คำถามเชิงขั้นตอน: ตอบเป็นลำดับเหตุการณ์
       - คำถามเชิงรายการ: เผยจำานวนและรายละเอียดทั้งหมด
       - คำถามทั่วไป: อธิบายแบบสรุปใจความสำคัญ
    2. ใช้ภาษาพูดธรรมชาติเหมือนมนุษย์
    3. ระบุข้อมูลเหล่านี้แทรกในเนื้อหา:
       - หน้าที่เกี่ยวข้อง (เช่น "ตามหน้า 12 ข้อ 5.2")
       - ผู้รับผิดชอบ/แผนก
       - ระยะเวลา (ถ้ามี)
       - เอกสารประกอบ (ถ้ามี)
    4. หากข้อมูลไม่ครบ:
       - บอกชัดเจนว่าข้อมูลใดขาดหาย
       - เสนอช่องทางติดต่อที่เกี่ยวข้อง

    🚫 **ข้อห้าม**
    - ใช้สัญลักษณ์หรือรูปแบบข้อความที่ดูเป็นระบบเกินไป (เช่น ➤, ★)
    - แบ่งส่วนคำตอบเป็นหัวข้อย่อยเว้นแต่จำเป็น
    - ใช้คำฟอร์แมลเช่น "ท่าน", "ครับ/ค่ะ"

    ✨ **ตัวอย่างรูปแบบคำตอบ**
    - คำถามเชิงขั้นตอน:
    "เริ่มจากนำาแบบฟอร์มจากระบบส่วนกลาง (หน้า 8) → ส่งให้หัวหน้าแผนกอนุมัติภายใน 3 วัน → ทีมจัดซื้อจะดำเนินการต่อภายใน 2 วันทำการครับ"

    - คำถามเชิงรายการ:
    "มี 4 เอกสารที่ต้องเตรียม: 1) สำเนาบัตรประชาชน 2) ใบคำร้อง 3... โดยทั้งหมดดูตัวอย่างได้ในหน้า 22 ครับ"

    - คำถามทั่วไป:
    "กระบวนการนี้ใช้เวลาเฉลี่ย 7-10 วันทำการ เริ่มนับจากวันที่ได้รับเอกสารครบถ้วน ตามที่อธิบายไว้ในหน้า 30 ครับ"`
  ],
  ["human", "คำถาม: {question}"]
]);