import React from 'react';

const DocumentLinkCard = ({ docLink, status, onView, onCopyLink, onDelete }) => {
  const hasSubmission = docLink.submission && docLink.submission.length > 0;

  return (
    <li 
      className={`bg-white shadow-md rounded-lg p-4 border border-gray-200 ${hasSubmission ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={() => hasSubmission && onView(docLink)}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base sm:text-lg">
              {docLink.name} {docLink.surname}
            </h3>
            <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${status.color}`}>
              {status.text}
            </span>
          </div>
          {docLink.email && <p className="text-sm text-gray-600 break-all">📧 {docLink.email}</p>}
          {docLink.phone && <p className="text-sm text-gray-600">📱 {docLink.phone}</p>}
          <div className="mt-2 flex gap-2 flex-wrap">
            {docLink.require_id && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">ID</span>
            )}
            {docLink.require_selfie && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Selfie</span>
            )}
            {docLink.require_address_proof && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Address</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Created: {new Date(docLink.created_at).toLocaleString()}
          </p>
          {hasSubmission && (
            <p className="text-xs text-blue-600 mt-1">
              👆 Click to view uploaded documents
            </p>
          )}
        </div>
        <div className="flex gap-2 sm:ml-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onCopyLink(docLink.link)}
            className="flex-1 sm:flex-none px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
          >
            Copy Link
          </button>
          <button
            onClick={() => onDelete(docLink.id)}
            className="flex-1 sm:flex-none px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
};

export default DocumentLinkCard;
