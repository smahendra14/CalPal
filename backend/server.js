import express from "express";
import cors from "cors";
import calendar from "./routes/calendar.js";
import logger from "./middleware/logger.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/error.js";
const port = process.env.PORT || 8000;

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
