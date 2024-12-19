import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  temperature: 0,
  apiKey: process.env.REACT_APP_GEMINI_API_KEY,
});

const EventSchema = z.object({
  title: z
    .string()
    .describe(
      "the title of the event occurring. capitalize words as necessary"
    ),
  startTime: z
    .string()
    .describe(
      "the start time of the event. Convert times to military time based off a 24 hour clock. For example, 2 pm would be 14:00 and 10:30 am would be 10:30. If an event is 4 hours from now, the start time would be 4 hours after the current time. Also, as an example, if an event is described as being in 30 minutes, the start time is 30 minutes after the current time. unless specified otherwise, start times should be in the future from the current date and time"
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
    ).nullable(),
  calendarEndInputTime: z
    .string()
    .describe(
      "The date and time at which the event is ending in ISO format: YYYY-MM-DDThh:mm:ss"
    ).nullable(),
});

const EventsSchema = z.array(EventSchema);

export async function extractEventInfo(description) {
  const response = await callZodOutputParser(description);
  return response;
}

export async function extractEventInfoFromFile(description) {
  const prompt = ChatPromptTemplate.fromTemplate(`
    From the following PDF file content, extract information about ALL scheduled events like 
    assignments, tests, classes, or other events. 
    If there are no events described, do not parse it.

    The output should have the following fields:
    - title: string
    - startTime: string
    - endTime: string
    - date: string
    - calendarStartInputTime: string (leave empty string "" if not applicable)
    - calendarEndInputTime: string (leave empty string "" if not applicable)

    Formatting instructions: {format_instructions}
    Phrase: {phrase}
  `);

  const outputParser = StructuredOutputParser.fromZodSchema(EventsSchema);

  const currentDate = new Date();
  const tomorrow = new Date();
  // const hours = currentDate.getHours();
  // const minutes = currentDate.getMinutes();
  tomorrow.setDate(currentDate.getDate() + 1);
  const phrase = description;
  console.log("made it here");
  const chain = prompt.pipe(model).pipe(outputParser);
  return await chain.invoke({
    phrase: phrase,
    format_instructions: outputParser.getFormatInstructions(),
  });
}

async function callZodOutputParser(description) {
  const prompt = ChatPromptTemplate.fromTemplate(`
      Extract information about a scheduled event from the following phrase. If the description is not about an event, do not parse it.
      Formatting instructions: {format_instructions}
      Phrase: {phrase}
    `);

  const outputParser = StructuredOutputParser.fromZodSchema(EventSchema);

  const currentDate = new Date();
  const tomorrow = new Date();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  tomorrow.setDate(currentDate.getDate() + 1);
  const phrase =
    description +
    ". the date today is " +
    currentDate.toDateString() +
    `. the time right now is ${hours}:${minutes}`;

  const chain = prompt.pipe(model).pipe(outputParser);
  return await chain.invoke({
    phrase: phrase,
    format_instructions: outputParser.getFormatInstructions(),
  });
}
