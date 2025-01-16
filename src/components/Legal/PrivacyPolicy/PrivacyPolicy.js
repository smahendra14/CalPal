import React from "react";

const PrivacyPolicy = () => {
    return (
        <div
            className="privacy-policy-container"
            style={{
                maxWidth: "800px",
                margin: "40px auto",
                padding: "20px",
                lineHeight: "1.6",
                color: "#333",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            <h1
                style={{
                    fontSize: "2em",
                    marginBottom: "1em",
                    color: "#222",
                }}
            >
                Privacy Policy for CalPal
            </h1>

            <p style={{ marginBottom: "1em" }}>
                Welcome to CalPal. Your privacy is important to us, and this
                Privacy Policy explains how we collect, use, and protect your
                information when you use our app. By using CalPal, you agree to
                the collection and use of information in accordance with this
                Privacy Policy.
            </p>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    1. Information We Collect
                </h2>

                <h3
                    style={{
                        fontSize: "1.2em",
                        marginBottom: "0.5em",
                    }}
                >
                    a. Personal Information
                </h3>
                <ul
                    style={{
                        marginLeft: "20px",
                        marginBottom: "1em",
                    }}
                >
                    <li>
                        Google Account Information: To integrate with your
                        Google Calendar, we collect your Google account email
                        address upon authorization.
                    </li>
                    <li>
                        User Inputs: Any natural language input you provide for
                        scheduling events is processed to generate corresponding
                        calendar entries. However, this information is not
                        stored.
                    </li>
                </ul>

                <h3
                    style={{
                        fontSize: "1.2em",
                        marginBottom: "0.5em",
                    }}
                >
                    b. Calendar Information
                </h3>
                <ul
                    style={{
                        marginLeft: "20px",
                        marginBottom: "1em",
                    }}
                >
                    <li>
                        With your explicit consent, we access and modify your
                        Google Calendar to schedule events based on your inputs.
                    </li>
                    <li>
                        We collect event details such as titles, descriptions,
                        times, and locations solely to provide and improve the
                        service.
                    </li>
                </ul>

                <h3
                    style={{
                        fontSize: "1.2em",
                        marginBottom: "0.5em",
                    }}
                >
                    c. Email Information
                </h3>
                <p>
                    To send daily summaries of your calendar events, we store
                    your email address and event data necessary to generate
                    these summaries.
                </p>

                <h3
                    style={{
                        fontSize: "1.2em",
                        marginBottom: "0.5em",
                    }}
                >
                    d. Analytics and Usage Data
                </h3>
                <p>
                    We may collect anonymized data about app usage patterns,
                    such as feature interactions, to improve app performance and
                    functionality.
                </p>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    2. How We Use Your Information
                </h2>
                <p>
                    We use the information collected for the following purposes:
                </p>
                <ul
                    style={{
                        marginLeft: "20px",
                        marginBottom: "1em",
                    }}
                >
                    <li>
                        Service Delivery: Scheduling calendar events based on
                        your input and sending daily event summaries via email.
                    </li>
                    <li>
                        Improvements: Enhancing app features and user
                        experience.
                    </li>
                    <li>
                        Compliance: Fulfilling legal and regulatory
                        requirements, including app verification by Google.
                    </li>
                </ul>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    3. How We Share Your Information
                </h2>
                <p>
                    We do not sell or share your personal information with third
                    parties, except in the following cases:
                </p>
                <p>
                    Legal Compliance: We may disclose information as required by
                    law or to protect rights, property, or safety.
                </p>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    4. Data Security
                </h2>
                <p>
                    We take data security seriously and employ reasonable
                    safeguards to protect your information from unauthorized
                    access, loss, or misuse. This includes:
                </p>
                <ul
                    style={{
                        marginLeft: "20px",
                        marginBottom: "1em",
                    }}
                >
                    <li>
                        End-to-end encryption when accessing your Google
                        Calendar data.
                    </li>
                    <li>Storing sensitive information securely.</li>
                </ul>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    5. User Choices and Controls
                </h2>
                <ul
                    style={{
                        marginLeft: "20px",
                        marginBottom: "1em",
                    }}
                >
                    <li>
                        Google Account Permissions: You can revoke access to
                        your Google account at any time through your Google
                        Account settings.
                    </li>
                    <li>
                        Email Preferences: You can opt out of receiving daily
                        summaries via a "Disable Daily Summary" button included
                        on the CalPal website.
                    </li>
                </ul>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    6. Third-Party Integrations
                </h2>
                <p>
                    CalPal integrates with Google Calendar for core
                    functionality. By using the app, you agree to Google's
                    Privacy Policy.
                </p>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    7. Data Retention
                </h2>
                <p>
                    We retain your information only as long as necessary to
                    provide the service or comply with legal obligations. The
                    information such as your calendar events or event
                    descriptions does not get stored.
                </p>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    8. Children's Privacy
                </h2>
                <p>
                    CalPal is not intended for users under the age of 13. We do
                    not knowingly collect personal information from children.
                </p>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    9. Changes to This Privacy Policy
                </h2>
                <p>
                    We may update this Privacy Policy from time to time. Users
                    will be notified of any significant changes via app
                    notifications or email.
                </p>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    10. Contact Us
                </h2>
                <p>
                    If you have questions or concerns about this Privacy Policy,
                    please contact us at: calpal.ai.official@gmail.com
                </p>
            </section>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    11. Authentication Services
                </h2>
                <p>
                    We use Supabase to manage user authentication for CalPal.
                    During signup and login, the following data may be
                    processed:
                </p>
                <ul
                    style={{
                        marginLeft: "20px",
                        marginBottom: "1em",
                    }}
                >
                    <li>Your email address (required for authentication).</li>
                    <li>
                        Metadata about login attempts (e.g., timestamps, IP
                        addresses for security purposes).
                    </li>
                </ul>

                <h3
                    style={{
                        fontSize: "1.2em",
                        marginBottom: "0.5em",
                    }}
                >
                    How We Use Authentication Data
                </h3>
                <p>
                    The authentication data processed by Supabase is used solely
                    to verify your identity, facilitate secure access to CalPal,
                    and maintain the integrity of your account.
                </p>

                <h3
                    style={{
                        fontSize: "1.2em",
                        marginBottom: "0.5em",
                    }}
                >
                    Third-Party Data Handling
                </h3>
                <p>
                    Authentication data is processed by Supabase in accordance
                    with their Privacy Policy, which you can review at Supabase
                    Privacy Policy.
                </p>

                <h3
                    style={{
                        fontSize: "1.2em",
                        marginBottom: "0.5em",
                    }}
                >
                    Data Security
                </h3>
                <p>
                    We implement industry-standard encryption for transmitting
                    and storing authentication data. Supabase also follows
                    stringent security protocols to protect user data.
                </p>

                <h3
                    style={{
                        fontSize: "1.2em",
                        marginBottom: "0.5em",
                    }}
                >
                    User Rights
                </h3>
                <p>
                    You can request to delete your account and associated
                    authentication data by contacting us at
                    calpal.ai.official@gmail.com.
                </p>
            </section>

            <p
                style={{
                    marginTop: "2em",
                    fontWeight: "bold",
                }}
            >
                User Agreement: By using CalPal, you acknowledge and agree to
                this Privacy Policy.
            </p>
        </div>
    );
};

export default PrivacyPolicy;
