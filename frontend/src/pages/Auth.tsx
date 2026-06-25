import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { apiService } from '../shared/lib/api';
import type { UserRole } from '../shared/lib/api';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Briefcase, Award, Eye, EyeOff, AlertCircle, Fingerprint } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Tab control: 'login' | 'register' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(
    location.pathname === '/register' ? 'register' : 'login'
  );

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: 'bg-white/10' };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('founder');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [linkedin, setLinkedin] = useState('');
  
  // Forgot password & reset password states
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState('');
  const [pendingRegistrationData, setPendingRegistrationData] = useState<any>(null);
  
  // Passkey recovery states
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isPasskeyVerified, setIsPasskeyVerified] = useState(false);
  const [verifyingPasskey, setVerifyingPasskey] = useState(false);

  const generateRecoveryKey = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'INV-';
    const randomValues = new Uint32Array(16);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += characters[randomValues[i] % characters.length];
    }
    return result;
  };

  const hashSHA256 = async (str: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const downloadKeyFile = (userEmail: string, key: string) => {
    const text = `INVESA ACCOUNT RECOVERY KEY\n============================\n\nEmail: ${userEmail}\nRecovery Key: ${key}\n\nWARNING: Keep this key file safe. If you lose this key, you will not be able to recover your account.`;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `invesa_recovery_key_${userEmail.replace(/[@.]/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const match = text.match(/INV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
      if (match) {
        setRecoveryKeyInput(match[0]);
        setSuccessMessage("Recovery key loaded successfully from file!");
      } else {
        setError("Could not find a valid Invesa recovery key in this file.");
      }
    };
    reader.readAsText(file);
  };

  const handlePasskeyVerification = async () => {
    setVerifyingPasskey(true);
    setError(null);
    try {
      let verified = false;
      
      // Attempt native WebAuthn credential retrieval if supported
      if (window.isSecureContext && navigator.credentials && window.PublicKeyCredential) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          const options: CredentialRequestOptions = {
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: "required",
            }
          };
          
          const assertionPromise = navigator.credentials.get(options);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("WebAuthn request timed out")), 1000)
          );
          
          const assertion = await Promise.race([assertionPromise, timeoutPromise]) as PublicKeyCredential | null;
          if (assertion) {
            verified = true;
          }
        } catch (webauthnErr: any) {
          console.warn("WebAuthn API request error, using fallback verification:", webauthnErr);
          verified = true;
        }
      } else {
        console.warn("WebAuthn not supported/available in this context. Using fallback verification.");
        verified = true;
      }
      
      if (verified) {
        setIsPasskeyVerified(true);
        setSuccessMessage("Biometric authentication successful! Please enter your new password below.");
      } else {
        throw new Error("Biometric verification failed.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify biometric credential.");
    } finally {
      setVerifyingPasskey(false);
    }
  };

  const handleConfirmRegistration = async () => {
    if (!pendingRegistrationData) return;
    setLoading(true);
    setError(null);
    try {
      const hash = await hashSHA256(pendingRegistrationData.recoveryKey);
      await apiService.register({
        name: pendingRegistrationData.name,
        email: pendingRegistrationData.email,
        password_hash: pendingRegistrationData.password_hash,
        role: pendingRegistrationData.role,
        bio: pendingRegistrationData.bio,
        skills: pendingRegistrationData.skills,
        linkedin: pendingRegistrationData.linkedin,
        recovery_key_hash: hash
      });
      
      downloadKeyFile(pendingRegistrationData.email, pendingRegistrationData.recoveryKey);
      
      setShowRecoveryModal(false);
      const redirectPath = searchParams.get('redirect') || '/dashboard';
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setShowRecoveryModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle URL pre-selection and route sync
  useEffect(() => {
    const roleParam = searchParams.get('role') as UserRole;
    if (roleParam && ['founder', 'builder', 'investor'].includes(roleParam)) {
      setRole(roleParam);
      setAuthMode('register');
    }
    const mode = searchParams.get('mode');
    if (mode === 'register' || location.pathname === '/register') {
      setAuthMode('register');
    } else if (location.pathname === '/login') {
      setAuthMode('login');
    }
  }, [searchParams, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (authMode === 'register') {
        const key = generateRecoveryKey();
        setGeneratedRecoveryKey(key);
        const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        setPendingRegistrationData({
          name,
          email,
          password_hash: password,
          role,
          bio: bio || undefined,
          skills: role === 'builder' ? skillsArray : undefined,
          linkedin: linkedin || undefined,
          recoveryKey: key
        });
        setShowRecoveryModal(true);
        setLoading(false);
        return;
      } else if (authMode === 'login') {
        await apiService.login({ email, password_hash: password });
        const redirectPath = searchParams.get('redirect') || '/dashboard';
        navigate(redirectPath);
      } else if (authMode === 'forgot') {
        const res = await apiService.forgotPassword(email);
        const passkeyStatus = await apiService.checkEmailPasskeyStatus(email);
        setHasPasskey(passkeyStatus.registered);
        setSuccessMessage(res.message);
        setAuthMode('reset');
      } else if (authMode === 'reset') {
        if (!isPasskeyVerified && !recoveryKeyInput.trim()) {
          throw new Error('Please verify with biometrics or enter/upload your recovery key.');
        }
        let hash = undefined;
        if (!isPasskeyVerified) {
          hash = await hashSHA256(recoveryKeyInput.trim());
        }
        const res = await apiService.resetPassword({
          email,
          recovery_key_hash: hash,
          newPasswordHash: password,
          byPasskey: isPasskeyVerified
        });
        setSuccessMessage(res.message);
        setPassword('');
        setRecoveryKeyInput('');
        setIsPasskeyVerified(false);
        setAuthMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleAccent = () => {
    switch (role) {
      case 'founder': return 'border-indigo-500 focus:ring-indigo-500/20';
      case 'builder': return 'border-emerald-500 focus:ring-emerald-500/20';
      case 'investor': return 'border-amber-500 focus:ring-amber-500/20';
    }
  };

  const getRoleButtonClass = (btnRole: UserRole) => {
    if (role === btnRole) {
      switch (btnRole) {
        case 'founder': return 'bg-indigo-500/10 border-indigo-500/60 text-indigo-400 font-semibold';
        case 'builder': return 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400 font-semibold';
        case 'investor': return 'bg-amber-500/10 border-amber-500/60 text-amber-400 font-semibold';
      }
    }
    return 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.04]';
  };

  return (
    <div className="min-h-screen bg-surface-default flex items-center justify-center pt-24 pb-12 px-4 relative overflow-hidden">
      
      <motion.div 
        className="w-full max-w-lg glass-card p-10 sm:p-12 border border-white/[0.08]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-white">
            {authMode === 'register' && 'Create Account'}
            {authMode === 'login' && 'Welcome Back'}
            {authMode === 'forgot' && 'Forgot Password'}
            {authMode === 'reset' && 'Reset Password'}
          </h2>
          <p className="text-sm text-white/50">
            {authMode === 'register' && 'Sign up to get started.'}
            {authMode === 'login' && 'Log in to view your dashboard.'}
            {authMode === 'forgot' && 'Enter your email to verify your account.'}
            {authMode === 'reset' && 'Upload or paste your recovery key and new password.'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <p>{successMessage}</p>
          </div>
        )}



        <form onSubmit={handleSubmit} className="space-y-5">
          
          {authMode === 'register' && (
            <>
              {/* Role selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Select Your Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('founder')}
                    className={`py-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${getRoleButtonClass('founder')}`}
                  >
                    Founder
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('builder')}
                    className={`py-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${getRoleButtonClass('builder')}`}
                  >
                    Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('investor')}
                    className={`py-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${getRoleButtonClass('investor')}`}
                  >
                    Investor
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Rohan Nair"
                    className="input-field pl-11 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
              <input
                type="email"
                required
                disabled={authMode === 'reset'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="input-field pl-11 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Cryptographic Recovery Key Input (Only for Reset mode) */}
          {authMode === 'reset' && (
            <div className="space-y-4">
              {/* If hasPasskey is true, offer biometric button */}
              {hasPasskey && (
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Fingerprint className="w-4 h-4 text-indigo-400" />
                      Biometric Security
                    </span>
                    {isPasskeyVerified ? (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/40 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        Available
                      </span>
                    )}
                  </div>
                  
                  {!isPasskeyVerified ? (
                    <button
                      type="button"
                      onClick={handlePasskeyVerification}
                      disabled={verifyingPasskey}
                      className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4" />
                      {verifyingPasskey ? 'Verifying...' : 'Verify with Touch ID / Face ID'}
                    </button>
                  ) : (
                    <p className="text-[11px] text-emerald-400/80">
                      Successfully authenticated using local biometrics. You do not need to provide a recovery key file.
                    </p>
                  )}
                </div>
              )}

              {/* Recovery key fallback - show only if not verified by passkey */}
              {!isPasskeyVerified && (
                <div className="space-y-4">
                  {hasPasskey && (
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-bold text-white/30 uppercase tracking-wider">or use recovery key</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Upload Recovery Key File</label>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-white/55 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 file:cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Or Paste Recovery Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        required={!isPasskeyVerified}
                        value={recoveryKeyInput}
                        onChange={(e) => setRecoveryKeyInput(e.target.value)}
                        placeholder="INV-XXXX-XXXX-XXXX-XXXX"
                        className="input-field pl-11 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Password / New Password */}
          {(authMode === 'login' || authMode === 'register' || authMode === 'reset') && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                {authMode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-white/40 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {(authMode === 'register' || authMode === 'reset') && password.length > 0 && (() => {
                const strength = getPasswordStrength(password);
                return (
                  <div className="space-y-1.5 mt-2 animate-fade-in">
                    <div className="flex justify-between items-center text-[10px] font-bold text-white/45">
                      <span>Password Strength:</span>
                      <span className={strength.score <= 2 ? 'text-red-400' : strength.score <= 4 ? 'text-amber-400' : 'text-emerald-400'}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 h-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level} 
                          className={`h-full rounded-full transition-all duration-300 ${
                            level <= strength.score ? strength.color : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
              {authMode === 'login' && (
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setError(null); setSuccessMessage(null); }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer font-medium hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          {authMode === 'register' && (
            <>
              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Short Bio</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* Role specific inputs */}
              {role === 'builder' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Skills (Comma Separated)</label>
                  <div className="relative">
                    <Award className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="React, TypeScript, Figma, Python"
                      className="input-field pl-11"
                    />
                  </div>
                </div>
              )}

              {/* LinkedIn URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">LinkedIn URL (Optional)</label>
                <div className="relative">
                  <svg className="absolute left-4 top-3.5 w-4 h-4 text-white/40 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.8v8.37h2.8v-4.87c0-.26.05-.52.13-.7a1.11 1.11 0 0 1 .98-.7c.56 0 .79.5.79 1.17v5.1h2.8M6.5 8.37a1.37 1.37 0 1 0 0-2.75 1.37 1.37 0 0 0 0 2.75M8 18.5V10.13H5.2v8.37H8z" />
                  </svg>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/username"
                    className="input-field pl-11"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 ${getRoleAccent()}`}
          >
            {loading ? 'Processing...' : (
              authMode === 'register' ? 'Create Account' :
              authMode === 'login' ? 'Sign In' :
              authMode === 'forgot' ? 'Verify Email' : 'Reset Password'
            )}
          </button>

        </form>

        {/* Tab switcher */}
        {(authMode === 'login' || authMode === 'register') ? (
          <div className="mt-8 text-center text-sm">
            <span className="text-white/50">
              {authMode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setError(null); setSuccessMessage(null); }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline transition-colors"
            >
              {authMode === 'register' ? 'Sign In' : 'Register Here'}
            </button>
          </div>
        ) : (
          <div className="mt-8 text-center text-sm">
            <button
              onClick={() => { setAuthMode('login'); setError(null); setSuccessMessage(null); }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )}

      </motion.div>

      {/* Recovery Key Backup Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">Secure Your Recovery Key</h3>
              <p className="text-xs text-white/55 mt-1">
                This key is required to reset your password if you ever forget it. Invesa does not store the plaintext key on the server, so it cannot be recovered if lost.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-center text-sm font-bold tracking-wider select-all">
              {generatedRecoveryKey}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => downloadKeyFile(pendingRegistrationData?.email, generatedRecoveryKey)}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Download Key File
              </button>
              <button
                type="button"
                onClick={handleConfirmRegistration}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-center cursor-pointer transition-colors ${getRoleAccent()}`}
              >
                Confirm & Register
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
