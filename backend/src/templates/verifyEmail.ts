export const verifyEmailTemplate = (
    username: string,
    verifyUrl: string
) => {
    return `
        <h2>Hello ${username}</h2>

        <p>
            Thank you for registering.
        </p>

        <p>
            Click the button below to verify your email.
        </p>

        <a
            href="${verifyUrl}"
            style="
                background:#2563eb;
                color:white;
                padding:12px 20px;
                text-decoration:none;
                border-radius:6px;
            "
        >
            Verify Email
        </a>

        <p>
            This link expires in 24 hours.
        </p>
    `;
};