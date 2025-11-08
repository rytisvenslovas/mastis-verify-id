import React from 'react';
import Modal from './Modal';

const DocumentPreview = ({ url, alt }) => {
  const isPdf = url.includes('/raw/upload/') || url.toLowerCase().includes('.pdf');

  if (isPdf) {
    return (
      <div className="space-y-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          📄 Download/View PDF
        </a>
        <p className="text-xs text-gray-500">
          Click the button above to view the PDF in a new tab
        </p>
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={alt} 
      className="max-w-full h-auto rounded border"
    />
  );
};

const ViewSubmissionModal = ({ isOpen, onClose, submission }) => {
  if (!submission || !submission.submission || !submission.submission[0]) {
    return null;
  }

  const data = submission.submission[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <h3 className="text-xl font-bold mb-4">
          Uploaded Documents - {submission.name} {submission.surname}
        </h3>

        {data.id_picture && (
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-2">ID Document</h4>
            <p className="text-sm text-gray-600 mb-2">Type: {data.id_type}</p>
            <DocumentPreview url={data.id_picture} alt="ID Document" type={data.id_type} />
          </div>
        )}

        {data.selfie && (
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-2">Selfie</h4>
            <img 
              src={data.selfie} 
              alt="Selfie" 
              className="max-w-full h-auto rounded border"
            />
          </div>
        )}

        {data.address_proof_picture && (
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-2">Address Proof</h4>
            <p className="text-sm text-gray-600 mb-2">Type: {data.address_proof_type}</p>
            <DocumentPreview 
              url={data.address_proof_picture} 
              alt="Address Proof" 
              type={data.address_proof_type} 
            />
          </div>
        )}

        <div className="mt-4 bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">
            Status: <span className="font-semibold">{data.status}</span>
          </p>
          <p className="text-sm text-gray-600">
            Submitted: {new Date(data.submitted_at).toLocaleString()}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ViewSubmissionModal;
