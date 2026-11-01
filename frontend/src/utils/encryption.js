import CryptoJS from "crypto-js";

// Get encryption key from environment variable
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;

/**
 * Encrypts a token using AES encryption
 * @param {string} token - The token to encrypt
 * @returns {string} - Base64 encoded encrypted token
 */
export const encryptToken = (token) => {
    if (!token) throw new Error("Token is required for encryption");

    try {
        const encrypted = CryptoJS.AES.encrypt(
            token,
            ENCRYPTION_KEY
        ).toString();
        return encrypted;
    } catch (error) {
        throw new Error("Failed to encrypt token: " + error.message);
    }
};