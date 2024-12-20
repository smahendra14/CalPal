import express from "express";
import {exchangeRefreshToken} from "../controllers/authController.js";
const router = express.Router();

router.get("/oauth2callback", exchangeRefreshToken);

export default router;
