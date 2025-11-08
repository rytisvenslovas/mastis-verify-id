import React from 'react';

const SearchAndFilters = ({ 
  searchTerm, 
  onSearchChange, 
  filterPending, 
  onPendingChange, 
  filterSubmitted, 
  onSubmittedChange,
  onCreateNew 
}) => {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
      <div className="flex gap-4 items-center flex-1 min-w-[300px]">
        <input
          type="text"
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search by name, surname, email, or phone..."
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterPending}
              onChange={onPendingChange}
              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Pending</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterSubmitted}
              onChange={onSubmittedChange}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Submitted</span>
          </label>
        </div>
      </div>
      
      <button
        onClick={onCreateNew}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 whitespace-nowrap"
      >
        ➕ Generate New Link
      </button>
    </div>
  );
};

export default SearchAndFilters;
