import nodemailer from "nodemailer";

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function POST(req) {
  try {
    const { name, email, message, website } = await req.json();

    // Si el campo trampa viene lleno es un bot: respondemos ok sin enviar nada
    if (website) return Response.json({ ok: true });

    if (!name?.trim() || !message?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "")) {
      return Response.json({ error: "Datos inválidos" }, { status: 400 });
    }
    if (name.length > 100 || email.length > 200 || message.length > 5000) {
      return Response.json({ error: "Mensaje demasiado largo" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `Nuevo mensaje del portafolio — ${name}`,
      html: `
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return Response.json({ error: "Error al enviar el correo" }, { status: 500 });
  }
}
