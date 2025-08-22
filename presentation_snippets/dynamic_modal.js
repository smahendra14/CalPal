if (parsedResponse.action && parsedResponse.payload) {
    if (parsedResponse.message) {
        const botTextMessage = {
            author: "bot",
            text: parsedResponse.message,
        };
        setMessages((prev) => [...prev, botTextMessage]);
    }

    switch (parsedResponse.action) {
        case "CONFIRM_CREATE_EVENT":
            setPendingEvent(parsedResponse.payload);
            setShowConfirmModal(true);
            break;

        case "DISPLAY_TODAY_EVENTS":
            setTodayEvents(parsedResponse.payload.events || []);
            setShowEventsModal(true);
            break;

        default:
            console.warn(
                "Received unknown action:",
                parsedResponse.action
            );
            // Even if the action is unknown, we've already shown the message.
            break;
    }
} else {
    // The JSON was valid but didn't have the expected action/payload format.
    const botMessage = { author: "bot", text: response };
    setMessages((prev) => [...prev, botMessage]);
}