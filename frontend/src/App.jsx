import './App.css';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className="w-14 bg-black flex flex-col items-center py-6 space-y-8">
        {/* Top Logo */}
        <div className="text-green-400 text-xl">📦</div>
        
        {/* Navigation Icons */}
        <div className="flex flex-col space-y-6 mt-4">
          <div className="text-purple-400 text-lg cursor-pointer">🔲</div>
          <div className="text-red-400 text-lg cursor-pointer">🎨</div>
          <div className="text-blue-400 text-lg cursor-pointer">📊</div>
        </div>
        
        {/* Bottom Icon */}
        <div className="mt-auto">
          <div className="text-orange-400 text-lg cursor-pointer">🔥</div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-black h-14 flex items-center justify-between px-6">
          <h1 className="text-white font-normal text-base tracking-wide">PAGE_NAME</h1>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-5">
            <div className="text-yellow-400 text-lg cursor-pointer">🔍</div>
            <div className="text-yellow-400 text-lg cursor-pointer">🔔</div>
            <div className="text-gray-400 text-lg cursor-pointer">⚙️</div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 bg-gray-200 p-4">
          <div className="bg-white rounded-xl h-full w-full">
            {/* Content area - empty for now */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;