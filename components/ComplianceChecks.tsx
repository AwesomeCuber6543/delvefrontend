"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Shield, Users, Clock } from "lucide-react";
import { getCookie } from "@/utils/cookies";

type CheckStatus = "loading" | "pass" | "fail" | "error";

interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  status: CheckStatus;
  details: any;
  timestamp: string | null;
  icon: React.ReactNode;
  endpoint: string;
}

export default function ComplianceChecks() {
  const [checks, setChecks] = useState<ComplianceCheck[]>([
    {
      id: "mfa",
      name: "Multi-Factor Authentication",
      description: "Check if MFA is enabled for all users",
      status: "loading",
      details: null,
      timestamp: null,
      icon: <Users className="text-blue-500" size={24} />,
      endpoint: "mfa-check"
    },
    {
      id: "rls",
      name: "Row Level Security",
      description: "Check if RLS is enabled for all tables",
      status: "loading",
      details: null,
      timestamp: null,
      icon: <Shield className="text-purple-500" size={24} />,
      endpoint: "rls-check"
    },
    {
      id: "pitr",
      name: "Point in Time Recovery",
      description: "Check if PITR is enabled for all projects",
      status: "loading",
      details: null,
      timestamp: null,
      icon: <Clock className="text-indigo-500" size={24} />,
      endpoint: "pitr-check"
    },
  ]);

  const [isRunningChecks, setIsRunningChecks] = useState(true);

  useEffect(() => {
    runAllChecks();
  }, []);

  const runAllChecks = async () => {
    setIsRunningChecks(true);
    
    setChecks(prev => prev.map(check => ({
      ...check,
      status: "loading",
      timestamp: null
    })));
    
    for (const check of checks) {
      await runCheck(check.id);
    }
    
    setIsRunningChecks(false);
  };

  const runCheck = async (checkId: string) => {
    const check = checks.find(c => c.id === checkId);
    if (!check) return;

    try {
      const token = getCookie("supabase_access_token");
      
      const response = await fetch(`http://localhost:3001/api/compliance/${check.endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const isPassing = data.summary.percentageCompliant === 100;
      
      setChecks(prev => prev.map(c => 
        c.id === checkId 
          ? { 
              ...c, 
              status: isPassing ? "pass" : "fail", 
              details: data,
              timestamp: new Date().toISOString()
            } 
          : c
      ));
    } catch (error) {
      console.error(`Error running ${checkId} check:`, error);
      setChecks(prev => prev.map(c => 
        c.id === checkId 
          ? { 
              ...c, 
              status: "error", 
              details: { error: "Failed to run check" },
              timestamp: new Date().toISOString()
            } 
          : c
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

  const renderCheckDetails = (check: ComplianceCheck) => {
    if (!check.details) return null;
    
    const data = check.details;
    
    switch (check.id) {
      case "mfa":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <div>
                <span className="font-medium">Total Users:</span> {data.summary.totalUsers}
              </div>
              <div>
                <span className="font-medium">Compliant:</span> {data.summary.passingCount} ({data.summary.percentageCompliant}%)
              </div>
            </div>
            
            {data.failing.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Users without MFA:</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.failing.map((user: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{user.user_name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{user.email}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{user.role_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {data.summary.percentageCompliant < 100 && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">How to Enable MFA</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>Log into your Supabase account</li>
                  <li>Go to account settings</li>
                  <li>Enable MFA for your account</li>
                </ol>
              </div>
            )}
          </div>
        );
        
      case "rls":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <div>
                <span className="font-medium">Total Tables:</span> {data.summary.totalTables}
              </div>
              <div>
                <span className="font-medium">Compliant:</span> {data.summary.passingCount} ({data.summary.percentageCompliant}%)
              </div>
            </div>
            
            {data.failing.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tables without RLS:</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Schema</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Table</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.failing.map((table: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{table.schemaname}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{table.tablename}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{table.tableowner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {data.projectDetails && (
              <div>
                <h4 className="font-medium mb-2">Project Details:</h4>
                {data.projectDetails.map((project: any, index: number) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <p><span className="font-medium">Project:</span> {project.project.name}</p>
                    <p><span className="font-medium">Region:</span> {project.project.region}</p>
                    <p><span className="font-medium">Status:</span> {project.project.status}</p>
                  </div>
                ))}
              </div>
            )}
            
            {data.summary.percentageCompliant < 100 && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">How to Fix Row Level Security</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Row Level Security (RLS) is a critical security feature that restricts which rows in a database table a user can access. 
                  You should enable RLS for all tables to ensure proper data access control.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const token = getCookie("supabase_access_token");
                      const response = await fetch("http://localhost:3001/api/compliance/fix-rls", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`
                        }
                      });
                      
                      if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                      }
                      
                      const result = await response.json();
                      if (result.success) {
                        alert("Successfully enabled RLS on all tables. Running check again...");
                        runCheck("rls");
                      } else {
                        alert("Failed to enable RLS on all tables.");
                      }
                    } catch (error) {
                      console.error("Error fixing RLS:", error);
                      alert("An error occurred while trying to fix RLS.");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Enable RLS for All Tables
                </button>
                <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                  Note: After enabling RLS, you will need to create appropriate policies to control access to your data.
                </p>
              </div>
            )}
          </div>
        );
        
      case "pitr":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <div>
                <span className="font-medium">Total Projects:</span> {data.summary.totalProjects}
              </div>
              <div>
                <span className="font-medium">Compliant:</span> {data.summary.passingCount} ({data.summary.percentageCompliant}%)
              </div>
            </div>
            
            {data.failing.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Projects without PITR:</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Region</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PITR Enabled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.failing.map((project: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{project.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{project.region}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">No</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {data.summary.percentageCompliant < 100 && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">How to Enable PITR</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>Navigate to the project dashboard in Supabase</li>
                  <li>Go to the Add-ons section in the sidebar</li>
                  <li>Click on the Point in Time Recovery (PITR) section and select "Enable"</li>
                  <li>Select your desired backup duration and click "Accept"</li>
                </ol>
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md overflow-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
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

      <div className="space-y-6">
        {checks.map((check) => (
          <div 
            key={check.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">{check.icon}</div>
                <div>
                  <h3 className="text-lg font-medium">{check.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{check.description}</p>
                </div>
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
                {renderCheckDetails(check)}
                
                {check.timestamp && (
                  <p className="text-xs text-gray-500 mt-4">
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
