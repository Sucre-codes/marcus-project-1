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
    percent:'',
    sendersAccountNumber:''
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

      const response = await axios.post('https://mobilebanking-oysy.onrender.com/api/send-credit-alert', {
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
      {/* Mobile-first grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
        
        {/* Form Section */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl shadow-lg order-1">
          <h1 className="mt-0 mb-4 sm:mb-6 text-gray-800 text-2xl sm:text-3xl font-bold">
            Credit Alert Generator
          </h1>
          
          {message.text && (
            <div className={`p-3 px-4 rounded-lg mb-4 sm:mb-5 text-xs sm:text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
              message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 md:gap-5">
            
            {/* Email and Bank Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  required
                  placeholder="customer@example.com"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Bank Name *
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  required
                  placeholder="First National Bank"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Logo and QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Bank Logo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="text-xs sm:text-sm py-2 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {logoUrl && <span className="inline-block mt-1.5 sm:mt-2 text-green-600 text-[10px] sm:text-xs font-semibold">✓ Cached</span>}
              </div>

              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  QR Code (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrCodeChange}
                  className="text-xs sm:text-sm py-2 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {qrCodeUrl && <span className="inline-block mt-1.5 sm:mt-2 text-green-600 text-[10px] sm:text-xs font-semibold">✓ Cached</span>}
              </div>
            </div>

            {/* Brand Color and Percentage */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Brand Color
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="color"
                    name="brandColor"
                    value={formData.brandColor}
                    onChange={handleInputChange}
                    className="w-12 sm:w-[60px] h-9 sm:h-10 border-0 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-xs sm:text-sm text-gray-600 bg-gray-100 py-1.5 sm:py-2 px-2 sm:px-3 rounded flex-1">
                    {formData.brandColor}
                  </span>
                </div>
              </div>
              
              <div className='flex flex-col'>
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Percentage
                </label>
                <input
                  type="number"
                  name="percent"
                  value={formData.percent}
                  onChange={handleInputChange}
                  required
                  placeholder="10"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Recipient Name and Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Recipient Address *
                </label>
                <input
                  type="text"
                  name="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={handleInputChange}
                  required
                  placeholder="123 Main St, NY 10001"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Account Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Receiving Account Number *
                </label>
                <input
                  type="text"
                  name="receivingAccountNumber"
                  value={formData.receivingAccountNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="1234567890"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Routing Number
                </label>
                <input
                  type="text"
                  name="routingNumber"
                  value={formData.routingNumber}
                  onChange={handleInputChange}
                  placeholder="021000021"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* IBAN and Swift */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  IBAN Number
                </label>
                <input
                  type="text"
                  name="ibanNumber"
                  value={formData.ibanNumber}
                  onChange={handleInputChange}
                  placeholder="GB82 WEST 1234 5698 7654 32"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Swift Code
                </label>
                <input
                  type="text"
                  name="swiftCode"
                  value={formData.swiftCode}
                  onChange={handleInputChange}
                  placeholder="BOFAUS3N"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Wallet Address and Sender's Account */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Wallet Address *
                </label>
                <input
                  type="text"
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleInputChange}
                  required
                  placeholder="0x742d35Cc6634C..."
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono truncate"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Sender's Account Number *
                </label>
                <input
                  type="text"
                  name="sendersAccountNumber"
                  value={formData.sendersAccountNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="128876r649"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          
            {/* Sender Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Sender's Name *
                </label>
                <input
                  type="text"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleInputChange}
                  required
                  placeholder="Jane Smith"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Sender's Bank *
                </label>
                <input
                  type="text"
                  name="senderBank"
                  value={formData.senderBank}
                  onChange={handleInputChange}
                  required
                  placeholder="Chase Bank"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Amount, Billing, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  placeholder="1000.00"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Billing Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="billingAmount"
                  value={formData.billingAmount}
                  onChange={handleInputChange}
                  placeholder="950.00"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-semibold mb-1.5 sm:mb-2 text-gray-600 text-xs sm:text-sm">
                  Date & Time
                </label>
                <input
                  type="text"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleInputChange}
                  placeholder="Auto-generated"
                  className="py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="bg-blue-600 text-white py-3 sm:py-3.5 px-5 sm:px-6 border-0 rounded-lg text-sm sm:text-base font-semibold cursor-pointer transition-colors mt-2 sm:mt-2.5 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed w-full touch-manipulation"
              disabled={loading || uploadingLogo}
            >
              {loading ? 'Sending...' : uploadingLogo ? 'Uploading Logo...' : 'Send Credit Alert'}
            </button>
          </form>
        </div>

        {/* Receipt Section - Hidden on mobile until generated, then shown above form */}
        {showReceipt && (
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl shadow-lg order-2 lg:sticky lg:top-5 lg:max-h-[calc(100vh-40px)] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-5">
              <h2 className="m-0 text-gray-800 text-xl sm:text-2xl font-bold">Receipt</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={downloadAsPDF} 
                  className="flex-1 sm:flex-none py-2 sm:py-2.5 px-3 sm:px-5 border-0 rounded-md text-xs sm:text-sm font-semibold cursor-pointer transition-all bg-red-600 text-white hover:bg-red-700 active:bg-red-800 touch-manipulation"
                >
                  PDF
                </button>
                <button 
                  onClick={downloadAsImage} 
                  className="flex-1 sm:flex-none py-2 sm:py-2.5 px-3 sm:px-5 border-0 rounded-md text-xs sm:text-sm font-semibold cursor-pointer transition-all bg-green-600 text-white hover:bg-green-700 active:bg-green-800 touch-manipulation"
                >
                  Image
                </button>
              </div>
            </div>

            <div ref={receiptRef} className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md">
              
              <div className="py-6 sm:py-8 px-4 sm:px-6 md:px-10">
                <div className="mb-4 sm:mb-5">
                  <h3 className="text-green-600 m-0 mb-1 text-lg sm:text-xl">✓ Credit Alert</h3>
                  <p className="text-gray-600 m-0 text-xs sm:text-sm">Transaction Successful</p>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full border-collapse border border-gray-300 rounded my-4 sm:my-5 min-w-[280px]">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-800">Amount</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-sm sm:text-lg text-green-600 font-bold text-right">
                          ${parseFloat(formData.amount || 0).toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300 bg-gray-50">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-800">Date & Time</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-sm text-gray-600 text-right break-words">
                          {formData.dateTime}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-800">Sender's Name</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm text-gray-600 text-right break-words">
                          {formData.senderName}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300 bg-gray-50">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-800">Sender's Bank</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm text-gray-600 text-right break-words">
                          {formData.senderBank}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-800">Recipient Name</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm text-gray-600 text-right break-words">
                          {formData.recipientName}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300 bg-gray-50">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-800">Recipient Address</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm text-gray-600 text-right break-words">
                          {formData.recipientAddress}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-800">Account Number</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm text-gray-600 text-right break-words">
                          {formData.receivingAccountNumber}
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-800">Routing Number</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm text-gray-600 text-right break-words">
                          {formData.routingNumber}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded text-[10px] sm:text-xs leading-relaxed text-yellow-800 mt-4 sm:mt-5">
                  <strong>DISCLAIMER:</strong> This is an automated notification for 
                  informational purposes only. Please verify all transaction details through 
                  your official banking channels. If you did not authorize this transaction, 
                  please contact your bank immediately. Keep this receipt for your records.
                </div>
              </div>

              <div className="bg-gray-50 py-4 sm:py-5 px-4 sm:px-5 text-center border-t border-gray-300">
                <p className="m-0 text-gray-500 text-[10px] sm:text-xs">
                  © {new Date().getFullYear()} {formData.bankName}. All rights reserved.
                </p>
                <p className="mt-2 sm:mt-2.5 text-gray-500 text-[9px] sm:text-[11px]">
                  This is an automated receipt.
                </p>
              </div>
            </div>
          </div>
        )}
      </div> 
    </div>
  );
};

export default CreditAlertForm;
