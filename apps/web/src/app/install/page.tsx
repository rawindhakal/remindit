"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Database,
  ShieldCheck,
  Server,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function InstallPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isChecking, setIsChecking] = useState(true);
  const [installStatus, setInstallStatus] = useState<{
    installed: boolean;
    dbConnected: boolean;
    hasSuperAdmin: boolean;
    categoriesCount: number;
    nodeVersion?: string;
    environment?: string;
    error?: string;
  } | null>(null);

  // Database test state
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form fields
  const [adminName, setAdminName] = useState("Super Admin");
  const [adminEmail, setAdminEmail] = useState("rawindhakal@gmail.com");
  const [adminPassword, setAdminPassword] = useState("Admin123!@#");
  const [confirmPassword, setConfirmPassword] = useState("Admin123!@#");
  const [showPassword, setShowPassword] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Kathmandu");
  const [appName, setAppName] = useState("RenewIt");

  // Optional SMTP
  const [showSmtp, setShowSmtp] = useState(false);
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Check current installation status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setIsChecking(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/install/status");
      const json = await res.json();
      if (json.success) {
        setInstallStatus(json.data);
      } else {
        setInstallStatus({
          installed: false,
          dbConnected: false,
          hasSuperAdmin: false,
          categoriesCount: 0,
          error: json.error?.message,
        });
      }
    } catch (err: any) {
      setInstallStatus({
        installed: false,
        dbConnected: false,
        hasSuperAdmin: false,
        categoriesCount: 0,
        error: "Unable to reach server installation API",
      });
    } finally {
      setIsChecking(false);
    }
  }

  // 2. Test database connection
  async function testDatabase() {
    setIsTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch("/api/install/test-db", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setDbTestResult({ success: true, message: json.message });
      } else {
        setDbTestResult({
          success: false,
          message: json.error?.message || "Failed to connect to database.",
        });
      }
    } catch {
      setDbTestResult({
        success: false,
        message: "Network error connecting to database API.",
      });
    } finally {
      setIsTestingDb(false);
    }
  }

  // 3. Submit installation
  async function handleInstall(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (adminPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (adminPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/install/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminName,
          adminEmail,
          adminPassword,
          timezone,
          appName,
          smtpEmail: smtpEmail.trim() || undefined,
          smtpPass: smtpPass.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setStep(4);
      } else {
        setErrorMessage(json.error?.message || "Installation failed.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "A network error occurred during setup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 animate-pulse">
            <Server className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white">Inspecting Server Environment...</h2>
          <p className="text-slate-400 text-sm">Checking database and configuration status</p>
        </div>
      </div>
    );
  }

  // Already installed locked screen
  if (installStatus?.installed && installStatus?.hasSuperAdmin && step !== 4) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Installer Locked</h1>
            <p className="text-slate-400 text-sm">
              RenewIt is already installed and secured. To protect your server, the web installer has been disabled.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-left space-y-2 text-xs text-slate-300">
            <div className="flex justify-between items-center">
              <span>Database Status:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Super Admin:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Configured
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition shadow-lg shadow-blue-600/30"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            R
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">RenewIt</h1>
            <p className="text-xs text-slate-400">Web Installation Wizard</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          v1.0 Production
        </span>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full my-8">
        {/* Step Indicator */}
        <div className="mb-8 grid grid-cols-4 gap-2 text-center">
          {[
            { num: 1, label: "System Health" },
            { num: 2, label: "Database" },
            { num: 3, label: "Super Admin" },
            { num: 4, label: "Ready" },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                step === s.num
                  ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10"
                  : step > s.num
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
            >
              <div className="font-bold">Step {s.num}</div>
              <div className="truncate">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          {/* STEP 1: System Health */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Server className="w-6 h-6 text-blue-400" />
                  System Requirements Check
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  We checked your server runtime and database readiness.
                </p>
              </div>

              <div className="space-y-3">
                {/* Node.js */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm text-slate-200">Node.js Runtime</div>
                    <div className="text-xs text-slate-400">Required: v18.0.0 or higher</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {installStatus?.nodeVersion || process.version || "v20.x"}
                  </span>
                </div>

                {/* Database Connectivity */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm text-slate-200">Database Connection</div>
                    <div className="text-xs text-slate-400">
                      Configured via <code className="text-blue-400">DATABASE_URL</code>
                    </div>
                  </div>
                  {installStatus?.dbConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Needs Verification
                    </span>
                  )}
                </div>

                {/* Environment */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm text-slate-200">Environment Mode</div>
                    <div className="text-xs text-slate-400">Production server optimization</div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                    {installStatus?.environment || "production"}
                  </span>
                </div>
              </div>

              {installStatus?.error && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Notice:</div>
                    <div>{installStatus.error}</div>
                    <div className="mt-1 text-slate-400">
                      If you just created the database, make sure your <code className="text-white">.env</code> contains your MySQL/PostgreSQL credentials.
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={checkStatus}
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-check Status
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/30"
                >
                  Continue to Database
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Database Initialization */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-blue-400" />
                  Database Verification
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Test your database connection before setting up the application.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-200">Database Connection Test</div>
                    <div className="text-xs text-slate-400">
                      Sends a ping to verify connectivity, table creation, and credentials.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={testDatabase}
                    disabled={isTestingDb}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
                  >
                    {isTestingDb ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </button>
                </div>

                {dbTestResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-start gap-2 border ${
                      dbTestResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}
                  >
                    {dbTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div>{dbTestResult.message}</div>
                  </div>
                )}
              </div>

              {/* What will be created */}
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/40 text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  What the installer will automatically do:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li>Seed <strong>33 Nepali & International renewal categories</strong> (Driving License, Bluebook, Passports, Insurance, etc.).</li>
                  <li>Initialize <strong>19 system settings</strong> (Google OAuth, Google Ads, SMTP, Push).</li>
                  <li>Create your <strong>Super Admin account</strong> with full permissions.</li>
                  <li>Set up the automated <strong>daily notification schedules</strong>.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/30"
                >
                  Configure Administrator
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Administrator & Installation Form */}
          {step === 3 && (
            <form onSubmit={handleInstall} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                  Create Super Administrator
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  This account will have full access to users, settings, and reminders.
                </p>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Admin Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Rabin Dhakal"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                {/* Admin Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Password (min 8 chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:outline-none transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Timezone & Site Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Default Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none transition"
                    >
                      <option value="Asia/Kathmandu">Asia/Kathmandu (Nepal Time, UTC+5:45)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST/EDT)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4:00)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Application Name
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="RenewIt"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Optional SMTP Accordion */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSmtp(!showSmtp)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    {showSmtp ? "− Hide Email (SMTP) Setup" : "+ Optional: Configure Gmail / SMTP Now"}
                  </button>

                  {showSmtp && (
                    <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Gmail / SMTP Account Email
                        </label>
                        <input
                          type="email"
                          value={smtpEmail}
                          onChange={(e) => setSmtpEmail(e.target.value)}
                          placeholder="your-email@gmail.com"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          App Password / SMTP Password
                        </label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="16-character Google App Password"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        You can also configure or change this anytime later inside the Super Admin panel.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Installing Application...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Install & Complete Setup
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success & Completion */}
          {step === 4 && (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white">Installation Complete!</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  {appName} has been successfully installed and configured on your server.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-300 space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Super Admin Email:</span>
                  <span className="text-white font-semibold">{adminEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Categories Seeded:</span>
                  <span className="text-emerald-400 font-semibold">33 Categories Ready</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">System Security:</span>
                  <span className="text-emerald-400 font-semibold">Installer Locked</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-xl shadow-blue-600/30 text-base"
                >
                  Sign In to Your Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4">
        RenewIt &copy; {new Date().getFullYear()} &bull; Automatic Document & Subscription Renewals
      </footer>
    </div>
  );
}
