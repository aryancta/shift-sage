export interface WorkOrder {
  id: string;
  wo_number: string;
  asset_id: string;
  asset_name: string;
  technician_id: string;
  technician_name: string;
  date: string;
  type: "corrective" | "preventive" | "inspection";
  status: "open" | "closed";
  fault_code: string | null;
  description: string;
  technician_notes: string;
  resolution: string;
  downtime_minutes: number;
  is_workaround: number;
  workaround_label: string | null;
}

export interface Asset {
  id: string;
  name: string;
  line: string;
  status: "running" | "down" | "degraded";
}

export interface Technician {
  id: string;
  name: string;
  shift: string;
  years_experience: number;
  retirement_risk: number;
  specialty: string;
}

export interface DiagnosisStep {
  rank: number;
  action: string;
  rationale: string;
  confidence: "high" | "medium" | "low";
  work_order_id: string;
  wo_number: string;
  is_workaround: boolean;
  workaround_label?: string;
}

export interface DiagnosisResult {
  asset_id: string;
  asset_name: string;
  steps: DiagnosisStep[];
  workarounds: DiagnosisStep[];
  reasoning_trace: string[];
  cleaned_fault: string;
  history_thin: boolean;
  mode: "live" | "cached" | "mock";
}

export interface WorkOrderDraft {
  wo_number: string;
  asset_name: string;
  fault_summary: string;
  cleaned_description: string;
  priority: string;
  recommended_actions: string[];
  estimated_downtime: string;
  parts_needed: string[];
}

export interface HandoverDraft {
  shift_summary: string;
  open_issues: string[];
  completed_today: string[];
  watch_items: string[];
  next_shift_priority: string;
}

export interface ManagerStats {
  recurring_failures: Array<{
    asset_id: string;
    asset_name: string;
    failure_count: number;
    last_failure: string;
    top_fault: string;
  }>;
  knowledge_risks: Array<{
    technician_id: string;
    technician_name: string;
    exclusive_fixes: number;
    retirement_risk: number;
    critical_assets: string[];
    sample_workaround: string;
  }>;
  total_work_orders: number;
  total_workarounds: number;
  assets_down: number;
}

export interface ReasoningEvent {
  type: "search" | "match" | "rule_out" | "workaround" | "plan" | "done";
  message: string;
  timestamp: number;
}
