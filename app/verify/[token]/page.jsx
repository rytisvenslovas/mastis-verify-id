'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ID_TYPES, ID_TYPE_LABELS, ADDRESS_PROOF_TYPES, ADDRESS_PROOF_TYPE_LABELS } from '../../../lib/constants';

export default function VerifyPage() {
  const params = useParams();
  const token = params.token;
  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState(null);
  const [error, setError] = useState(null);
  
  // Form state
  const [idType, setIdType] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [addressProofType, setAddressProofType] = useState('');
  const [addressProofFile, setAddressProofFile] = useState(null);
  const [addressPreview, setAddressPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  
  // Webcam state
  const [showWebcam, setShowWebcam] = useState(false);
  const [stream, setStream] = useState(null);
  
  // Build steps array based on requirements
  const steps = [];
  if (linkData?.require_id) steps.push('id');
  if (linkData?.require_selfie) steps.push('selfie');
  if (linkData?.require_address_proof) steps.push('address');
  steps.push('review'); // Final review step

  useEffect(() => {
    if (token) {
      fetchLinkData();
    }
  }, [token]);

  const fetchLinkData = async () => {
    try {
      const res = await fetch(`/api/verify-link?token=${token}`);
      const result = await res.json();
      
      console.log('Verify link result:', result);
      
      if (!res.ok) {
        setError(result.error || 'Invalid or expired link');
        return;
      }
      
      // Check if submission exists (regardless of status)
      console.log('Submission data:', result.data.submission);
      if (result.data.submission) {
        setError('Documents already submitted! ✅');
        return;
      }
      
      setLinkData(result.data);
    } catch (err) {
      console.error('Error fetching link data:', err);
      setError('Failed to load verification page');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setUploading(true);

    try {
      // Create FormData with all files and metadata
      const formData = new FormData();
      formData.append('token', token);
      
      if (linkData.require_id && idFile) {
        formData.append('idType', idType);
        formData.append('idFile', idFile);
      }

      if (linkData.require_selfie && selfieFile) {
        formData.append('selfieFile', selfieFile);
      }

      if (linkData.require_address_proof && addressProofFile) {
        formData.append('addressProofType', addressProofType);
        formData.append('addressProofFile', addressProofFile);
      }

      // Upload to Cloudinary AND save to Supabase in one API call
       await fetch('/api/upload-and-submit', {
        method: 'POST',
        body: formData,
      });

    //   const result = await res.json();

    //   if (!res.ok) {
    //     // Show detailed error info on phone
    //     const errorMsg = [
    //       `❌ ${result.error}`,
    //       ``,
    //       `Step: ${result.step || 'unknown'}`,
    //       result.details ? `Details: ${result.details}` : '',
    //       result.insertData ? `Data sent: ${JSON.stringify(result.insertData, null, 2)}` : ''
    //     ].filter(Boolean).join('\n');
        
    //     throw new Error(errorMsg);
    //   }

      // Success!
      alert('Documents submitted successfully! ✅');
      window.location.reload();
    } catch (error) {
      console.error('Submission error:', error);
      // Show full error message on phone
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (file, type) => {
    if (!file) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    switch (type) {
      case 'id':
        setIdFile(file);
        setIdPreview(previewUrl);
        break;
      case 'selfie':
        setSelfieFile(file);
        setSelfiePreview(previewUrl);
        break;
      case 'address':
        setAddressProofFile(file);
        setAddressPreview(previewUrl);
        break;
    }
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      setStream(mediaStream);
      setShowWebcam(true);
      
      // Set video source
      setTimeout(() => {
        const video = document.getElementById('webcam-video');
        if (video) {
          video.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error('Error accessing webcam:', err);
      alert('Could not access webcam. Please allow camera permissions or upload a photo instead.');
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowWebcam(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById('webcam-video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(blob));
      stopWebcam();
    }, 'image/jpeg', 0.9);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const step = steps[currentStep];
    
    if (step === 'id') {
      return idType && idFile;
    }
    if (step === 'selfie') {
      return selfieFile;
    }
    if (step === 'address') {
      return addressProofType && addressProofFile;
    }
    return true; // review step
  };

  const renderStep = () => {
    const step = steps[currentStep];

    if (step === 'id') {
      return (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📇</div>
            <h2 className="text-2xl font-bold text-gray-800">ID Document</h2>
            <p className="text-gray-600 mt-2">Upload your identification document</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Type *
            </label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select ID type...</option>
              {Object.entries(ID_TYPES).map(([_key, value]) => (
                <option key={value} value={value}>
                  {ID_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          {idType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ID Photo *
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e.target.files[0], 'id')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Accepts: JPEG, PNG, PDF, etc.</p>
            </div>
          )}

          {idPreview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              {idFile.type === 'application/pdf' ? (
                <iframe
                  src={idPreview}
                  className="w-full h-96 rounded-lg border-2 border-green-500"
                  title="ID Document Preview"
                />
              ) : (
                <img
                  src={idPreview}
                  alt="ID Preview"
                  className="max-w-full h-auto rounded-lg border-2 border-green-500"
                />
              )}
              <p className="mt-2 text-sm text-green-600">✓ {idFile.name}</p>
            </div>
          )}
        </div>
      );
    }

    if (step === 'selfie') {
      return (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🤳</div>
            <h2 className="text-2xl font-bold text-gray-800">Selfie</h2>
            <p className="text-gray-600 mt-2">Take a selfie with your camera</p>
          </div>

          {!showWebcam && !selfiePreview && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={startWebcam}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                📷 Open Camera
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                  capture="user"
                  onChange={(e) => handleFileChange(e.target.files[0], 'selfie')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-4 file:px-6
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-600 file:text-white
                    hover:file:bg-green-700 file:cursor-pointer cursor-pointer
                    file:transition-colors"
                />
                <p className="mt-2 text-xs text-gray-500 text-center">Accepts: JPEG, PNG, HEIC</p>
              </label>
            </div>
          )}

          {showWebcam && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  id="webcam-video"
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  📸 Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopWebcam}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {selfiePreview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <img
                src={selfiePreview}
                alt="Selfie Preview"
                className="max-w-full h-auto rounded-lg border-2 border-green-500"
              />
              <div className="mt-4 flex gap-4">
                <p className="flex-1 text-sm text-green-600">✓ Photo captured</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelfieFile(null);
                    setSelfiePreview(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Retake
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step === 'address') {
      return (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-gray-800">Proof of Address</h2>
            <p className="text-gray-600 mt-2">Upload your address verification document</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type *
            </label>
            <select
              value={addressProofType}
              onChange={(e) => setAddressProofType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select document type...</option>
              {Object.entries(ADDRESS_PROOF_TYPES).map(([_key, value]) => (
                <option key={value} value={value}>
                  {ADDRESS_PROOF_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          {addressProofType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document *
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e.target.files[0], 'address')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Accepts: JPEG, PNG, PDF, HEIC, etc.</p>
            </div>
          )}

          {addressPreview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              {addressProofFile.type === 'application/pdf' ? (
                <iframe
                  src={addressPreview}
                  className="w-full h-96 rounded-lg border-2 border-green-500"
                  title="Address Proof Preview"
                />
              ) : (
                <img
                  src={addressPreview}
                  alt="Address Proof Preview"
                  className="max-w-full h-auto rounded-lg border-2 border-green-500"
                />
              )}
              <p className="mt-2 text-sm text-green-600">✓ {addressProofFile.name}</p>
            </div>
          )}
        </div>
      );
    }

    if (step === 'review') {
      return (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800">Review & Submit</h2>
            <p className="text-gray-600 mt-2">Please review your documents before submitting</p>
          </div>

          {linkData.require_id && idFile && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">📇 ID Document</h3>
              <p className="text-sm text-gray-600 mb-2">Type: {idType.replace('_', ' ')}</p>
              {idFile.type === 'application/pdf' ? (
                <iframe
                  src={idPreview}
                  className="w-full h-96 rounded-lg"
                  title="ID Document"
                />
              ) : (
                <img
                  src={idPreview}
                  alt="ID"
                  className="max-w-full h-auto rounded-lg"
                />
              )}
            </div>
          )}

          {linkData.require_selfie && selfieFile && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">🤳 Selfie</h3>
              <img
                src={selfiePreview}
                alt="Selfie"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {linkData.require_address_proof && addressProofFile && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">🏠 Proof of Address</h3>
              <p className="text-sm text-gray-600 mb-2">Type: {addressProofType.replace('_', ' ')}</p>
              {addressProofFile.type === 'application/pdf' ? (
                <iframe
                  src={addressPreview}
                  className="w-full h-96 rounded-lg"
                  title="Address Proof"
                />
              ) : (
                <img
                  src={addressPreview}
                  alt="Address Proof"
                  className="max-w-full h-auto rounded-lg"
                />
              )}
            </div>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    const isSuccess = error.includes('already submitted');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{isSuccess ? '✅' : '❌'}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isSuccess ? 'Upload Complete!' : 'Invalid Link'}
          </h1>
          <p className="text-gray-600">{error}</p>
          {isSuccess && (
            <p className="mt-4 text-sm text-gray-500">
              Your documents have been successfully submitted and are under review.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!linkData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Document Verification
          </h1>
          <p className="text-gray-600 mb-6">
            Hello {linkData.name} {linkData.surname}, please upload the required documents below.
          </p>

          {/* Required Documents Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-gray-800 mb-2">Required Documents:</h2>
            <ul className="space-y-1">
              {linkData.require_id && (
                <li className="text-sm text-gray-700">✓ ID Document (Passport, Driving License, etc.)</li>
              )}
              {linkData.require_selfie && (
                <li className="text-sm text-gray-700">✓ Selfie</li>
              )}
              {linkData.require_address_proof && (
                <li className="text-sm text-gray-700">✓ Proof of Address</li>
              )}
            </ul>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-2">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index <= currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Submit Documents ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
