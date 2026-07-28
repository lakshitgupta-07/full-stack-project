import nodemailer from "nodemailer";

export const sendEmail = async (
    to: any,
    subject: string,
    html: any
) => {

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
        logger: true,
        debug: true,
    });


    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
    });
    return info;
};