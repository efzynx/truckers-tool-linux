import express from 'express';
import nodemailer from 'nodemailer';
import { getSettings } from '../utils/settings.js';

const router = express.Router();

router.post('/support', async (req, res) => {
  try {
    const { name, version, message } = req.body;

    if (!name || !version || !message) {
      return res.status(400).json({ error: 'Data pelapor tidak lengkap (butuh name, version, message)' });
    }

    const settings = getSettings();

    // Check if SMTP is configured
    if (!settings.smtp || !settings.smtp.host) {
      return res.status(503).json({ error: 'Fitur Support belum diaktifkan (SMTP belum disetel oleh Admin).' });
    }

    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: settings.smtp.host,
      port: settings.smtp.port,
      secure: settings.smtp.secure,
      auth: {
        user: settings.smtp.user,
        pass: settings.smtp.pass,
      },
    });

    // Email options
    const mailOptions = {
      from: '"Truckers Tool Support" <support.ttl@efzyn.my.id>', // sender address
      to: settings.admin.email, // list of receivers
      subject: `[Support TTL] Laporan dari: ${name}`, // Subject line
      text: `Nama Pelapor: ${name}\nVersi Game: ${version}\n\nIsi Laporan:\n${message}`, // plain text body
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Laporan Bug / Kendala Truckers Tool</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 120px;">Nama Pelapor</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Versi Game</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${version}</td>
            </tr>
          </table>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #f98c06;">
            <strong>Isi Laporan:</strong><br><br>
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="font-size: 12px; color: #777; margin-top: 30px;">
            Email dikirim otomatis oleh sistem Truckers Tool Linux Support System.
          </p>
        </div>
      `, // html body
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Laporan berhasil dikirim' });
  } catch (error: any) {
    console.error('Error sending support email:', error);
    res.status(500).json({ 
      error: 'Gagal mengirim email laporan kendala',
      details: error.message
    });
  }
});

export default router;
