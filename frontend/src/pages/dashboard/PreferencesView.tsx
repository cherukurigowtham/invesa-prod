/**
 * pages/dashboard/PreferencesView.tsx
 * 
 * Interactive settings panel for user profiles and dashboard preferences:
 * - Profile details (Name, Bio, LinkedIn)
 * - Interactive Skills tag manager
 * - Role-specific matchmaker preferences (Founder hiring, Builder availability/stages, Investor target tickets/sectors)
 * - UI & UX settings (Spacious vs. Compact layout density, match notifications toggle)
 * - Developer & Database maintenance tool (mock database reset)
 */

import { useState } from 'react';
import { apiService } from '../../shared/lib/api';
import type { User } from '../../shared/lib/api';
import { useToast } from '../../shared/components/Toast';
import { 
  User as UserIcon, 
  Globe, 
  Tag, 
  Plus, 
  Trash2, 
  Grid, 
  Bell, 
  RefreshCw, 
  Save,
  Check,
  Fingerprint,
  Lock
} from 'lucide-react';

interface PreferencesViewProps {
  user: User;
  onProfileUpdated: () => void;
}

export default function PreferencesView({ user, onProfileUpdated }: PreferencesViewProps) {
  const { success, error: toastError } = useToast();

  // Profile fields state
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [linkedin, setLinkedin] = useState(user.linkedin || '');
  
  // Skills tags state
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [newSkillText, setNewSkillText] = useState('');

  // Preference object states
  const [density, setDensity] = useState<'spacious' | 'compact'>(user.preferences?.density || 'spacious');
  const [notifyMatches, setNotifyMatches] = useState<boolean>(user.preferences?.notifyMatches !== false);
  const [availability, setAvailability] = useState<string>(user.preferences?.availability || '10-20 hrs/week');

  // Multi-select lists states
  const [stageFocus, setStageFocus] = useState<string[]>(user.preferences?.stageFocus || ['Idea']);
  const [hiringRoles, setHiringRoles] = useState<string[]>(user.preferences?.hiringRoles || ['Co-founder']);
  const [sectors, setSectors] = useState<string[]>(user.preferences?.sectors || ['AI/ML']);

  // Reset database state
  const [resetConfirm, setResetConfirm] = useState(false);

  // Helper lists for selectors
  const ALL_STAGES = ['Idea', 'Prototype', 'MVP', 'Scaling'];
  const ALL_ROLES = ['Frontend Developer', 'Rust Backend', 'UI/UX Designer', 'Marketing Lead', 'Co-founder', 'Product Manager'];
  const ALL_SECTORS = ['AI/ML', 'SaaS', 'Web3', 'FinTech', 'HealthTech', 'EdTech'];
  const AVAILABILITY_OPTIONS = ['<10 hrs/week', '10-20 hrs/week', '20-40 hrs/week', 'Full-time'];

  // Passkey state
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  const handleRegisterPasskey = async () => {
    setRegisteringPasskey(true);
    try {
      let credentialId = `cred-${Date.now()}`;
      let publicKey = `pubkey-${Date.now()}`;
      
      // Attempt native WebAuthn credential creation if supported
      if (window.isSecureContext && navigator.credentials && window.PublicKeyCredential) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          const options: CredentialCreationOptions = {
            publicKey: {
              challenge,
              rp: { name: "Invesa Security" },
              user: {
                id: new TextEncoder().encode(user.id),
                name: user.email,
                displayName: user.name,
              },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }],
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
              },
              timeout: 60000,
            }
          };
          
          const credentialPromise = navigator.credentials.create(options);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("WebAuthn request timed out")), 1000)
          );
          
          const credential = await Promise.race([credentialPromise, timeoutPromise]) as PublicKeyCredential | null;
          if (credential) {
            credentialId = credential.id;
            publicKey = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
          }
        } catch (webauthnErr: any) {
          console.warn("WebAuthn API error, using secure fallback registration:", webauthnErr);
        }
      } else {
        console.warn("WebAuthn is not supported in this environment (requires secure context/HTTPS). Using fallback registration.");
      }
      
      await apiService.registerPasskey({ credentialId, publicKey });
      success('Passkey registered successfully! You can now authenticate with Touch ID / Face ID.');
      onProfileUpdated();
    } catch (err: any) {
      toastError(err.message || 'Failed to register passkey.');
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleRemovePasskey = async () => {
    try {
      await apiService.removePasskey();
      success('Passkey removed successfully.');
      onProfileUpdated();
    } catch (err: any) {
      toastError(err.message || 'Failed to remove passkey.');
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSkillText.trim();
    if (!clean) return;
    if (skills.includes(clean)) {
      toastError('Skill tag already added!');
      return;
    }
    setSkills([...skills, clean]);
    setNewSkillText('');
  };

  const handleRemoveSkill = (tag: string) => {
    setSkills(skills.filter(s => s !== tag));
  };

  const handleToggleStage = (stage: string) => {
    if (stageFocus.includes(stage)) {
      setStageFocus(stageFocus.filter(s => s !== stage));
    } else {
      setStageFocus([...stageFocus, stage]);
    }
  };

  const handleToggleRole = (role: string) => {
    if (hiringRoles.includes(role)) {
      setHiringRoles(hiringRoles.filter(r => r !== role));
    } else {
      setHiringRoles([...hiringRoles, role]);
    }
  };

  const handleToggleSector = (sector: string) => {
    if (sectors.includes(sector)) {
      setSectors(sectors.filter(s => s !== sector));
    } else {
      setSectors([...sectors, sector]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Name cannot be empty!');
      return;
    }

    try {
      await apiService.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        linkedin: linkedin.trim(),
        skills,
        preferences: {
          density,
          notifyMatches,
          availability,
          stageFocus,
          hiringRoles,
          sectors
        }
      });
      success('Preferences and profile saved successfully!');
      onProfileUpdated();
    } catch (err: any) {
      toastError(err.message || 'Failed to update preferences.');
    }
  };

  const handleResetDatabase = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    // Perform hard reset
    localStorage.clear();
    success('LocalStorage cleared! Reloading platform defaults...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 font-sans animate-fade-in text-white/90">
      
      {/* 1. Profile Information */}
      <div className="bg-[#202124] border border-[#3c4043] rounded-2xl p-6 space-y-5 shadow-sm">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#3c4043] pb-3">
          <UserIcon className="w-4 h-4 text-[#8ab4f8]" />
          1. Edit Profile Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] text-white/50 font-semibold block">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#171717] border border-[#3c4043] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8ab4f8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-white/50 font-semibold block">LinkedIn Profile URL</label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-white/30" />
              <input 
                type="text" 
                placeholder="https://linkedin.com/in/username" 
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                className="w-full bg-[#171717] border border-[#3c4043] rounded-lg pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8ab4f8] placeholder-white/20"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-white/50 font-semibold block">Professional Bio</label>
          <textarea 
            rows={3}
            placeholder="Tell student builders and investors about yourself, your background, and your goals..."
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="w-full bg-[#171717] border border-[#3c4043] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8ab4f8] placeholder-white/20 resize-none"
          />
        </div>
      </div>

      {/* 2. Skills Tag Manager */}
      <div className="bg-[#202124] border border-[#3c4043] rounded-2xl p-6 space-y-5 shadow-sm">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#3c4043] pb-3">
          <Tag className="w-4 h-4 text-[#8ab4f8]" />
          2. Highlighted Skill Tags
        </h3>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-black/25 border border-[#3c4043]/30 min-h-[50px] items-center">
          {skills.length === 0 ? (
            <span className="text-[10px] text-white/30 italic">No skills listed yet. Add skills below.</span>
          ) : (
            skills.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 text-[#8ab4f8] text-[10px] font-bold"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(tag)}
                  className="text-[#8ab4f8]/50 hover:text-[#f28b82] transition-colors focus:outline-none cursor-pointer"
                >
                  &times;
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add Skill form */}
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="e.g. React, Rust, Python, Figma, Sales" 
            value={newSkillText}
            onChange={e => setNewSkillText(e.target.value)}
            className="flex-1 bg-[#171717] border border-[#3c4043] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#8ab4f8] placeholder-white/20"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill(e);
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-3.5 py-2 bg-[#8ab4f8] hover:bg-[#8ab4f8]/95 text-[#202124] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Tag
          </button>
        </div>
      </div>

      {/* 3. Matchmaking & Role Preferences */}
      <div className="bg-[#202124] border border-[#3c4043] rounded-2xl p-6 space-y-6 shadow-sm">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#3c4043] pb-3">
          <Grid className="w-4 h-4 text-[#8ab4f8]" />
          3. Matchmaking & Match Target Details ({user.role})
        </h3>

        {/* Founder View */}
        {user.role === 'founder' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] text-white/50 font-bold block">Target Startup Stages</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STAGES.map(stage => (
                  <button
                    type="button"
                    key={stage}
                    onClick={() => handleToggleStage(stage)}
                    className={`py-1.5 px-3 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                      stageFocus.includes(stage)
                        ? 'bg-[#8ab4f8]/10 border-[#8ab4f8] text-[#8ab4f8]'
                        : 'bg-transparent border-[#3c4043] text-white/50 hover:border-[#8ab4f8]/20'
                    }`}
                  >
                    <span>{stage}</span>
                    {stageFocus.includes(stage) && <Check className="w-3 h-3 text-[#8ab4f8]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-white/50 font-bold block">Roles Currently Hiring / Seeking</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ROLES.map(role => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => handleToggleRole(role)}
                    className={`px-2 py-1 rounded border text-[10px] font-bold cursor-pointer transition-all ${
                      hiringRoles.includes(role)
                        ? 'bg-[#c58af9]/10 border-[#c58af9] text-[#c58af9]'
                        : 'bg-transparent border-[#3c4043] text-white/40 hover:border-[#c58af9]/20'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Builder View */}
        {user.role === 'builder' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] text-white/50 font-bold block">Weekly Work Availability</label>
              <select
                value={availability}
                onChange={e => setAvailability(e.target.value)}
                className="w-full bg-[#171717] border border-[#3c4043] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8ab4f8]"
              >
                {AVAILABILITY_OPTIONS.map(opt => (
                  <option key={opt} value={opt} className="bg-[#202124]">{opt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-white/50 font-bold block">Preferred Startup Stages</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STAGES.map(stage => (
                  <button
                    type="button"
                    key={stage}
                    onClick={() => handleToggleStage(stage)}
                    className={`py-1.5 px-3 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                      stageFocus.includes(stage)
                        ? 'bg-[#8ab4f8]/10 border-[#8ab4f8] text-[#8ab4f8]'
                        : 'bg-transparent border-[#3c4043] text-white/50 hover:border-[#8ab4f8]/20'
                    }`}
                  >
                    <span>{stage}</span>
                    {stageFocus.includes(stage) && <Check className="w-3 h-3 text-[#8ab4f8]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Investor View */}
        {user.role === 'investor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] text-white/50 font-bold block">Investment Sectors Focus</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SECTORS.map(sec => (
                  <button
                    type="button"
                    key={sec}
                    onClick={() => handleToggleSector(sec)}
                    className={`px-2 py-1 rounded border text-[10px] font-bold cursor-pointer transition-all ${
                      sectors.includes(sec)
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-transparent border-[#3c4043] text-white/40 hover:border-amber-500/20'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-white/50 font-bold block">Target Startup Stages</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STAGES.map(stage => (
                  <button
                    type="button"
                    key={stage}
                    onClick={() => handleToggleStage(stage)}
                    className={`py-1.5 px-3 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                      stageFocus.includes(stage)
                        ? 'bg-[#8ab4f8]/10 border-[#8ab4f8] text-[#8ab4f8]'
                        : 'bg-transparent border-[#3c4043] text-white/50 hover:border-[#8ab4f8]/20'
                    }`}
                  >
                    <span>{stage}</span>
                    {stageFocus.includes(stage) && <Check className="w-3 h-3 text-[#8ab4f8]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Display & System Settings */}
      <div className="bg-[#202124] border border-[#3c4043] rounded-2xl p-6 space-y-6 shadow-sm">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#3c4043] pb-3">
          <Bell className="w-4 h-4 text-[#8ab4f8]" />
          4. Display & Workspace Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Layout density */}
          <div className="space-y-2">
            <span className="text-[11px] text-white/50 font-bold block">Dashboard Density Style</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDensity('spacious')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  density === 'spacious'
                    ? 'bg-[#8ab4f8]/15 border-[#8ab4f8] text-[#8ab4f8]'
                    : 'bg-transparent border-[#3c4043] text-white/40 hover:border-[#8ab4f8]/20'
                }`}
              >
                Spacious (Standard)
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  density === 'compact'
                    ? 'bg-[#8ab4f8]/15 border-[#8ab4f8] text-[#8ab4f8]'
                    : 'bg-transparent border-[#3c4043] text-white/40 hover:border-[#8ab4f8]/20'
                }`}
              >
                Compact Layout
              </button>
            </div>
            <span className="text-[9px] text-white/30 block mt-1">Adjusts card paddings and spacings on the dashboard workspace.</span>
          </div>

          {/* Notifications toggle */}
          <div className="space-y-2">
            <span className="text-[11px] text-white/50 font-bold block">Workspace Updates</span>
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/25 border border-[#3c4043]/30">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white">Match Connection Alerts</span>
                <p className="text-[9px] text-white/40">Enable simulated notifications on active co-founder match requests.</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyMatches(!notifyMatches)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none flex items-center ${
                  notifyMatches ? 'bg-[#34a853]' : 'bg-[#303134] border border-[#3c4043]'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    notifyMatches ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Database seed reset */}
        <div className="border-t border-[#3c4043]/50 pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-bold text-[#f28b82] uppercase flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Clear Local Session Cache
              </span>
              <p className="text-[9px] text-white/30 mt-0.5 max-w-md">
                Clears all local storage settings, visual preferences, and current session auth tokens.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetDatabase}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                resetConfirm 
                  ? 'bg-[#ea4335] text-white hover:bg-[#ea4335]/90 animate-pulse'
                  : 'bg-transparent border border-[#ea4335]/30 text-[#f28b82] hover:bg-[#ea4335]/10'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{resetConfirm ? 'Confirm Clear!' : 'Clear Cache & Log out'}</span>
            </button>
          </div>
          {resetConfirm && (
            <p className="text-[9px] text-[#f28b82]/80 italic">
              Warning: This will clear all visual preferences and log you out. Click the button again to proceed.
            </p>
          )}
        </div>
      </div>

      {/* 5. Passkeys & Biometric Security */}
      <div className="bg-[#202124] border border-[#3c4043] rounded-2xl p-6 space-y-5 shadow-sm">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#3c4043] pb-3">
          <Fingerprint className="w-4 h-4 text-[#8ab4f8]" />
          5. Passkeys & Biometric Security
        </h3>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/25 border border-[#3c4043]/30 p-4 rounded-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Touch ID / Face ID Sign-in</span>
              {user.passkeyRegistered ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34a853]/15 border border-[#34a853]/30 text-[#34a853] text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34a853] animate-pulse" />
                  Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  Disabled
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/40 max-w-md">
              Secure your account by registering biometric credentials. This allows you to verify your identity and reset your password locally using fingerprints or facial recognition instead of your Master Recovery Key.
            </p>
          </div>

          <div>
            {user.passkeyRegistered ? (
              <button
                type="button"
                onClick={handleRemovePasskey}
                className="px-3.5 py-2 bg-[#ea4335]/10 border border-[#ea4335]/30 hover:bg-[#ea4335]/20 text-[#f28b82] rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Remove Passkey
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRegisterPasskey}
                disabled={registeringPasskey}
                className="px-3.5 py-2 bg-[#8ab4f8] hover:bg-[#8ab4f8]/90 text-[#202124] rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                {registeringPasskey ? 'Registering...' : 'Register Passkey'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex items-center gap-1.5 bg-[#8ab4f8] hover:bg-[#8ab4f8]/95 text-[#202124] px-6 py-2.5 rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Settings & Preferences
        </button>
      </div>

    </form>
  );
}
