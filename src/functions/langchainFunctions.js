import { ChatOpenAI } from "@langchain/openai"
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {StructuredOutputParser} from 'langchain/output_parsers'
import {z} from 'zod';

const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
});

export async function extractEventInfo(description) {
    console.log("testing this function. the event description is: " + description);
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
        title: z.string().describe("the title of the event occurring"),
        startTime: z
          .string()
          .describe(
            "the start time of the event. Convert times to military time based off a 24 hour clock. For example, 2 pm would be 14:00 and 10:30 am would be 10:30."
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
    tomorrow.setDate(currentDate.getDate() + 1);
    const promptDescription = description + ". the date today is " + currentDate.toDateString();
    const phrase =
      description.concat(
        currentDate.toDateString()
      );
  
    console.log(phrase);
    console.log(promptDescription);
  
    const chain = prompt.pipe(model).pipe(outputParser);
    return await chain.invoke({
      phrase: phrase,
      format_instructions: outputParser.getFormatInstructions(),
    });
  }



