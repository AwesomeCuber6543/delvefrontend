"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

type CheckStatus = "loading" | "pass" | "fail" | "error";

interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  status: CheckStatus;
  details: any[];
  timestamp: string | null;
}

export default function ComplianceChecks() {
  const [checks, setChecks] = useState<ComplianceCheck[]>([
    {
      id: "mfa",
      name: "Multi-Factor Authentication",
      description: "Check if MFA is enabled for each user",
      status: "loading",
      details: [],
      timestamp: null,
    },
    {
      id: "rls",
      name: "Row Level Security",
      description: "Check if RLS is enabled for all tables",
      status: "loading",
      details: [],
      timestamp: null,
    },
    {
      id: "pitr",
      name: "Point in Time Recovery",
      description: "Check if PITR is enabled for all projects",
      status: "loading",
      details: [],
      timestamp: null,
    },
  ]);

  const [isRunningChecks, setIsRunningChecks] = useState(true);

  useEffect(() => {
    runAllChecks();
  }, []);

  const runAllChecks = async () => {
    setIsRunningChecks(true);
    
    // Reset all checks to loading
    setChecks(prev => prev.map(check => ({
      ...check,
      status: "loading",
      timestamp: null
    })));
    
    // Run each check in sequence
    await runCheck("mfa");
    await runCheck("rls");
    await runCheck("pitr");
    
    setIsRunningChecks(false);
  };

  const runCheck = async (checkId: string) => {
    try {
      const response = await fetch(`/api/compliance/${checkId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      setChecks(prev => prev.map(check => 
        check.id === checkId 
          ? { 
              ...check, 
              status: data.passing ? "pass" : "fail", 
              details: data.details || [],
              timestamp: new Date().toISOString()
            } 
          : check
      ));
    } catch (error) {
      console.error(`Error running ${checkId} check:`, error);
      setChecks(prev => prev.map(check => 
        check.id === checkId 
          ? { 
              ...check, 
              status: "error", 
              details: [{ message: "Failed to run check" }],
              timestamp: new Date().toISOString()
            } 
          : check
      ));
    }
  };

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="text-green-500" size={24} />;
      case "fail":
        return <XCircle className="text-red-500" size={24} />;
      case "error":
        return <AlertTriangle className="text-yellow-500" size={24} />;
      case "loading":
        return <RefreshCw className="text-gray-400 animate-spin" size={24} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Compliance Checks</h2>
        <button
          onClick={runAllChecks}
          disabled={isRunningChecks}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md hover:bg-opacity-90 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRunningChecks ? "animate-spin" : ""} />
          {isRunningChecks ? "Running Checks..." : "Run All Checks"}
        </button>
      </div>

      <div className="space-y-4">
        {checks.map((check) => (
          <div 
            key={check.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{check.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{check.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status)}
                <button
                  onClick={() => runCheck(check.id)}
                  disabled={check.status === "loading"}
                  className="text-sm text-gray-500 hover:text-foreground"
                >
                  Recheck
                </button>
              </div>
            </div>
            
            {check.status !== "loading" && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Details</h4>
                {check.details.length > 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No details available</p>
                )}
                
                {check.timestamp && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last checked: {new Date(check.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
