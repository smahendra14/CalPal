import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import calendar from "./routes/calendar.js";
import logger from "./middleware/logger.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/error.js";
const port = process.env.PORT || 8000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function sendEmails() {
    const { data: users, error } = await supabase
        .from("UserInfo")
        .select("*")
        .eq("send_daily_summary", true);
    console.log(users);
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }
    if (users.length === 0) {
        console.log("No users opted in for daily summary emails.");
        return;
    }
    for (const user of users) {
        // Email message options
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Daily Calendar Summary",
            text: "here is your daily event summary",
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Daily summary sent to ${user.email}`);
        } catch (error) {
            console.error(`Error sending email to ${user.email}:`, error);
        }
    }
}

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

// Send email at scheduled time
// cron.schedule("* * * * *", async () => {
//     console.log("Running scheduled email job...");
//     await sendEmails();
// });

const app = express();

app.use(
    cors({
        origin: "http://localhost:3000",
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logger middleware
app.use(logger);

// Routes
app.use("/api/calendar", calendar);

// Error handler
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server is running on port ${port}`));
