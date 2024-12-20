import express from "express";
import { extractSingleEventInfo, getEventsToday } from "../controllers/calendarController.js";
const router = express.Router();

// Extract event information
router.post("/extractSingleEventInfo", extractSingleEventInfo);

// Get information about events scheduled today
router.get("/getEventsToday", getEventsToday);

export default router;
