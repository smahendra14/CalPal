// @desc
// @route
export const exchangeRefreshToken = async (req, res, next) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send("Authorization code not provided.");
    }

    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Set tokens for future requests
        oauth2Client.setCredentials(tokens);

        res.status(200).send("Authorization successful!");
    } catch (error) {
        console.error("Error exchanging code for tokens:", error);
        res.status(500).send("Failed to retrieve tokens.");
    }
};
