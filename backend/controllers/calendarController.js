import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { google } from "googleapis";

const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-pro",
    temperature: 0,
    apiKey: process.env.GEMINI_API_KEY,
});

const EventSchema = z.object({
    title: z
        .string()
        .describe("The title of the event, with necessary words capitalized."),
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
    date: z
        .string()
        .describe("the date of the event in the format 'YYYY-MM-DD'"),
    calendarStartInputTime: z
        .string()
        .describe(
            "The date and time at which the event is starting in ISO 8601 format: YYYY-MM-DDThh:mm:ss"
        ),
    calendarEndInputTime: z
        .string()
        .describe(
            "The date and time at which the event is ending in ISO 8601 format: YYYY-MM-DDThh:mm:ss"
        ),
});

async function callZodOutputParser(description) {
    try {
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
    } catch (error) {
        console.error("Error parsing event description:", error);
        throw error;
    }
}

// @desc    Get details for a single event from description
// @route   POST api/calendar/extractSingleEventInfo
export const extractSingleEventInfo = async (req, res, next) => {
    try {
        const { eventDescription } = req.body;

        // Validate input
        if (!eventDescription || typeof eventDescription !== "string") {
            return res.status(400).json({
                error: "Invalid input: eventDescription is required and must be a string.",
            });
        }

        const response = await callZodOutputParser(eventDescription);

        // Validate response with schema
        if (!response || Object.keys(response).length === 0) {
            return res.status(422).json({
                error: "Failed to extract event details. Response is empty or invalid.",
            });
        }

        res.status(200).json(response);
    } catch (error) {
        if (error.name === "ZodError") {
            console.error("Schema Validation Error:", error.errors);
            return res.status(422).json({
                error: "Schema validation failed.",
                details: error.errors,
            });
        }

        console.error("Error extracting event info:", error);

        if (error.name === "APIError" || error.code === "ENOTFOUND") {
            return res.status(503).json({
                error: "Service unavailable. Please try again later.",
            });
        }

        res.status(500).json({ error: "Internal Server Error." });
    }
};

// @desc    Get all events scheduled today
// @route   GET api/calendar/getEventsToday
export const getEventsToday = async (req, res, next) => {
    // const { email, refresh_token } = req.body;

    const refresh_token ='1//05Dlo1mvcRrxwCgYIARAAGAUSNwF-L9Ir03bjBJqibIxJN7oG1tlnzGKJPMU2wFVGzwSr2tsjYjW5AUkM3Ge1nhlUDC4HmGrjGb4'
    const email = 'satvik.mahendra@gmail.com'

    try {
        // Set up OAuth2 client with refresh token
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID, // Replace with your client ID
            process.env.GOOGLE_CLIENT_SECRET, // Replace with your client secret
            process.env.REDIRECT_URI // Replace with your redirect URI
        );

        // Use the refresh token to get a new access token
        oauth2Client.setCredentials({
            refresh_token,
        });

        // Instantiate the Calendar API with the authorized client
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        // Get the date for "today" (start and end of the day)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Call the calendar API to get events for today
        const response = await calendar.events.list({
            calendarId: 'satvik.mahendra@gmail.com', // The user's email is used as the calendarId
            timeMin: startOfToday.toISOString(),
            timeMax: endOfToday.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = response.data.items;

        // Check if any events are found
        if (events.length === 0) {
            res.status(200).json({ message: "No events for today." });
        } else {
            res.status(200).json({ events });
        }
    } catch (error) {
        console.error("Error retrieving events:", error);
        res.status(500).json({ error: "Failed to retrieve events." });
    }
};
