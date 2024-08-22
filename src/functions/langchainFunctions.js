import { ChatOpenAI } from "@langchain/openai"
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {StructuredOutputParser} from 'langchain/output_parsers'
import {z} from 'zod';
import { key } from "./api.js";

const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    openAIApiKey: key
});

export async function extractEventInfo(description) {
    const response = await callZodOutputParser(description);
    return response;
}

async function callZodOutputParser(description) {
    const prompt = ChatPromptTemplate.fromTemplate(`
      Extract information from the following phrase. 
      Formatting instructions: {format_instructions}
      Phrase: {phrase}
    `);
  
    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        title: z.string().describe("the title of the event occurring. capitalize words as necessary"),
        startTime: z
          .string()
          .describe(
            "the start time of the event. Convert times to military time based off a 24 hour clock. For example, 2 pm would be 14:00 and 10:30 am would be 10:30. If an event is 4 hours from now, the start time would be 4 hours after the current time. Also, as an example, if an event is described as being in 30 minutes, the start time is 30 minutes after the current time"
          ),
        endTime: z
          .string()
          .describe(
            "one hour after the start time of the event. Convert times to military time based off a 24 hour clock. For example, 2 pm would be 14:00 and 10:30 am would be 10:30"
          ),
        date: z.string().describe("the date of the event"),
        calendarStartInputTime: z
          .string()
          .describe(
            "The date and time at which the event is starting in ISO format: YYYY-MM-DDThh:mm:ss"
          ),
        calendarEndInputTime: z
          .string()
          .describe(
            "The date and time at which the event is ending in ISO format: YYYY-MM-DDThh:mm:ss"
          ),
      })
    );

    const currentDate = new Date();
    const tomorrow = new Date();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    tomorrow.setDate(currentDate.getDate() + 1);
    const phrase = description + ". the date today is " + currentDate.toDateString() + `. the time right now is ${hours}:${minutes}`;
  
    const chain = prompt.pipe(model).pipe(outputParser);
    return await chain.invoke({
      phrase: phrase,
      format_instructions: outputParser.getFormatInstructions(),
    });
  }



