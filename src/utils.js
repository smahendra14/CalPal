// import langchain stuff


export async function createCalendarEvent(eventDescription) {
    console.log("creating calendar event");

    // created chat model 

    // create structured output parser 

    // make api call
    const event = {
        'summary': eventName,
        'description': eventDescription,
        'start': {
            'dateTime': start.toISOString(), // Date.toISOString(), get this as output from langchain in the right format
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // get your current time zone
        },
        'end': {
            'dateTime': end.toISOString(), // Date.toISOString(), get this as output from langchain in the right format
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // get your current time zone
        }
        await fetch("https://googleapis.com/calendar/v3/calendars/primary/events", {
            method: "POST",
            headers: {
                'Authorization':'Bearer ' + session.provider_token// access token for google
            }
        })
    }


}