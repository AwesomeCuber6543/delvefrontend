"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
// import AuthForm from "@/components/AuthForm";
import AuthForm from "@/components/AuthForm";
import ComplianceChecks from "@/components/ComplianceChecks";
import { getCookie } from "@/utils/cookies";

export default function CompliancePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = getCookie("supabase_access_token");
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Handle code from redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    
    if (code) {
      // Get the client ID from localStorage
      const storedClientId = localStorage.getItem("supabase_client_id");
      if (storedClientId) {
        setClientId(storedClientId);
        handleAuthCode(code, storedClientId);
      }
      // Clean up URL
      window.history.replaceState({}, document.title, "/compliance");
    }
  }, []);

  const handleAuthCode = async (code: string, storedClientId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          code,
          clientId: storedClientId || clientId
        }),
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        // Clear the stored client ID
        localStorage.removeItem("supabase_client_id");
      } else {
        console.error("Authentication failed");
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-12">
        <div className="flex items-center gap-4">
          <Image
            src="/next.svg"
            alt="Delve Logo"
            width={120}
            height={30}
            className="dark:invert"
          />
          <h1 className="text-2xl font-bold">Supabase Compliance Checker</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
          </div>
        ) : isAuthenticated ? (
          <ComplianceChecks />
        ) : (
          <AuthForm onClientIdChange={setClientId} />
        )}
      </main>
    </div>
  );
}
