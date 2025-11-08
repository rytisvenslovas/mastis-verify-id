import React from 'react';
import Modal from './Modal';

const CreateLinkModal = ({
  isOpen,
  onClose,
  name,
  setName,
  surname,
  setSurname,
  email,
  setEmail,
  phone,
  setPhone,
  requireId,
  setRequireId,
  requireSelfie,
  setRequireSelfie,
  requireAddressProof,
  setRequireAddressProof,
  onSubmit,
  isCreating
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
            onClick={onSubmit}
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
  );
};

export default CreateLinkModal;
