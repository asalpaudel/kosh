import React from 'react';
import { SearchIcon, EyeIcon, PencilIcon, TrashIcon, PlusCircleIcon } from '../../component/icons.jsx';

// Mock data for the network list
const networks = [
  { id: 1, name: 'Sahakari 1', admin: 'Asal' },
  { id: 2, name: 'Sahakari 2', admin: 'Barshat' },
  { id: 3, name: 'Geda Sahakari', admin: 'Sid' },
  { id: 4, name: 'Janata Sahakari', admin: 'Ram' },
];

function Networks() {
  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[80vh]">
        <h2 className="text-2xl font-bold mb-6">Active Network</h2>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          
          {/* Search Input */}
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <SearchIcon className="h-6 w-6 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="w-full sm:w-80 bg-gray-100 text-gray-700 border border-transparent rounded-full py-3 pl-12 pr-4 text-base focus:outline-none focus:bg-white focus:border-gray-300"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-3">
            <button className="bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-full hover:bg-gray-300 transition-colors text-base">
              Staff
            </button>
            <button className="bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-full hover:bg-gray-300 transition-colors text-base">
              User
            </button>
          </div>
        </div>

        {/* Network List */}
        <div className="space-y-2">
          {/* List Header */}
          <div className="grid grid-cols-4 gap-4 items-center bg-gray-50 p-4 rounded-lg font-semibold text-gray-600">
            <span className="col-span-2">Name</span>
            <span>Admin</span>
            <span className="text-right">Actions</span>
          </div>

          {/* List Body */}
          {networks.map((network) => (
            <div 
              key={network.id} 
              className="grid grid-cols-4 gap-4 items-center bg-white p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-500 font-medium">{network.id}</span>
              <span className="text-gray-800 font-bold col-start-2">{network.name}</span>
              <span className="text-gray-700">{network.admin}</span>
              
              {/* Action Icons */}
              <div className="flex items-center justify-end space-x-3">
                <button className="text-blue-500 hover:text-blue-700">
                  <EyeIcon className="w-5 h-5" />
                </button>
                <button className="text-yellow-500 hover:text-yellow-700">
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button className="text-red-500 hover:text-red-700">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        title="Add Network"
        className="fab-button fixed z-20 bottom-10 right-10 bg-teal-500 rounded-full p-4 text-white shadow-lg hover:bg-teal-600 transition-colors"
      >
        {/* This is the + icon that will rotate to an X on hover */}
        <PlusCircleIcon className="w-8 h-8 fab-icon" />
      </button>
    </>
  );
}

export default Networks;