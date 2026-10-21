/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ComplaintRecord, SeverityLevel } from './types/triage';
import { INITIAL_COMPLAINTS } from './data/sampleComplaints';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { ComplaintQueue } from './components/ComplaintQueue';
import { TriageDossierCanvas } from './components/TriageDossierCanvas';
import { NewComplaintModal } from './components/NewComplaintModal';
import { HumanOverrideModal } from './components/HumanOverrideModal';
import { AnalyticsView } from './components/AnalyticsView';
import { PrintDossier } from './components/PrintDossier';

const STORAGE_KEY = 'healthcare_complaint_triage_records_v1';

export default function App() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse complaints from storage, using initial set', e);
    }
    return INITIAL_COMPLAINTS;
  });

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return INITIAL_COMPLAINTS[0]?.id || null;
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSeverityFilter, setActiveSeverityFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [humanOnlyFilter, setHumanOnlyFilter] = useState(false);

  // View & Modal states
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    } catch (e) {
      console.error('Could not save to localStorage:', e);
    }
  }, [complaints]);

  // Filtered complaints computation
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = c.rawText.toLowerCase().includes(q);
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesPatient = c.patientName?.toLowerCase().includes(q);
        const matchesMRN = c.patientMRN?.toLowerCase().includes(q);
        const matchesDept = c.department.toLowerCase().includes(q);
        const matchesSummary = c.triageResult?.whatHappened.summary.toLowerCase().includes(q);
        if (!matchesText && !matchesId && !matchesPatient && !matchesMRN && !matchesDept && !matchesSummary) {
          return false;
        }
      }

      // Severity filter
      if (activeSeverityFilter) {
        if (c.triageResult?.step2Severity.level !== activeSeverityFilter) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter) {
        const isPrimary = c.triageResult?.step1Category.primaryCategory === categoryFilter;
        const isSecondary = c.triageResult?.step1Category.secondaryCategories?.includes(categoryFilter as any);
        if (!isPrimary && !isSecondary) {
          return false;
        }
      }

      // Risk filter
      if (riskFilter) {
        const hasRisk = c.triageResult?.step5RiskDetection.some(
          (r) => r.riskType === riskFilter && r.flagged
        );
        if (!hasRisk) {
          return false;
        }
      }

      // Status filter
      if (statusFilter) {
        if (c.status !== statusFilter) {
          return false;
        }
      }

      // Human review required only
      if (humanOnlyFilter) {
        if (!c.triageResult?.step4HumanIntervention.required) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, searchQuery, activeSeverityFilter, categoryFilter, riskFilter, statusFilter, humanOnlyFilter]);

  // Ensure selectedId is valid
  useEffect(() => {
    if (filteredComplaints.length > 0) {
      if (!selectedId || !filteredComplaints.some((c) => c.id === selectedId)) {
        setSelectedId(filteredComplaints[0].id);
      }
    }
  }, [filteredComplaints, selectedId]);

  const selectedComplaint = useMemo(() => {
    return complaints.find((c) => c.id === selectedId) || null;
  }, [complaints, selectedId]);

  const criticalCount = useMemo(() => {
    return complaints.filter((c) => c.triageResult?.step2Severity.level === 'LEVEL 4 – Critical').length;
  }, [complaints]);

  // Actions
  const handleComplaintCreated = (newRecord: ComplaintRecord) => {
    setComplaints((prev) => [newRecord, ...prev]);
    setSelectedId(newRecord.id);
    setShowAnalytics(false);
  };

  const handleSaveOverride = (overrideData: {
    reviewedBy: string;
    overrideSeverity?: SeverityLevel;
    overrideRoute?: any;
    overrideCategory?: any;
    notes: string;
  }) => {
    if (!selectedId) return;

    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id !== selectedId || !item.triageResult) return item;

        const updatedResult = { ...item.triageResult };

        if (overrideData.overrideSeverity) {
          updatedResult.step2Severity = {
            ...updatedResult.step2Severity,
            level: overrideData.overrideSeverity,
            reasoning: `[HUMAN CLINICAL OVERRIDE]: ${overrideData.notes}. (Original: ${item.triageResult.step2Severity.reasoning})`,
          };
          if (overrideData.overrideSeverity === 'LEVEL 4 – Critical') {
            updatedResult.step3Urgency.responseSLA = 'Immediate (< 2 Hours)';
            updatedResult.step3Urgency.urgencyWindowHours = 2;
          } else if (overrideData.overrideSeverity === 'LEVEL 3 – High') {
            updatedResult.step3Urgency.responseSLA = 'Urgent (< 24 Hours)';
            updatedResult.step3Urgency.urgencyWindowHours = 24;
          }
        }

        if (overrideData.overrideRoute) {
          updatedResult.step6Escalation = {
            ...updatedResult.step6Escalation,
            primaryRoute: overrideData.overrideRoute,
          };
        }

        if (overrideData.overrideCategory) {
          updatedResult.step1Category = {
            ...updatedResult.step1Category,
            primaryCategory: overrideData.overrideCategory,
          };
        }

        updatedResult.humanReview = {
          reviewedBy: overrideData.reviewedBy,
          reviewedAt: new Date().toISOString(),
          overrideSeverity: overrideData.overrideSeverity,
          overrideRoute: overrideData.overrideRoute,
          overrideCategory: overrideData.overrideCategory,
          notes: overrideData.notes,
        };

        return {
          ...item,
          status: 'Human Validated & Routed',
          triageResult: updatedResult,
        };
      })
    );
  };

  const handleStatusChange = (status: ComplaintRecord['status']) => {
    if (!selectedId) return;
    setComplaints((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, status } : c))
    );
  };

  const handleResetData = () => {
    if (window.confirm('Reset all triage records back to the 7 clinical demonstration cases?')) {
      setComplaints(INITIAL_COMPLAINTS);
      setSelectedId(INITIAL_COMPLAINTS[0].id);
      setActiveSeverityFilter(null);
      setHumanOnlyFilter(false);
      setCategoryFilter('');
      setRiskFilter('');
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        onNewComplaint={() => setIsNewModalOpen(true)}
        showAnalytics={showAnalytics}
        onToggleAnalytics={() => setShowAnalytics(!showAnalytics)}
        onResetData={handleResetData}
        totalComplaints={complaints.length}
        criticalCount={criticalCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Step 7 Canvas Summary Metrics */}
        <MetricsOverview
          complaints={complaints}
          activeSeverityFilter={activeSeverityFilter}
          onSelectSeverityFilter={(sev) => {
            setActiveSeverityFilter(sev);
            setShowAnalytics(false);
          }}
          humanOnlyFilter={humanOnlyFilter}
          onToggleHumanFilter={() => {
            setHumanOnlyFilter(!humanOnlyFilter);
            setShowAnalytics(false);
          }}
        />

        {showAnalytics ? (
          <AnalyticsView
            complaints={complaints}
            onBackToQueue={() => setShowAnalytics(false)}
          />
        ) : (
          /* Split Canvas Interface */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Queue (4 cols on lg) */}
            <div className="lg:col-span-4 xl:col-span-4">
              <ComplaintQueue
                complaints={filteredComplaints}
                selectedId={selectedId}
                onSelectComplaint={(id) => setSelectedId(id)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                riskFilter={riskFilter}
                onRiskFilterChange={setRiskFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
            </div>

            {/* Right Dossier Canvas (8 cols on lg) */}
            <div className="lg:col-span-8 xl:col-span-8">
              {selectedComplaint ? (
                <TriageDossierCanvas
                  complaint={selectedComplaint}
                  onOpenOverride={() => setIsOverrideModalOpen(true)}
                  onPrintDossier={() => setIsPrintModalOpen(true)}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400">
                  <p className="text-sm font-medium text-slate-600">No complaint selected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a complaint from the triage queue or click &quot;Intake &amp; Triage&quot; to submit a new report.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* New Complaint Intake Modal */}
      <NewComplaintModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onComplaintCreated={handleComplaintCreated}
      />

      {/* Human Clinical Override Modal */}
      {selectedComplaint && (
        <HumanOverrideModal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          complaint={selectedComplaint}
          onSaveOverride={handleSaveOverride}
        />
      )}

      {/* Formal Clinical Print / Export Dossier Modal */}
      {selectedComplaint && isPrintModalOpen && (
        <PrintDossier
          complaint={selectedComplaint}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
}
