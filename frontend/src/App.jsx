import './App.css';
import React from 'react';
import Layout from './component/Layout';

function App() {
  return (
    <Layout>
      {/* This is the main content area that gets passed as 'children' to the Layout component */}
      <div className="bg-white rounded-3xl flex-1 w-full">
        {/* Your page-specific content, like dashboards, forms, etc., goes here */}
        <h1 className="p-8 text-2xl font-bold">Welcome to the Dashboard!</h1>
      </div>
    </Layout>
  );
}

export default App;