import express from "express";
import { extractSingleEventInfo } from "../controllers/calendarController.js";
const router = express.Router();

// Extract event information
router.post("/extractSingleEventInfo", extractSingleEventInfo);

export default router;
