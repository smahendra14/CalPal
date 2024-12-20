import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

// Email transport configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GOOGLE_APP_PASSWORD,
    },
});

// Get access token from refresh token
async function getAccessToken(refreshToken) {
    try {
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { token } = await oauth2Client.getAccessToken();
        return token; // Return new access token
    } catch (error) {
        console.error("Error refreshing token:", error);
        if (error.response?.data?.error === "invalid_grant") {
            throw new Error("Refresh token is invalid or expired");
        }
        throw new Error("Failed to refresh access token");
    }
}

// Get Google Calendar events using access token
async function getCalendarEvents(accessToken) {
    try {
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        oauth2Client.setCredentials({ access_token: accessToken });

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString(); // Start of day
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString(); // End of day

        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: startOfDay,
            timeMax: endOfDay,
            singleEvents: true,
            orderBy: "startTime",
        });

        return response.data.items; // Array of calendar events
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw new Error("Failed to fetch Google Calendar events.");
    }
}

async function sendEmails() {
    try {
        const { data: users, error } = await supabase
            .from("UserInfo")
            .select("email, refresh_token")
            .eq("send_daily_summary", true);
        if (error) {
            console.error("Error fetching users:", error);
            return;
        }
        if (users.length === 0) {
            console.log("No users opted in for daily summary emails.");
            return;
        }
        for (const user of users) {
            try {
                const accessToken = await getAccessToken(user.refresh_token);
                const events = await getCalendarEvents(accessToken);

                if (!events || events.length === 0) {
                    console.log(`No upcoming events found for ${user.email}`);
                    const mailOptions = {
                        from: process.env.SENDER_EMAIL,
                        to: user.email,
                        subject: "Daily Calendar Summary",
                        text: `Yippee! You're all free! No upcoming events scheduled.`,
                    };
                    await transporter.sendMail(mailOptions);
                    continue;
                }

                const eventSummary = events
                    .map(event => {
                        const startTime = event.start.dateTime || event.start.date;
                        return `${event.summary}: ${new Date(startTime).toLocaleString()}`;
                    })
                    .join("\n");

                // Email message options
                const mailOptions = {
                    from: process.env.SENDER_EMAIL,
                    to: user.email,
                    subject: "Daily Calendar Summary",
                    text: `Here is your daily event summary:\n\n${eventSummary}`,
                };
                await transporter.sendMail(mailOptions);
                console.log(`Daily summary sent to ${user.email}`);
            } catch (error) {
                console.error(`Error sending email to ${user.email}:`, error);
                continue;
            }
        }
        console.log("sent emails out");
    } catch (error) {
        console.error("Error in sendEmails:", error.message);
    }
}

console.log("Running scheduled email job...");
await sendEmails();
