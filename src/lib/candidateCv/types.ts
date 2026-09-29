export type EvidenceGrade =
  | "SOURCED"
  | "SOURCED-claim"
  | "SOURCED-cited"
  | "DEMO"
  | "MIXED";

export type CandidateCvMeta = {
  demoLabel: "DEMO/FAKE" | "LIVE" | string;
  banner: string;
  asOf: string;
  constituency: string;
  purpose: string;
};

export type CandidateChannels = {
  x?: string;
  youtube?: string;
  facebook?: string;
  evidenceGrade?: EvidenceGrade;
};

export type CandidateCvCandidate = {
  id: string;
  demoLabel: "DEMO/FAKE" | "LIVE" | string;
  name: string;
  aliases: string[];
  party: string;
  seat: string;
  status: string;
  oneLiner: string;
  tags: string[];
  channels: CandidateChannels;
  avatarUrl?: string;
};

export type CandidateCvServiceTimelineNode = {
  year: number;
  title: string;
  detail: string;
  evidenceGrade: EvidenceGrade;
};

export type CandidateCvCandidateScore = {
  name: string;
  party: string;
  votes: number;
};

export type CandidateCvElectionScoreline = {
  evidenceGrade: EvidenceGrade;
  winner: CandidateCvCandidateScore;
  runnerUp: CandidateCvCandidateScore;
  third: CandidateCvCandidateScore;
  margin: number;
};

export type CandidateCvWork = {
  id: string;
  demoLabel: "DEMO/FAKE" | "LIVE" | string;
  title: string;
  years: number[];
  status: string;
  summary: string;
  evidenceGrade: EvidenceGrade;
};

export type CandidateCvAgendaPillar = {
  id: string;
  title: string;
  detail: string;
};

export type CandidateCvAgenda = {
  demoLabel: "DEMO/FAKE" | "LIVE" | string;
  pillars: CandidateCvAgendaPillar[];
};

export type CandidateCvPlanPhase = {
  id: string;
  window: string;
  goal: string;
  detail?: string;
};

export type CandidateCvPlan = {
  demoLabel: "DEMO/FAKE" | "LIVE" | string;
  phases: CandidateCvPlanPhase[];
};

export type CandidateCvLocalBase = {
  evidenceGrade: EvidenceGrade;
  blocks: string[];
  ecology: string;
  note: string;
};

export type CandidateCvSource = {
  label: string;
  url: string;
  evidenceGrade: EvidenceGrade;
};

export type CandidateCvDoc = {
  meta: CandidateCvMeta;
  candidate: CandidateCvCandidate;
  serviceTimeline: CandidateCvServiceTimelineNode[];
  electionScoreline2025: CandidateCvElectionScoreline;
  worksPortfolio: CandidateCvWork[];
  agenda: CandidateCvAgenda;
  plan: CandidateCvPlan;
  localBase: CandidateCvLocalBase;
  sources: CandidateCvSource[];
  updated_by?: string;
  updated_at?: string;
};

export type CandidateCvPatch = Partial<{
  candidate: Partial<CandidateCvCandidate>;
  serviceTimeline: CandidateCvServiceTimelineNode[];
  worksPortfolio: CandidateCvWork[];
  agenda: Partial<CandidateCvAgenda>;
  plan: Partial<CandidateCvPlan>;
  localBase: Partial<CandidateCvLocalBase>;
  electionScoreline2025: Partial<CandidateCvElectionScoreline>;
  sources: CandidateCvSource[];
}>;
