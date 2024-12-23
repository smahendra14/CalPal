import express from "express";
import {
    enableDailySummary,
    setDailySummaryTime,
} from "../controllers/settingsController.js";
const router = express.Router();

// Opt-in user for daily email summary
router.put("/enableDailySummary", enableDailySummary);

// Change what time the user will receive daily email summary
router.put("/setDailySummaryTime", setDailySummaryTime);

export default router;
