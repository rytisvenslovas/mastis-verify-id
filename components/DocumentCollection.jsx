'use client';

import React, { useEffect, useState } from 'react';
import Modal from './Modal';

const DocumentCollection = () => {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [documentLinks, setDocumentLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [filterPending, setFilterPending] = useState(false);
  const [filterSubmitted, setFilterSubmitted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requireId, setRequireId] = useState(true);
  const [requireSelfie, setRequireSelfie] = useState(false);
  const [requireAddressProof, setRequireAddressProof] = useState(false);

  const fetchDocumentLinks = async (search = '') => {
    try {
      const url = search ? `/api/document-links?search=${encodeURIComponent(search)}` : '/api/document-links';
      const res = await fetch(url);
      const result = await res.json();
      setDocumentLinks(result.data || []);
    } catch (err) {
      console.error('Failed to load document links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentLinks();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchDocumentLinks(value);
  };

  const filteredLinks = documentLinks.filter((link) => {
    const hasSubmission = link.submission && link.submission.length > 0;
    
    if (!filterPending && !filterSubmitted) return true;
    
    if (filterPending && !hasSubmission) return true;
    if (filterSubmitted && hasSubmission) return true;
    
    return false;
  });
  
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLinks = filteredLinks.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCreateLink = async () => {
    if (!name.trim() || !surname.trim()) {
      alert('Please enter both name and surname');
      return;
    }

    if (isCreating) return; // Prevent double submission

    setIsCreating(true);

    try {
      const res = await fetch('/api/create-document-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim(),
          phone: phone.trim(),
          requireId,
          requireSelfie,
          requireAddressProof,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error('API Error:', result);
        throw new Error(result.error || 'Failed to create document link');
      }

      await fetchDocumentLinks();
      setIsModalOpen(false);
      handleReset();
      alert('Document link created successfully!');
    } catch (err) {
      console.error('Error creating document link:', err);
      alert(`Failed to create document link: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document link?')) return;

    try {
      const res = await fetch('/api/delete-document-link', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Failed to delete document link');

      setDocumentLinks(documentLinks.filter((link) => link.id !== id));
    } catch (err) {
      console.error('Error deleting document link:', err);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const handleReset = () => {
    setName('');
    setSurname('');
    setEmail('');
    setPhone('');
    setRequireId(true);
    setRequireSelfie(false);
    setRequireAddressProof(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    handleReset();
  };

  const handleViewSubmission = (docLink) => {
    setSelectedSubmission(docLink);
    setIsViewModalOpen(true);
  };

  const getSubmissionStatus = (docLink) => {
    if (!docLink.submission || docLink.submission.length === 0) {
      return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
    const submission = docLink.submission[0];
    if (!submission || !submission.status) {
      return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (submission.status === 'approved') {
      return { text: 'Approved', color: 'bg-green-100 text-green-800' };
    }
    if (submission.status === 'rejected') {
      return { text: 'Rejected', color: 'bg-red-100 text-red-800' };
    }
    return { text: 'Submitted', color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex gap-4 items-center flex-1 min-w-[300px]">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by name, surname, email, or phone..."
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterPending}
                onChange={(e) => {
                  setFilterPending(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Pending</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterSubmitted}
                onChange={(e) => {
                  setFilterSubmitted(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Submitted</span>
            </label>
          </div>
        </div>
        
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 whitespace-nowrap"
        >
          ➕ Generate New Link
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-lime-600 rounded-full animate-spin"></div>
        </div>
      ) : documentLinks.length === 0 ? (
        <p className="text-gray-500">No document links found.</p>
      ) : (
        <>
        <div className="max-h-[500px] overflow-y-auto pr-2">
          <ul className="space-y-2">
            {currentLinks.map((docLink) => {
              const status = getSubmissionStatus(docLink);
              const hasSubmission = docLink.submission && docLink.submission.length > 0;
              
              return (
              <li 
                key={docLink.id} 
                className={`bg-white shadow-md rounded-lg p-4 border border-gray-200 ${hasSubmission ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                onClick={() => hasSubmission && handleViewSubmission(docLink)}
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
                      onClick={() => handleCopyLink(docLink.link)}
                      className="flex-1 sm:flex-none px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => handleDelete(docLink.id)}
                      className="flex-1 sm:flex-none px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === page
                      ? 'bg-lime-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Generate Document Collection Link</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Surname
            </label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter surname"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter phone number"
            />
          </div>

          <div className="pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Required Documents
            </label>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireId"
                  checked={requireId}
                  onChange={(e) => setRequireId(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="requireId" className="ml-2 text-sm text-gray-700">
                  ID Document (Default: Required)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireSelfie"
                  checked={requireSelfie}
                  onChange={(e) => setRequireSelfie(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="requireSelfie" className="ml-2 text-sm text-gray-700">
                  Selfie
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireAddressProof"
                  checked={requireAddressProof}
                  onChange={(e) => setRequireAddressProof(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="requireAddressProof" className="ml-2 text-sm text-gray-700">
                  Address Proof
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleCreateLink}
              disabled={isCreating || !name.trim() || !surname.trim()}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Create Link'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
        {selectedSubmission && selectedSubmission.submission && selectedSubmission.submission[0] && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">
              Uploaded Documents - {selectedSubmission.name} {selectedSubmission.surname}
            </h3>

            {selectedSubmission.submission[0].id_picture && (
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">ID Document</h4>
                <p className="text-sm text-gray-600 mb-2">Type: {selectedSubmission.submission[0].id_type}</p>
                {selectedSubmission.submission[0].id_picture.toLowerCase().includes('.pdf') ? (
                  <div className="space-y-2">
                    <a
                      href={selectedSubmission.submission[0].id_picture}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      📄 Open PDF in New Tab
                    </a>
                    <object
                      data={selectedSubmission.submission[0].id_picture}
                      type="application/pdf"
                      className="w-full h-96 rounded border"
                    >
                      <p className="text-sm text-gray-500 p-4">
                        PDF preview not available. 
                        <a href={selectedSubmission.submission[0].id_picture} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          Click here to view
                        </a>
                      </p>
                    </object>
                  </div>
                ) : (
                  <img 
                    src={selectedSubmission.submission[0].id_picture} 
                    alt="ID Document" 
                    className="max-w-full h-auto rounded border"
                  />
                )}
              </div>
            )}

            {selectedSubmission.submission[0].selfie && (
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">Selfie</h4>
                <img 
                  src={selectedSubmission.submission[0].selfie} 
                  alt="Selfie" 
                  className="max-w-full h-auto rounded border"
                />
              </div>
            )}

            {/* Address Proof */}
            {selectedSubmission.submission[0].address_proof_picture && (
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">Address Proof</h4>
                <p className="text-sm text-gray-600 mb-2">Type: {selectedSubmission.submission[0].address_proof_type}</p>
                {selectedSubmission.submission[0].address_proof_picture.toLowerCase().includes('.pdf') ? (
                  <div className="space-y-2">
                    <a
                      href={selectedSubmission.submission[0].address_proof_picture}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      📄 Open PDF in New Tab
                    </a>
                    <object
                      data={selectedSubmission.submission[0].address_proof_picture}
                      type="application/pdf"
                      className="w-full h-96 rounded border"
                    >
                      <p className="text-sm text-gray-500 p-4">
                        PDF preview not available. 
                        <a href={selectedSubmission.submission[0].address_proof_picture} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          Click here to view
                        </a>
                      </p>
                    </object>
                  </div>
                ) : (
                  <img 
                    src={selectedSubmission.submission[0].address_proof_picture} 
                    alt="Address Proof" 
                    className="max-w-full h-auto rounded border"
                  />
                )}
              </div>
            )}

            {/* Submission Info */}
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                Status: <span className="font-semibold">{selectedSubmission.submission[0].status}</span>
              </p>
              <p className="text-sm text-gray-600">
                Submitted: {new Date(selectedSubmission.submission[0].submitted_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentCollection;