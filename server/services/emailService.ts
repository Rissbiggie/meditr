import nodemailer from 'nodemailer';
import { config } from '../config';

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.appPassword, // Use App Password, not regular Gmail password
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const emailService = {
  /**
   * Send emergency response notification email
   */
  async sendEmergencyNotification(
    userEmail: string,
    emergencyType: string,
    emergencyId: number,
    responseDetails: {
      estimatedArrivalTime?: string;
      responderContact?: string;
      facilityName?: string;
    }
  ) {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Emergency Response Update</h2>
        <p>Help is on the way for your ${emergencyType} emergency (ID: ${emergencyId}).</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Response Details:</h3>
          ${responseDetails.estimatedArrivalTime ? 
            `<p>📍 Estimated Arrival Time: ${responseDetails.estimatedArrivalTime}</p>` : ''}
          ${responseDetails.responderContact ? 
            `<p>📞 Responder Contact: ${responseDetails.responderContact}</p>` : ''}
          ${responseDetails.facilityName ? 
            `<p>🏥 Assigned Facility: ${responseDetails.facilityName}</p>` : ''}
        </div>

        <p style="color: #374151;">Please stay calm and follow any instructions provided by emergency responders.</p>
        
        <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #991b1b; margin: 0;">
            <strong>Important:</strong> If your situation worsens or changes, please contact emergency services immediately.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 0.875rem;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;

    const mailOptions: EmailOptions = {
      to: userEmail,
      subject: `Emergency Response Update - Help is on the way`,
      html: emailContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Emergency notification email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending emergency notification email:', error);
      throw error;
    }
  },

  /**
   * Send a test email to verify configuration
   */
  async sendTestEmail(to: string) {
    const mailOptions: EmailOptions = {
      to,
      subject: 'Test Email from MediTrack',
      html: '<h1>Test Email</h1><p>If you receive this, email notifications are working correctly.</p>',
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Test email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
}; 