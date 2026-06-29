const nodemailer = require('nodemailer');

const sendResetPasswordEmail = async (toEmail, userName, token, frontendUrlFromRequest) => {
    const frontendUrl = frontendUrlFromRequest || process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Verificar si la configuración SMTP está completa
    if (!host || !port || !user || !pass) {
        console.log('\n==================================================');
        console.log('📧 [SIMULACIÓN DE CORREO] - CONFIGURACIÓN SMTP INCOMPLETA');
        console.log(`Para: ${toEmail} (${userName})`);
        console.log(`Token de recuperación: ${token}`);
        console.log(`Enlace de recuperación: ${resetUrl}`);
        console.log('Para enviar correos reales, configure las siguientes variables en su archivo .env:');
        console.log('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
        console.log('==================================================\n');
        
        return {
            success: true,
            simulated: true,
            resetUrl,
            token
        };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(port),
            secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
            auth: {
                user: user,
                pass: pass
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"TechZone" <noreply@techzone.com>',
            to: toEmail,
            subject: 'Restablecer contraseña - TechZone',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #333333; margin: 0;">TechZone</h2>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eeeeee; margin-bottom: 20px;">
                    <p>Hola, <strong>${userName}</strong>,</p>
                    <p>Has solicitado restablecer tu contraseña para acceder a la plataforma de TechZone. Haz clic en el siguiente botón para continuar con el proceso:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer mi contraseña</a>
                    </div>
                    <p style="color: #666666; font-size: 14px;">Este enlace es válido por 1 hora. Si tú no solicitaste este cambio, puedes ignorar este correo con seguridad.</p>
                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">Este es un correo automático, por favor no respondas a este mensaje.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Correo de recuperación enviado a ${toEmail}: ${info.messageId}`);
        return {
            success: true,
            simulated: false
        };
    } catch (error) {
        console.error('❌ Error al enviar el correo de recuperación:', error);
        throw new Error('No se pudo enviar el correo de recuperación de contraseña.');
    }
};

module.exports = { sendResetPasswordEmail };
