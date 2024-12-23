// @desc    Opt-in user for daily email updates
// @route   PUT api/settings/enableDailySummary
export const enableDailySummary = (req, res, next) => {
    res.status(200).json({ msg: "testing enable daily summary route" });
};

// @desc    Change what time the user will receive daily email summary
// @route   PUT api/settings/setDailySummaryTime
export const setDailySummaryTime = (req, res, next) => {
    res.status(200).json({ msg: "testing set daily summary time route" });
};


