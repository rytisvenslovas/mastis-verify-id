'use client';

import React, { useEffect, useState } from 'react';
import SearchAndFilters from './SearchAndFilters';
import DocumentLinkCard from './DocumentLinkCard';
import Pagination from './Pagination';
import CreateLinkModal from './CreateLinkModal';
import ViewSubmissionModal from './ViewSubmissionModal';

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
      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        filterPending={filterPending}
        onPendingChange={(e) => {
          setFilterPending(e.target.checked);
          setCurrentPage(1);
        }}
        filterSubmitted={filterSubmitted}
        onSubmittedChange={(e) => {
          setFilterSubmitted(e.target.checked);
          setCurrentPage(1);
        }}
        onCreateNew={handleOpenModal}
      />

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
              {currentLinks.map((docLink) => (
                <DocumentLinkCard
                  key={docLink.id}
                  docLink={docLink}
                  status={getSubmissionStatus(docLink)}
                  onView={handleViewSubmission}
                  onCopyLink={handleCopyLink}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </>
      )}

      <CreateLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        name={name}
        setName={setName}
        surname={surname}
        setSurname={setSurname}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        requireId={requireId}
        setRequireId={setRequireId}
        requireSelfie={requireSelfie}
        setRequireSelfie={setRequireSelfie}
        requireAddressProof={requireAddressProof}
        setRequireAddressProof={setRequireAddressProof}
        onSubmit={handleCreateLink}
        isCreating={isCreating}
      />

      <ViewSubmissionModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        submission={selectedSubmission}
      />
    </div>
  );
};

export default DocumentCollection;