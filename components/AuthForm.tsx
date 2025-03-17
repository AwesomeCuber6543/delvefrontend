"use client";

import { useState } from "react";

export default function AuthForm({ onClientIdChange }: { onClientIdChange: (clientId: string) => void }) {
  const [clientId, setClientId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthenticate = () => {
    if (!clientId.trim()) {
      alert("Please enter a client ID");
      return;
    }

    setIsLoading(true);
    
    // Store the client ID in localStorage so we can retrieve it after redirect
    localStorage.setItem("supabase_client_id", clientId);
    
    // Redirect to Supabase auth in the same window
    window.location.href = `https://api.supabase.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=http://localhost:3000&response_type=code`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">Connect to Supabase</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        To check your Supabase configuration for compliance, we need to connect to your account.
      </p>
      
      <div className="mb-6">
        <label htmlFor="clientId" className="block mb-2 text-sm font-medium">
          Supabase Client ID
        </label>
        <input
          id="clientId"
          type="text"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            onClientIdChange(e.target.value);
          }}
          placeholder="Enter your Supabase client ID"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
        />
      </div>
      
      <button
        onClick={handleAuthenticate}
        disabled={isLoading}
        className="w-full bg-foreground text-background py-3 rounded-md font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Connecting..." : "Authenticate with Supabase"}
      </button>
      
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Your credentials are only used to perform compliance checks and are not stored permanently.
      </p>
    </div>
  );
}
