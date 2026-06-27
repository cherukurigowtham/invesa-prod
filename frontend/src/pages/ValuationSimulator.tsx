/**
 * ValuationSimulator.tsx
 *
 * Top-level page for the cap table & exit waterfall simulator.
 * All state, math, and API calls live here. Visual sections are
 * delegated to focused sub-components under ./valuation/.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type SavedSimulation, type User } from '../shared/lib/api';
import { PieChart, Save, Trash, Lock, Bookmark, Sliders, Info, HelpCircle, FileDown, ShieldAlert, TrendingDown } from 'lucide-react';
import { useToast } from '../shared/components/Toast';

// ── Modular sub-components ────────────────────────────────────────────────────
import PresetsPanel from './valuation/PresetsPanel';
import GlossaryDrawer from './valuation/GlossaryDrawer';
import CapTableDonut from './valuation/CapTableDonut';
import PayoutGraph from './valuation/PayoutGraph';


// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

// ─── Component ────────────────────────────────────────────────────────────────

export default function ValuationSimulator({ isSubComponent = false }: { isSubComponent?: boolean }) {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);


  // ── Seed round inputs ─────────────────────────────────────────────────────
  const [title, setTitle] = useState('My Cap Table Model');
  const [preMoney, setPreMoney] = useState(5_000_000);
  const [raise, setRaise] = useState(1_000_000);
  const [optionPool, setOptionPool] = useState(10);
  const [coFounderSplit, setCoFounderSplit] = useState(40);

  // ── Series A toggle & inputs ──────────────────────────────────────────────
  const [enableSeriesA, setEnableSeriesA] = useState(false);
  const [seriesAPreMoney, setSeriesAPreMoney] = useState(15_000_000);
  const [seriesARaise, setSeriesARaise] = useState(3_000_000);
  const [seriesAOptionPool, setSeriesAOptionPool] = useState(5);

  // ── Exit waterfall inputs ─────────────────────────────────────────────────
  const [exitValue, setExitValue] = useState(15_000_000);
  const [prefMultiple, setPrefMultiple] = useState(1);
  const [prefType, setPrefType] = useState<'participating' | 'non-participating'>('non-participating');

  // ── Black Swan Stress Test inputs ─────────────────────────────────────────
  const [vestingMonths, setVestingMonths] = useState(48);
  const [antiDilutionType, setAntiDilutionType] = useState<'none' | 'full-ratchet' | 'weighted-average'>('none');
  const [redistributeUnvested, setRedistributeUnvested] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [savedSims, setSavedSims] = useState<SavedSimulation[]>([]);
  const [loadingSims, setLoadingSims] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showInputs, setShowInputs] = useState(true);
  const [showGlossary, setShowGlossary] = useState(false);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const currentUser = apiService.getCurrentUser();
    setUser(currentUser);
    if (currentUser) fetchSavedSimulations();
  }, []);

  // ─── API helpers ─────────────────────────────────────────────────────────

  const fetchSavedSimulations = async () => {
    setLoadingSims(true);
    try {
      const data = await apiService.getSimulations();
      setSavedSims(data);
    } catch (err) {
      console.error('Failed to load simulations', err);
    } finally {
      setLoadingSims(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!title.trim()) { toastError('Please enter a title for the simulation'); return; }
    setSaveLoading(true);
    try {
      await apiService.saveSimulation({
        title,
        preMoneyValuation: preMoney,
        raiseAmount: raise,
        optionPoolPercent: optionPool,
        coFounderPercent: coFounderSplit,
        seriesAValuation: enableSeriesA ? seriesAPreMoney : 0,
        seriesARaise: enableSeriesA ? seriesARaise : 0,
        seriesAOptionPool: enableSeriesA ? seriesAOptionPool : 0,
        vestingMonths,
        antiDilutionType,
        redistributeUnvested,
      });
      fetchSavedSimulations();
      success('Simulation saved successfully!');
    } catch (err: any) {
      toastError(err.message || 'Failed to save simulation');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this simulation?')) return;
    try {
      await apiService.deleteSimulation(id);
      success('Simulation deleted successfully.');
      fetchSavedSimulations();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete');
    }
  };

  const loadSim = (sim: SavedSimulation) => {
    setTitle(sim.title);
    setPreMoney(sim.preMoneyValuation);
    setRaise(sim.raiseAmount);
    setOptionPool(sim.optionPoolPercent);
    setCoFounderSplit(sim.coFounderPercent);
    if (sim.seriesAValuation > 0) {
      setEnableSeriesA(true);
      setSeriesAPreMoney(sim.seriesAValuation);
      setSeriesARaise(sim.seriesARaise);
      setSeriesAOptionPool(sim.seriesAOptionPool);
    } else {
      setEnableSeriesA(false);
    }
    setVestingMonths(sim.vestingMonths ?? 48);
    setAntiDilutionType((sim.antiDilutionType as any) ?? 'none');
    setRedistributeUnvested(sim.redistributeUnvested ?? false);
  };

  const handleDownloadReport = async () => {
    try {
      // Dynamically import jsPDF only when user explicitly clicks "Export PDF"
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      // Slate dark background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, width, height, 'F');

      // Borders
      doc.setDrawColor(99, 102, 241); // indigo-500
      doc.setLineWidth(2);
      doc.rect(20, 20, width - 40, height - 40);

      // Header
      doc.setTextColor(99, 102, 241);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('I N V E S A', width / 2, 50, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('STARTUP DILUTION REPORT', width / 2, 85, { align: 'center' });

      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, width / 2, 105, { align: 'center' });

      // Dividers
      doc.setDrawColor(255, 255, 255, 0.1);
      doc.line(40, 120, width - 40, 120);

      // Section 1: Inputs
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('1. Scenario Assumptions & Inputs', 40, 145);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      doc.setFontSize(11);
      
      let y = 170;
      doc.text(`Scenario Title: ${title}`, 50, y); y += 20;
      doc.text(`Seed Pre-Money Valuation: ${formatCurrency(preMoney)}`, 50, y); y += 20;
      doc.text(`Seed Raise Amount: ${formatCurrency(raise)}`, 50, y); y += 20;
      doc.text(`Seed Option Pool: ${optionPool}%`, 50, y); y += 20;
      doc.text(`Founder Share Split (Co-founder / Lead): ${coFounderSplit}% / ${100 - coFounderSplit}%`, 50, y); y += 20;

      if (enableSeriesA) {
        doc.setFont('helvetica', 'bold');
        doc.text('Series A Expansion Round:', 50, y); y += 20;
        doc.setFont('helvetica', 'normal');
        doc.text(`- Series A Pre-Money Valuation: ${formatCurrency(seriesAPreMoney)}`, 60, y); y += 20;
        doc.text(`- Series A Raise Amount: ${formatCurrency(seriesARaise)}`, 60, y); y += 20;
        doc.text(`- Series A Option Pool: ${seriesAOptionPool}%`, 60, y); y += 20;
      } else {
        doc.text('Series A Expansion Round: Disabled', 50, y); y += 20;
      }

      // Black Swan Stress Test details
      doc.setFont('helvetica', 'bold');
      doc.text('Black Swan Stress Test Parameters:', 50, y); y += 20;
      doc.setFont('helvetica', 'normal');
      if (vestingMonths < 48) {
        const treatment = redistributeUnvested ? 'Canceled (Diluted Others Up)' : 'Returned to Company Treasury';
        doc.text(`- Co-founder Departure: Month ${vestingMonths} (Vested: ${(vestedFraction * 100).toFixed(0)}%, Forfeited: ${((1 - vestedFraction) * 100).toFixed(0)}%)`, 60, y); y += 20;
        doc.text(`- Forfeiture Treatment: ${treatment}`, 60, y); y += 20;
      } else {
        doc.text('- Co-founder Vesting: Fully Vested (48 months, no departure)', 60, y); y += 20;
      }

      if (enableSeriesA && isDownRound) {
        const protectionName = antiDilutionType === 'none' ? 'None' : antiDilutionType === 'weighted-average' ? 'Broad-Based Weighted Average' : 'Full Ratchet';
        doc.text(`- Down-Round Status: Triggered (Series A Pre-Money < Seed Post-Money)`, 60, y); y += 20;
        doc.text(`- Anti-Dilution Protection Applied: ${protectionName}`, 60, y); y += 20;
        if (antiDilutionType !== 'none') {
          doc.text(`- Adjusted Investor Price Scaling Factor: ${antiDilutionFactor.toFixed(4)}x`, 60, y); y += 20;
        }
      } else {
        doc.text('- Down-Round Status: No Down-Round / Protections Inactive', 60, y); y += 20;
      }

      doc.line(40, y + 5, width - 40, y + 5);
      y += 25;

      // Section 2: Cap Table Ownership
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('2. Post-Round Cap Table Ownership', 40, y);
      y += 25;

      // Draw table header
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(40, y - 12, width - 80, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('Shareholder Category', 50, y);
      doc.text('Ownership Percentage', 250, y);
      doc.text('Calculated Value', 420, y);
      y += 20;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      capTable.forEach(row => {
        doc.text(row.name, 50, y);
        doc.text(`${row.pct.toFixed(2)}%`, 250, y);
        doc.text(formatCurrency(row.value), 420, y);
        y += 18;
      });

      doc.line(40, y + 5, width - 40, y + 5);
      y += 25;

      // Section 3: Exit Waterfall
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('3. Simulated Exit Payout Distribution', 40, y);
      y += 20;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`Assumed Startup Exit Valuation: ${formatCurrency(exitValue)}`, 50, y); y += 18;
      doc.text(`Liquidation Preference: ${prefMultiple}x (${prefType})`, 50, y); y += 25;

      const payouts = calculateWaterfallPayouts(exitValue);

      // Draw payout table header
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(40, y - 12, width - 80, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Shareholder', 50, y);
      doc.text('Payout Amount', 420, y);
      y += 20;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      
      doc.text('Lead Founder', 50, y); doc.text(formatCurrency(payouts.lead), 420, y); y += 18;
      doc.text('Co-founder', 50, y); doc.text(formatCurrency(payouts.co), 420, y); y += 18;
      doc.text('Option Pool', 50, y); doc.text(formatCurrency(payouts.seedOpt + payouts.aOpt), 420, y); y += 18;
      doc.text('Investors', 50, y); doc.text(formatCurrency(payouts.seedInv + payouts.aInv), 420, y); y += 18;

      doc.save(`${title.replace(/\s+/g, '_')}_dilution_report.pdf`);
      success('Financial Dilution Report downloaded successfully!');
    } catch (err) {
      toastError('Failed to generate dilution report.');
      console.error(err);
    }
  };

  // ─── Cap table math ───────────────────────────────────────────────────────

  // 1. Initial Seed Round Percentages (pre-vesting forfeiture)
  const postMoneySeed = preMoney + raise;
  const seedInvestorPct = postMoneySeed > 0 ? (raise / postMoneySeed) * 100 : 0;
  const remainingFounderPct = 100 - seedInvestorPct - optionPool;
  const coFounderSeedPct = remainingFounderPct * (coFounderSplit / 100);
  const leadFounderSeedPct = remainingFounderPct - coFounderSeedPct;

  // 2. Vesting Stress-Test Forfeiture (applied to Co-founder)
  const vestedFraction = useMemo(() => {
    if (vestingMonths < 12) return 0; // 1-year cliff
    return vestingMonths / 48;
  }, [vestingMonths]);

  const coFounderVestedSeedPct = coFounderSeedPct * vestedFraction;
  const coFounderUnvestedSeedPct = coFounderSeedPct * (1 - vestedFraction);

  // Determine Seed stage percentages after vesting forfeiture
  const seedStageCapTable = useMemo(() => {
    if (redistributeUnvested) {
      // Canceled: scale everyone else up
      const activePctTotal = 100 - coFounderUnvestedSeedPct;
      const scale = activePctTotal > 0 ? 100 / activePctTotal : 1;
      return {
        leadFounderPct: leadFounderSeedPct * scale,
        coFounderPct: coFounderVestedSeedPct * scale,
        seedOptionPct: optionPool * scale,
        seedInvestorPct: seedInvestorPct * scale,
        treasuryPct: 0,
      };
    } else {
      // Returned to Treasury
      return {
        leadFounderPct: leadFounderSeedPct,
        coFounderPct: coFounderVestedSeedPct,
        seedOptionPct: optionPool,
        seedInvestorPct: seedInvestorPct,
        treasuryPct: coFounderUnvestedSeedPct,
      };
    }
  }, [redistributeUnvested, leadFounderSeedPct, coFounderVestedSeedPct, coFounderUnvestedSeedPct, optionPool, seedInvestorPct]);

  // Down-round detection
  const isDownRound = enableSeriesA && seriesAPreMoney < postMoneySeed;

  // Anti-dilution Factor F
  const antiDilutionFactor = useMemo(() => {
    if (!isDownRound || antiDilutionType === 'none') return 1;
    if (antiDilutionType === 'full-ratchet') {
      return seriesAPreMoney > 0 ? postMoneySeed / seriesAPreMoney : 1;
    }
    if (antiDilutionType === 'weighted-average') {
      // Broad-Based Weighted Average formula:
      // F = (1 + seriesARaise / seriesAPreMoney) / (1 + seriesARaise / postMoneySeed)
      const num = 1 + (seriesAPreMoney > 0 ? seriesARaise / seriesAPreMoney : 0);
      const den = 1 + (postMoneySeed > 0 ? seriesARaise / postMoneySeed : 0);
      return den > 0 ? num / den : 1;
    }
    return 1;
  }, [isDownRound, antiDilutionType, postMoneySeed, seriesAPreMoney, seriesARaise]);

  // Calculate Series A dilution and anti-dilution adjustments
  const computedCapTable = useMemo(() => {
    // Get pre-Series A adjusted percentages (with anti-dilution if applicable)
    const seedInvPctPreA = seedStageCapTable.seedInvestorPct;
    
    // Scale Seed Investor shares by F
    const F = antiDilutionFactor;
    const adjustedTotalPct = 100 + seedInvPctPreA * (F - 1);
    const adjScale = adjustedTotalPct > 0 ? 100 / adjustedTotalPct : 1;

    const seedInvestorPctPostAD = seedInvPctPreA * F * adjScale;
    const leadFounderPctPostAD = seedStageCapTable.leadFounderPct * adjScale;
    const coFounderPctPostAD = seedStageCapTable.coFounderPct * adjScale;
    const seedOptionPctPostAD = seedStageCapTable.seedOptionPct * adjScale;
    const treasuryPctPostAD = seedStageCapTable.treasuryPct * adjScale;

    if (!enableSeriesA) {
      return {
        leadFounder: seedStageCapTable.leadFounderPct,
        coFounder: seedStageCapTable.coFounderPct,
        seedOption: seedStageCapTable.seedOptionPct,
        seedInvestor: seedStageCapTable.seedInvestorPct,
        treasury: seedStageCapTable.treasuryPct,
        seriesAOption: 0,
        seriesAInvestor: 0,
        postMoney: postMoneySeed,
        totalRaise: raise,
      };
    }

    // Series A round parameters
    const postMoneyA = seriesAPreMoney + seriesARaise;
    const seriesAInvestorPct = postMoneyA > 0 ? (seriesARaise / postMoneyA) * 100 : 0;
    const dilutionMultiplier = (100 - seriesAInvestorPct - seriesAOptionPool) / 100;

    return {
      leadFounder: leadFounderPctPostAD * dilutionMultiplier,
      coFounder: coFounderPctPostAD * dilutionMultiplier,
      seedOption: seedOptionPctPostAD * dilutionMultiplier,
      seedInvestor: seedInvestorPctPostAD * dilutionMultiplier,
      treasury: treasuryPctPostAD * dilutionMultiplier,
      seriesAOption: seriesAOptionPool,
      seriesAInvestor: seriesAInvestorPct,
      postMoney: postMoneyA,
      totalRaise: raise + seriesARaise,
    };
  }, [enableSeriesA, seedStageCapTable, antiDilutionFactor, seriesAPreMoney, seriesARaise, seriesAOptionPool, postMoneySeed, raise]);

  // Cap table entries passed to <CapTableDonut />
  const capTable = useMemo(() => {
    const list = [
      { name: 'Lead Founder', pct: computedCapTable.leadFounder, value: (computedCapTable.leadFounder / 100) * computedCapTable.postMoney, color: '#6366f1' },
      { name: 'Co-founder', pct: computedCapTable.coFounder, value: (computedCapTable.coFounder / 100) * computedCapTable.postMoney, color: '#3b82f6' },
      { name: 'Option Pool', pct: computedCapTable.seedOption, value: (computedCapTable.seedOption / 100) * computedCapTable.postMoney, color: '#ec4899' },
      { name: 'Seed Investors', pct: computedCapTable.seedInvestor, value: (computedCapTable.seedInvestor / 100) * computedCapTable.postMoney, color: '#f59e0b' },
    ];

    if (computedCapTable.treasury > 0) {
      list.push({
        name: 'Company Treasury (Unvested)',
        pct: computedCapTable.treasury,
        value: (computedCapTable.treasury / 100) * computedCapTable.postMoney,
        color: '#64748b',
      });
    }

    if (enableSeriesA) {
      list.push(
        { name: 'Series A Option Pool', pct: computedCapTable.seriesAOption, value: (computedCapTable.seriesAOption / 100) * computedCapTable.postMoney, color: '#a855f7' },
        { name: 'Series A Investors', pct: computedCapTable.seriesAInvestor, value: (computedCapTable.seriesAInvestor / 100) * computedCapTable.postMoney, color: '#10b981' }
      );
    }
    return list;
  }, [computedCapTable, enableSeriesA]);

  // ─── Exit waterfall math ──────────────────────────────────────────────────

  const calculateWaterfallPayouts = (val: number) => {
    const pctLead    = computedCapTable.leadFounder;
    const pctCo      = computedCapTable.coFounder;
    const pctSeed    = computedCapTable.seedInvestor;
    const pctSeedOpt = computedCapTable.seedOption;
    const pctAInv    = computedCapTable.seriesAInvestor;
    const pctAOpt    = computedCapTable.seriesAOption;
    const pctTreasury = computedCapTable.treasury;

    const lpSeed  = raise * prefMultiple;
    const lpA     = enableSeriesA ? seriesARaise * prefMultiple : 0;

    const totalActive = 100 - pctTreasury;

    if (prefType === 'participating') {
      let rem = val;
      const p = { lead: 0, co: 0, seedOpt: 0, seedInv: 0, aOpt: 0, aInv: 0 };
      p.aInv += enableSeriesA ? Math.min(rem, lpA) : 0;     rem -= p.aInv;
      p.seedInv += Math.min(rem, lpSeed);                    rem -= p.seedInv;
      if (rem > 0 && totalActive > 0) {
        p.lead    = rem * (pctLead    / totalActive);
        p.co      = rem * (pctCo      / totalActive);
        p.seedOpt = rem * (pctSeedOpt / totalActive);
        p.seedInv += rem * (pctSeed   / totalActive);
        if (enableSeriesA) {
          p.aOpt = rem * (pctAOpt / totalActive);
          p.aInv += rem * (pctAInv / totalActive);
        }
      }
      return p;
    }

    // Non-participating — game-theoretic Nash equilibrium
    const scenario = (aConverts: boolean, seedConverts: boolean) => {
      let rem = val;
      const p = { lead: 0, co: 0, seedOpt: 0, seedInv: 0, aOpt: 0, aInv: 0 };
      if (enableSeriesA && !aConverts) { p.aInv = Math.min(rem, lpA); rem -= p.aInv; }
      if (!seedConverts)               { p.seedInv = Math.min(rem, lpSeed); rem -= p.seedInv; }
      if (rem > 0) {
        let totalPct = pctLead + pctCo + pctSeedOpt;
        if (enableSeriesA) totalPct += pctAOpt;
        if (enableSeriesA && aConverts) totalPct += pctAInv;
        if (seedConverts) totalPct += pctSeed;
        if (totalPct > 0) {
          p.lead    = rem * (pctLead    / totalPct);
          p.co      = rem * (pctCo      / totalPct);
          p.seedOpt = rem * (pctSeedOpt / totalPct);
          if (enableSeriesA) {
            p.aOpt = rem * (pctAOpt / totalPct);
            if (aConverts) p.aInv = rem * (pctAInv / totalPct);
          }
          if (seedConverts) p.seedInv = rem * (pctSeed / totalPct);
        }
      }
      return p;
    };

    if (!enableSeriesA) {
      const s00 = scenario(false, false);
      const s01 = scenario(false, true);
      return s01.seedInv > s00.seedInv ? s01 : s00;
    }

    const s00 = scenario(false, false), s01 = scenario(false, true);
    const s10 = scenario(true,  false), s11 = scenario(true,  true);
    const seedBestIfAConverts    = s11.seedInv > s10.seedInv ? s11 : s10;
    const seedBestIfANoConvert   = s01.seedInv > s00.seedInv ? s01 : s00;
    return seedBestIfAConverts.aInv > seedBestIfANoConvert.aInv
      ? seedBestIfAConverts
      : seedBestIfANoConvert;
  };

  // Memoised values for the current exit slider position
  const wrapperClass = isSubComponent
    ? "relative"
    : "min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative";

  const containerClass = isSubComponent
    ? ""
    : "max-w-3xl mx-auto px-4 sm:px-6";

  const waterfallDeps = [
    exitValue, enableSeriesA, computedCapTable, raise, seriesARaise, prefMultiple, prefType,
  ];

  const exitPayouts = useMemo(
    () => calculateWaterfallPayouts(exitValue),
    waterfallDeps,
  );

  // 11 steps 0 → 150 M for the graph
  const graphSteps = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const val = i * 15_000_000;
        const p = calculateWaterfallPayouts(val);
        return { exitValue: val, ...p };
      }),
    waterfallDeps,
  );

  // ─── Preset handler ───────────────────────────────────────────────────────

  const applyPreset = (preset: {
    title: string; preMoney: number; raise: number; optionPool: number;
    coFounderSplit: number; enableSeriesA: boolean;
    seriesAPreMoney?: number; seriesARaise?: number; seriesAOptionPool?: number;
  }) => {
    setTitle(preset.title);
    setPreMoney(preset.preMoney);
    setRaise(preset.raise);
    setOptionPool(preset.optionPool);
    setCoFounderSplit(preset.coFounderSplit);
    setEnableSeriesA(preset.enableSeriesA);
    if (preset.enableSeriesA) {
      setSeriesAPreMoney(preset.seriesAPreMoney ?? 15_000_000);
      setSeriesARaise(preset.seriesARaise ?? 3_000_000);
      setSeriesAOptionPool(preset.seriesAOptionPool ?? 5);
    }
    // Reset stress-test inputs to default
    setVestingMonths(48);
    setAntiDilutionType('none');
    setRedistributeUnvested(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>

        {/* ── Page header ── */}
        {isSubComponent ? (
          <div className="flex justify-end gap-2 mb-6 border-b border-white/5 pb-4">
            <button
              onClick={() => setShowPresets(p => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                showPresets
                  ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                  : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>
            <button
              onClick={() => setShowInputs(p => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                showInputs
                  ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                  : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-[#8ab4f8]" />
              <span>Configure Model</span>
            </button>
            <button
              onClick={() => setShowGlossary(p => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                showGlossary
                  ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                  : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Glossary</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#8ab4f8]/20 bg-[#8ab4f8]/5 hover:bg-[#8ab4f8]/10 text-[#8ab4f8] transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8ab4f8]/10 border border-[#8ab4f8]/20 flex items-center justify-center flex-shrink-0">
                <PieChart className="w-5 h-5 text-[#8ab4f8]" />
              </div>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Shares Simulator
                </h1>
                <p className="text-white/40 text-xs mt-0.5">
                  Simulate startup equity, funding rounds, and dilution.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowPresets(p => !p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  showPresets
                    ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                    : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Presets</span>
              </button>
              <button
                onClick={() => setShowInputs(p => !p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  showInputs
                    ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                    : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Info className="w-3.5 h-3.5 text-[#8ab4f8]" />
                <span>Configure Model</span>
              </button>
              <button
                onClick={() => setShowGlossary(p => !p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  showGlossary
                    ? 'bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/30'
                    : 'bg-white/[0.01] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Glossary</span>
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#8ab4f8]/20 bg-[#8ab4f8]/5 hover:bg-[#8ab4f8]/10 text-[#8ab4f8] transition-all cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        )}


            {/* ── Presets panel ── */}
            <PresetsPanel showPresets={showPresets} onApplyPreset={applyPreset} />

            {/* ── Model configuration panel ── */}
            {showInputs && (
              <div className="glass-card p-6 border border-white/[0.04] flex flex-col gap-6 animate-fade-in mb-8">
                {/* Scenario title */}
                <div>
                  <label className="text-xs text-white/55 block mb-1">Name</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* ── Seed round sliders ── */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-400">1</span>
                    First Investment Round
                  </h3>
                  <SliderRow label="Company Value (Pre-Money)" tooltip="What your company is valued at before you accept any new funding." value={formatCurrency(preMoney)}>
                    <input type="range" min={500_000} max={20_000_000} step={100_000} value={preMoney} onChange={e => setPreMoney(+e.target.value)} className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" />
                  </SliderRow>
                  <SliderRow label="Investment Amount" tooltip="The total amount of cash/funding you want to bring in." value={formatCurrency(raise)}>
                    <input type="range" min={100_000} max={5_000_000} step={50_000} value={raise} onChange={e => setRaise(+e.target.value)} className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" />
                  </SliderRow>
                  <SliderRow label="Employee Pool" tooltip="The percentage of company ownership saved for future team members you hire." value={`${optionPool}%`}>
                    <input type="range" min={0} max={30} step={1} value={optionPool} onChange={e => setOptionPool(+e.target.value)} className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" />
                  </SliderRow>
                  <SliderRow label="Founder Split" tooltip="How you divide the founder shares between you and your co-founder." value={`${coFounderSplit}% / ${100 - coFounderSplit}%`}>
                    <input type="range" min={0} max={100} step={5} value={coFounderSplit} onChange={e => setCoFounderSplit(+e.target.value)} className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" />
                  </SliderRow>
                </div>

                {/* ── Series A toggle ── */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-400">2</span>
                      Second Investment Round (Optional)
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={enableSeriesA} onChange={e => setEnableSeriesA(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-white/5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white" />
                    </label>
                  </div>
                  {enableSeriesA && (
                    <div className="space-y-5 animate-fade-in">
                      <SliderRow label="Round 2 Value" tooltip="The value of the startup before the second round of investment." value={formatCurrency(seriesAPreMoney)}>
                        <input type="range" min={5_000_000} max={50_000_000} step={500_000} value={seriesAPreMoney} onChange={e => setSeriesAPreMoney(+e.target.value)} className="w-full accent-emerald-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" />
                      </SliderRow>
                      <SliderRow label="Round 2 Raise" tooltip="The new funding you raise in this second round." value={formatCurrency(seriesARaise)}>
                        <input type="range" min={500_000} max={15_000_000} step={250_000} value={seriesARaise} onChange={e => setSeriesARaise(+e.target.value)} className="w-full accent-emerald-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" />
                      </SliderRow>
                      <SliderRow label="Round 2 Pool" tooltip="Extra share percentage added to hire more team members in the second round." value={`${seriesAOptionPool}%`}>
                        <input type="range" min={0} max={20} step={1} value={seriesAOptionPool} onChange={e => setSeriesAOptionPool(+e.target.value)} className="w-full accent-emerald-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" />
                      </SliderRow>
                    </div>
                  )}
                </div>

                {/* ── Black Swan Stress Test ── */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xs font-semibold text-rose-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </span>
                    3. What-If Scenarios
                  </h3>

                  {/* Vesting timeline slider */}
                  <div className="space-y-2">
                    <SliderRow
                      label="Co-founder Departure"
                      tooltip="Shows how many shares the co-founder keeps if they leave at a certain point. A 1-year minimum (cliff) applies before they get anything."
                      value={vestingMonths === 48 ? '48 Months (No Departure)' : `${vestingMonths} Months`}
                    >
                      <input
                        type="range"
                        min={0}
                        max={48}
                        step={1}
                        value={vestingMonths}
                        onChange={e => setVestingMonths(+e.target.value)}
                        className="w-full accent-rose-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                    </SliderRow>

                    {/* Milestone Indicators */}
                    <div className="flex justify-between text-[9px] text-white/30 px-1 font-mono">
                      <span>Month 0</span>
                      <span>Month 12 (Cliff)</span>
                      <span>Month 24</span>
                      <span>Month 36</span>
                      <span>Month 48</span>
                    </div>

                    {/* Vesting Status Badge */}
                    <div className="mt-2">
                      {vestingMonths === 48 ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Co-founder fully vested (100%).
                        </div>
                      ) : vestingMonths < 12 ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          Before Cliff! 100% split forfeited.
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Month {vestingMonths}: Vested {(vestedFraction * 100).toFixed(0)}%, Forfeited {((1 - vestedFraction) * 100).toFixed(0)}%.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Redistribution selector (only shown if vestingMonths < 48) */}
                  {vestingMonths < 48 && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-[11px] text-white/60 block">
                        Treatment of unearned shares
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setRedistributeUnvested(false)}
                          className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all text-center ${
                            !redistributeUnvested
                              ? 'bg-rose-500/15 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                              : 'bg-white/5 border-white/10 text-white/60 hover:border-rose-500/20'
                          }`}
                        >
                          Save for new hires
                        </button>
                        <button
                          onClick={() => setRedistributeUnvested(true)}
                          className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all text-center ${
                            redistributeUnvested
                              ? 'bg-rose-500/15 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                              : 'bg-white/5 border-white/10 text-white/60 hover:border-rose-500/20'
                          }`}
                        >
                          Cancel (boost others)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Down-round status and protections */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs text-white/60 block font-semibold">Investor Protection</div>
                    
                    {/* Status Indicator */}
                    {enableSeriesA ? (
                      isDownRound ? (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] leading-normal space-y-1">
                          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs">
                            <TrendingDown className="w-4 h-4 text-rose-400 animate-pulse" />
                            Value Dropped
                          </div>
                          <p>
                            Dilution protection triggered due to lower valuation.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] leading-normal">
                          <p>
                            No dilution protection triggered (growing valuation).
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[11px]">
                        Enable Round 2 to check protection rules.
                      </div>
                    )}

                    {/* Anti-dilution type buttons */}
                    {enableSeriesA && isDownRound && (
                      <div className="space-y-3 animate-fade-in">
                        <div className="grid grid-cols-3 gap-2">
                          {(['none', 'weighted-average', 'full-ratchet'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => setAntiDilutionType(type)}
                              className={`py-2 px-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all text-center capitalize ${
                                antiDilutionType === type
                                  ? 'bg-rose-500/15 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                                  : 'bg-white/5 border-white/10 text-white/60 hover:border-rose-500/20'
                              }`}
                            >
                              {type === 'none' ? 'No Protection' : type === 'weighted-average' ? 'Weighted Avg' : 'Full Ratchet'}
                            </button>
                          ))}
                        </div>
                        
                        {/* Protection impact details */}
                        <div className="p-3 bg-black/30 border border-white/[0.04] rounded-lg text-[10px] text-white/50 space-y-1 leading-relaxed">
                          {antiDilutionType === 'none' && (
                            <p>
                              No Protection: Seed Investor diluted pro-rata.
                            </p>
                          )}
                          {antiDilutionType === 'weighted-average' && (
                            <p>
                              Weighted Average: Seed Investor gets moderate compensation.
                            </p>
                          )}
                          {antiDilutionType === 'full-ratchet' && (
                            <p>
                              Full Ratchet: Seed Investor price matched to Round 2.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Exit scenario ── */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-semibold text-emerald-400">4</span>
                    If the Company Gets Sold
                  </h3>
                  <SliderRow label="Sale Price" tooltip="The total amount the company gets sold for. Everyone gets a payout based on their ownership percentage." value={formatCurrency(exitValue)}>
                    <input type="range" min={1_000_000} max={100_000_000} step={1_000_000} value={exitValue} onChange={e => setExitValue(+e.target.value)} className="w-full accent-emerald-500 bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer" />
                  </SliderRow>

                  {/* Preference multiple quick-pick */}
                  <div>
                    <div className="flex justify-between items-center mb-2 text-xs">
                      <span className="text-white/60">Investor Payback</span>
                      <span className="text-white font-semibold font-mono">{prefMultiple}x first</span>
                    </div>
                    <div className="flex gap-2">
                      {[0, 1, 1.5, 2, 3].map(mult => (
                        <button
                          key={mult}
                          onClick={() => setPrefMultiple(mult)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                            prefMultiple === mult
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                              : 'bg-white/5 border-white/10 text-white/60 hover:border-emerald-500/20'
                          }`}
                        >
                          {mult}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preference type toggle */}
                  <div>
                    <label className="text-xs text-white/60 block mb-2">
                      Share remaining profit?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['participating', 'non-participating'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setPrefType(type)}
                          className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all text-center ${
                            prefType === type
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                              : 'bg-white/5 border-white/10 text-white/60 hover:border-emerald-500/20'
                          }`}
                        >
                          {type === 'participating' ? 'Yes – share profits' : 'No – exit only'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Save / Saved scenarios ── */}
                <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Save</h4>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saveLoading}
                      className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5 shadow-none"
                    >
                      {user ? <Save className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {saveLoading ? 'Saving...' : user ? 'Save' : 'Sign In'}
                    </button>
                  </div>

                  {/* Saved list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                      Saved ({savedSims.length})
                    </h4>
                    {!user ? (
                      <div className="p-3 bg-white/[0.01] border border-white/[0.05] rounded-xl text-center">
                        <p className="text-[10px] text-white/40 mb-2">Sign in to save.</p>
                        <button onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)} className="btn-secondary py-1 w-full text-[10px]">
                          Sign In
                        </button>
                      </div>
                    ) : loadingSims ? (
                      <div className="text-[10px] text-white/30 text-center py-2">Loading scenarios...</div>
                    ) : savedSims.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                        {savedSims.map(sim => (
                          <div
                            key={sim.id}
                            onClick={() => loadSim(sim)}
                            className="p-2 bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/20 rounded-lg cursor-pointer transition-all flex justify-between items-center"
                          >
                            <div className="truncate pr-2">
                              <div className="text-[10px] font-semibold text-white truncate">{sim.title}</div>
                              <span className="text-[9px] text-white/40 block font-mono">Raise: {formatCurrency(sim.raiseAmount)}</span>
                            </div>
                            <button onClick={e => handleDelete(sim.id, e)} className="text-white/30 hover:text-red-400 p-1">
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-white/40 py-1 text-center">No saved scenarios found.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Outcome visuals ── */}
            <div className="space-y-12">
              {/* Cap table donut */}
              <CapTableDonut
                capTable={capTable}
                postMoney={computedCapTable.postMoney}
                totalRaise={computedCapTable.totalRaise}
                formatCurrency={formatCurrency}
              />

              {/* Payout waterfall graph */}
              <PayoutGraph
                graphSteps={graphSteps}
                exitPayouts={exitPayouts}
                exitValue={exitValue}
                raise={raise}
                seriesARaise={seriesARaise}
                enableSeriesA={enableSeriesA}
                formatCurrency={formatCurrency}
              />
            </div>
      </div>

      {/* ── Glossary drawer ── */}
      <GlossaryDrawer showGlossary={showGlossary} onClose={() => setShowGlossary(false)} />
    </div>
  );
}

// ─── Internal helper component ────────────────────────────────────────────────

/** A reusable labelled slider row with an inline tooltip. */
function SliderRow({
  label,
  tooltip,
  value,
  children,
}: {
  label: string;
  tooltip: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="text-white/60 flex items-center gap-1.5 group/tooltip relative">
          {label}
          <Info className="w-3.5 h-3.5 text-white/30 cursor-help" />
          <span className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-slate-900 border border-white/10 text-[10px] text-white/70 rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 shadow-xl leading-normal font-normal">
            {tooltip}
          </span>
        </span>
        <span className="text-white font-semibold font-mono">{value}</span>
      </div>
      {children}
    </div>
  );
}
