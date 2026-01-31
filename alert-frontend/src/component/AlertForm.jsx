import React, { useState, useRef } from 'react';
import axios from 'axios';
import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';

const CreditAlertForm = () => {
  const [formData, setFormData] = useState({
    recipientEmail: '',
    bankName: '',
    receivingAccountNumber: '',
    routingNumber: '',
    recipientAddress: '',
    senderBank: '',
    senderName: '',
    recipientName: '',
    amount: '',
    dateTime: new Date().toLocaleString(),
    brandColor: '#0066cc',
    ibanNumber: '',
    swiftCode: '',
    walletAddress: '',
    billingAmount: '',
    percent:''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef(null);

  const CLOUDINARY_UPLOAD_PRESET = 'bank_logo';
  const CLOUDINARY_CLOUD_NAME = 'dxakrcgcz';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const cachedUrl = localStorage.getItem(`logo_${file.name}_${file.size}`);
      if (cachedUrl) {
        setLogoUrl(cachedUrl);
        setMessage({ type: 'info', text: 'Logo loaded from cache' });
      } else {
        setLogoFile(file);
      }
    }
  };

  const handleQrCodeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const cachedUrl = localStorage.getItem(`qr_${file.name}_${file.size}`);
      if (cachedUrl) {
        setQrCodeUrl(cachedUrl);
        setMessage({ type: 'info', text: 'QR code loaded from cache' });
      } else {
        setQrCodeFile(file);
      }
    }
  };

  const uploadLogoToCloudinary = async () => {
    if (!logoFile) {
      if (logoUrl) return logoUrl;
      return '';
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      const uploadedUrl = response.data.secure_url;
      localStorage.setItem(`logo_${logoFile.name}_${logoFile.size}`, uploadedUrl);
      
      setLogoUrl(uploadedUrl);
      setUploadingLogo(false);
      return uploadedUrl;
    } catch (error) {
      setUploadingLogo(false);
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload logo');
    }
  };

  const uploadQrCodeToCloudinary = async () => {
    if (!qrCodeFile) {
      if (qrCodeUrl) return qrCodeUrl;
      return '';
    }

    try {
      const formData = new FormData();
      formData.append('file', qrCodeFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      const uploadedUrl = response.data.secure_url;
      localStorage.setItem(`qr_${qrCodeFile.name}_${qrCodeFile.size}`, uploadedUrl);
      
      setQrCodeUrl(uploadedUrl);
      return uploadedUrl;
    } catch (error) {
      console.error('Error uploading QR code:', error);
      throw new Error('Failed to upload QR code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const finalLogoUrl = await uploadLogoToCloudinary();
      const finalQrCodeUrl = await uploadQrCodeToCloudinary();

      const response = await axios.post('http://localhost:5000/api/send-credit-alert', {
        ...formData,
        logoUrl: finalLogoUrl,
        qrCodeUrl: finalQrCodeUrl
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Credit alert sent successfully!' });
        setShowReceipt(true);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to send credit alert' 
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAsPDF = async () => {
  if (!receiptRef.current) return;

  setMessage({ type: 'info', text: 'Generating PDF...' });

  try {
    const dataUrl = await domtoimage.toPng(receiptRef.current, {
      quality: 1,
      bgcolor: '#ffffff',
      width: receiptRef.current.scrollWidth,
      height: receiptRef.current.scrollHeight,
    });

    const img = new Image();
    img.src = dataUrl;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = img.width;
    const imgHeight = img.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(
      dataUrl,
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );

    pdf.save(`credit-alert-${Date.now()}.pdf`);
    setMessage({ type: 'success', text: 'Receipt downloaded as PDF!' });
  } catch (error) {
    console.error('PDF Error:', error);
    setMessage({ type: 'error', text: 'Failed to generate PDF' });
  }
};

const downloadAsImage = async () => {
  if (!receiptRef.current) return;

  setMessage({ type: 'info', text: 'Generating image...' });

  try {
    const blob = await domtoimage.toBlob(receiptRef.current, {
      quality: 1,
      bgcolor: '#ffffff',
      width: receiptRef.current.scrollWidth,
      height: receiptRef.current.scrollHeight,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `credit-alert-${Date.now()}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: 'Receipt downloaded as image!' });
  } catch (error) {
    console.error('Image Error:', error);
    setMessage({ type: 'error', text: 'Failed to generate image' });
  }
};


  return (
    <div className="max-w-[1400px] mx-auto px-5 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="mt-0 mb-6 text-gray-800 text-3xl font-bold">Credit Alert Generator</h1>
        
        {message.text && (
          <div className={`p-3 px-4 rounded-lg mb-5 text-sm ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Row 1: Email and Bank Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Recipient Email *</label>
              <input
                type="email"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleInputChange}
                required
                placeholder="customer@example.com"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Bank Name *</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                required
                placeholder="First National Bank"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Row 2: Logo and QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Bank Logo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="text-sm py-2"
              />
              {logoUrl && <span className="inline-block mt-2 text-green-600 text-xs font-semibold">✓ Cached</span>}
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">QR Code (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQrCodeChange}
                className="text-sm py-2"
              />
              {qrCodeUrl && <span className="inline-block mt-2 text-green-600 text-xs font-semibold">✓ Cached</span>}
            </div>
          </div>

          {/* Row 3: Brand Color (Full Width) */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-gray-600 text-sm">Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="brandColor"
                value={formData.brandColor}
                onChange={handleInputChange}
                className="w-[60px] h-10 border-0 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-sm text-gray-600 bg-gray-100 py-2 px-3 rounded">{formData.brandColor}</span>
            </div>
          </div>
          <div className='flex flex-col'>
            <label className="font-semibold mb-2 text-gray-600 text-sm">Percentage</label>
            <input
                type="number"
                name="percent"
                value={formData.percent}
                onChange={handleInputChange}
                required
                placeholder="10"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
          </div>
          </div>
          {/* Row 4: Recipient Name and Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Recipient Name *</label>
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                required
                placeholder="John Doe"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Recipient Address *</label>
              <input
                type="text"
                name="recipientAddress"
                value={formData.recipientAddress}
                onChange={handleInputChange}
                required
                placeholder="123 Main St, New York, NY 10001"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Row 5: Account Number and Routing Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Receiving Account Number *</label>
              <input
                type="text"
                name="receivingAccountNumber"
                value={formData.receivingAccountNumber}
                onChange={handleInputChange}
                required
                placeholder="1234567890"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Routing Number</label>
              <input
                type="text"
                name="routingNumber"
                value={formData.routingNumber}
                onChange={handleInputChange}
                placeholder="021000021"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Row 6: IBAN and Swift Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">IBAN Number</label>
              <input
                type="text"
                name="ibanNumber"
                value={formData.ibanNumber}
                onChange={handleInputChange}
                placeholder="GB82 WEST 1234 5698 7654 32"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Swift Code</label>
              <input
                type="text"
                name="swiftCode"
                value={formData.swiftCode}
                onChange={handleInputChange}
                placeholder="BOFAUS3N"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Row 7: Wallet Address (Full Width) */}
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-gray-600 text-sm">Wallet Address *</label>
            <input
              type="text"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={handleInputChange}
              required
              placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
              className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono"
            />
          </div>
        
          {/* Row 8: Sender Name and Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Sender's Name *</label>
              <input
                type="text"
                name="senderName"
                value={formData.senderName}
                onChange={handleInputChange}
                required
                placeholder="Jane Smith"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Sender's Bank *</label>
              <input
                type="text"
                name="senderBank"
                value={formData.senderBank}
                onChange={handleInputChange}
                required
                placeholder="Chase Bank"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Row 9: Amount, Billing Amount, and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Amount *</label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                placeholder="1000.00"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Billing Amount</label>
              <input
                type="number"
                step="0.01"
                name="billingAmount"
                value={formData.billingAmount}
                onChange={handleInputChange}
                placeholder="950.00"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-2 text-gray-600 text-sm">Date & Time</label>
              <input
                type="text"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleInputChange}
                placeholder="Auto-generated"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="bg-blue-600 text-white py-3.5 px-6 border-0 rounded-lg text-base font-semibold cursor-pointer transition-colors mt-2.5 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
            disabled={loading || uploadingLogo}
          >
            {loading ? 'Sending...' : uploadingLogo ? 'Uploading Logo...' : 'Send Credit Alert'}
          </button>
        </form>
      </div>

      {showReceipt && (
        <div className="bg-white p-8 rounded-xl shadow-lg sticky top-5 max-h-[calc(100vh-40px)] overflow-y-auto">
          <div className="flex justify-between items-center mb-5">
            <h2 className="m-0 text-gray-800 text-2xl font-bold">Receipt</h2>
            <div className="flex gap-2.5">
              <button 
                onClick={downloadAsPDF} 
                className="py-2.5 px-5 border-0 rounded-md text-sm font-semibold cursor-pointer transition-all bg-red-600 text-white hover:bg-red-700"
              >
                Download PDF
              </button>
              <button 
                onClick={downloadAsImage} 
                className="py-2.5 px-5 border-0 rounded-md text-sm font-semibold cursor-pointer transition-all bg-green-600 text-white hover:bg-green-700"
              >
                Download Image
              </button>
            </div>
          </div>

          <div ref={receiptRef} className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md">
            
            <div className="py-8 px-10">
              <div className="mb-5">
                <h3 className="text-green-600 m-0 mb-1 text-xl">✓ Credit Alert</h3>
                <p className="text-gray-600 m-0 text-sm">Transaction Successful</p>
              </div>

              <table className="w-full border-collapse border border-gray-300 rounded my-5">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 px-3 text-sm font-semibold text-gray-800 w-1/2">Amount</td>
                    <td className="py-3 px-3 text-sm text-green-600 text-lg font-bold text-right">
                      ${parseFloat(formData.amount || 0).toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <td className="py-3 px-3 text-sm font-semibold text-gray-800">Date & Time</td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-right">{formData.dateTime}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 px-3 text-sm font-semibold text-gray-800">Sender's Name</td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-right">{formData.senderName}</td>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <td className="py-3 px-3 text-sm font-semibold text-gray-800">Sender's Bank</td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-right">{formData.senderBank}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 px-3 text-sm font-semibold text-gray-800">Recipient Name</td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-right">{formData.recipientName}</td>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <td className="py-3 px-3 text-sm font-semibold text-gray-800">Recipient Address</td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-right">{formData.recipientAddress}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 px-3 text-sm font-semibold text-gray-800">Account Number</td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-right">{formData.receivingAccountNumber}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-3 text-sm font-semibold text-gray-800">Routing Number</td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-right">{formData.routingNumber}</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-xs leading-relaxed text-yellow-800 mt-5">
                <strong>DISCLAIMER:</strong> This is an automated notification for 
                informational purposes only. Please verify all transaction details through 
                your official banking channels. If you did not authorize this transaction, 
                please contact your bank immediately. Keep this receipt for your records.
              </div>
            </div>

            <div className="bg-gray-50 py-5 px-5 text-center border-t border-gray-300">
              <p className="m-0 text-gray-500 text-xs">
                © {new Date().getFullYear()} {formData.bankName}. All rights reserved.
              </p>
              <p className="mt-2.5 text-gray-500 text-[11px]">This is an automated receipt.</p>
            </div>
          </div>
        </div>
      )}
    </div> 
  );
};

export default CreditAlertForm;