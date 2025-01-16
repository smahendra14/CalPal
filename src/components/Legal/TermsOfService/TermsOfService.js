import React from "react";

const TermsOfService = () => {
    return (
        <div
            className="terms-of-service-container"
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
                Terms of Service for CalPal
            </h1>

            <p style={{ marginBottom: "1em" }}>
                Welcome to CalPal! These Terms of Service ("Terms") govern your
                use of our application and services. By accessing or using
                CalPal, you agree to comply with and be bound by these Terms.
            </p>

            <section style={{ marginBottom: "2em" }}>
                <h2
                    style={{
                        fontSize: "1.5em",
                        marginBottom: "0.8em",
                        color: "#222",
                    }}
                >
                    1. Acceptance of Terms
                </h2>
                <p>
                    By accessing or using CalPal, you confirm that you accept
                    these Terms and agree to abide by them. If you do not agree
                    to these Terms, you must not use the app.
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
                    2. Eligibility
                </h2>
                <p>
                    To use CalPal, you must be at least 13 years old. By using
                    the app, you represent that you meet this eligibility
                    requirement.
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
                    3. User Responsibilities
                </h2>
                <ul
                    style={{
                        marginLeft: "20px",
                        marginBottom: "1em",
                    }}
                >
                    <li>
                        You agree to use CalPal only for lawful purposes and in
                        accordance with these Terms.
                    </li>
                    <li>
                        You are responsible for maintaining the security of your
                        account credentials and for all activities that occur
                        under your account.
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
                    4. Prohibited Uses
                </h2>
                <ul
                    style={{
                        marginLeft: "20px",
                        marginBottom: "1em",
                    }}
                >
                    <li>
                        You may not use CalPal in any manner that could harm,
                        disable, overburden, or impair our app or interfere with
                        any other party's use.
                    </li>
                    <li>
                        You may not attempt to gain unauthorized access to the
                        app, accounts, or networks connected to CalPal.
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
                    5. Termination
                </h2>
                <p>
                    We reserve the right to terminate or suspend your access to
                    CalPal at our discretion, without notice, if you violate
                    these Terms.
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
                    6. Limitation of Liability
                </h2>
                <p>
                    To the maximum extent permitted by law, CalPal is not liable
                    for any indirect, incidental, or consequential damages
                    arising from your use of the app.
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
                    7. Modifications to Terms
                </h2>
                <p>
                    We may revise these Terms at any time by updating this page.
                    By continuing to use CalPal, you accept the updated Terms.
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
                    8. Contact Us
                </h2>
                <p>
                    For questions or concerns about these Terms, please contact
                    us at: calpal.ai.official@gmail.com
                </p>
            </section>

            <p
                style={{
                    marginTop: "2em",
                    fontWeight: "bold",
                }}
            >
                User Agreement: By using CalPal, you acknowledge and agree to
                these Terms of Service.
            </p>
        </div>
    );
};

export default TermsOfService;
