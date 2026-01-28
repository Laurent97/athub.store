interface EmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const emailService = {
  async sendContactEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      // Use the serverless function to send the email
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: result.message || 'Message sent successfully! We\'ll be in touch soon.'
        };
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: 'Failed to send message. Please try again.'
      };
    }
  },

  // Alternative method for server-side implementation (future enhancement)
  async sendContactEmailServer(data: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      // This would be implemented with a backend service like:
      // - Netlify Functions
      // - Vercel Serverless Functions  
      // - Supabase Edge Functions
      // - Express.js backend
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'support@athub.store',
          from: data.email,
          subject: `Contact Form: ${data.subject}`,
          text: `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`,
          html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <hr>
            <p><strong>Message:</strong></p>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
          `
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Message sent successfully! We\'ll be in touch soon.'
        };
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email via server:', error);
      return {
        success: false,
        message: 'Failed to send message. Please try again later.'
      };
    }
  }
};
