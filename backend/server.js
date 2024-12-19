import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import calendar from "./routes/calendar.js";
import logger from "./middleware/logger.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/error.js";
const port = process.env.PORT || 8000;

// Email message options
const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: process.env.RECEIVER_EMAIL,
    subject: "testing email",
    text: "hi this is testing nodemailer",
};

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

// Send email
// transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log("Email send:", info.response);
//     }
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
