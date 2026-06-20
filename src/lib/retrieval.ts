import { getDb } from "./db";
import type { Asset, ManagerStats, Technician, WorkOrder } from "./types";

const ASSET_ALIASES: Record<string, string[]> = {
  "asset-pl3": ["packing line 3", "pl3", "line 3", "pack line 3", "packing 3"],
  "asset-pl1": ["packing line 1", "pl1", "line 1"],
  "asset-pl2": ["packing line 2", "pl2", "line 2"],
  "asset-cv-a": ["conveyor a", "conv a", "receiving conveyor"],
  "asset-filler-2": ["filler 2", "filler station 2", "fill station"],
  "asset-comp-1": ["compressor", "air compressor", "comp 1"],
  "asset-label-4": ["labeler 4", "labeler unit 4", "lb4"],
  "asset-pallet": ["palletizer", "palletizer west", "plt"],
};

export function getAllAssets(): Asset[] {
  const db = getDb();
  return db.prepare("SELECT * FROM assets ORDER BY name").all() as Asset[];
}

export function getAllTechnicians(): Technician[] {
  const db = getDb();
  return db.prepare("SELECT * FROM technicians ORDER BY retirement_risk DESC").all() as Technician[];
}

export function getAllWorkOrders(): WorkOrder[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM work_orders ORDER BY date DESC")
    .all() as WorkOrder[];
}

export function getWorkOrderById(id: string): WorkOrder | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM work_orders WHERE id = ?").get(id) as WorkOrder | undefined;
}

export function detectAssetFromFault(fault: string): Asset | null {
  const normalized = fault.toLowerCase();
  const assets = getAllAssets();

  for (const [assetId, aliases] of Object.entries(ASSET_ALIASES)) {
    for (const alias of aliases) {
      if (normalized.includes(alias)) {
        return assets.find((a) => a.id === assetId) ?? null;
      }
    }
  }

  for (const asset of assets) {
    if (normalized.includes(asset.name.toLowerCase())) {
      return asset;
    }
  }

  return null;
}

export function searchWorkOrders(query: string, assetId?: string): WorkOrder[] {
  const db = getDb();
  const terms = query
    .toLowerCase()
    .split(/[\s,./]+/)
    .filter((t) => t.length > 2);

  let rows: WorkOrder[];
  if (assetId) {
    rows = db
      .prepare("SELECT * FROM work_orders WHERE asset_id = ? ORDER BY date DESC")
      .all(assetId) as WorkOrder[];
  } else {
    rows = getAllWorkOrders();
  }

  if (terms.length === 0) return rows;

  const scored = rows.map((wo) => {
    const haystack = [
      wo.description,
      wo.technician_notes,
      wo.resolution,
      wo.fault_code ?? "",
      wo.workaround_label ?? "",
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += 1;
      if (term === "prox" && haystack.includes("prox")) score += 2;
      if (term === "dead" && haystack.includes("dead")) score += 2;
      if (term === "relay" && haystack.includes("relay")) score += 1;
      if (term === "plc" && haystack.includes("plc")) score += 1;
      if (term === "bypass" && haystack.includes("bypass")) score += 3;
      if (term === "sensor" && haystack.includes("sensor")) score += 1;
    }
    if (wo.is_workaround) score += 0.5;
    return { wo, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.wo);
}

export function getWorkOrdersForAsset(assetId: string): WorkOrder[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM work_orders WHERE asset_id = ? ORDER BY date DESC")
    .all(assetId) as WorkOrder[];
}

export function getWorkaroundsForAsset(assetId: string): WorkOrder[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM work_orders WHERE asset_id = ? AND is_workaround = 1 ORDER BY date DESC"
    )
    .all(assetId) as WorkOrder[];
}

export function getManagerStats(): ManagerStats {
  const db = getDb();

  const recurring = db
    .prepare(
      `
    SELECT asset_id, asset_name, COUNT(*) as failure_count,
           MAX(date) as last_failure,
           fault_code as top_fault
    FROM work_orders
    WHERE type = 'corrective'
    GROUP BY asset_id
    HAVING failure_count >= 2
    ORDER BY failure_count DESC
    LIMIT 6
  `
    )
    .all() as ManagerStats["recurring_failures"];

  const knowledgeRisks = db
    .prepare(
      `
    SELECT t.id as technician_id, t.name as technician_name,
           COUNT(DISTINCT w.id) as exclusive_fixes,
           t.retirement_risk,
           GROUP_CONCAT(DISTINCT w.asset_name) as critical_assets
    FROM technicians t
    JOIN work_orders w ON w.technician_id = t.id AND w.is_workaround = 1
    GROUP BY t.id
    HAVING exclusive_fixes >= 1
    ORDER BY t.retirement_risk DESC, exclusive_fixes DESC
  `
    )
    .all() as Array<{
      technician_id: string;
      technician_name: string;
      exclusive_fixes: number;
      retirement_risk: number;
      critical_assets: string;
    }>;

  const risksWithSamples = knowledgeRisks.map((r) => {
    const sample = db
      .prepare(
        "SELECT workaround_label, technician_notes FROM work_orders WHERE technician_id = ? AND is_workaround = 1 LIMIT 1"
      )
      .get(r.technician_id) as { workaround_label: string; technician_notes: string } | undefined;

    return {
      ...r,
      critical_assets: r.critical_assets?.split(",") ?? [],
      sample_workaround:
        sample?.workaround_label ??
        sample?.technician_notes.slice(0, 120) ??
        "Undocumented fix",
    };
  });

  const totals = db
    .prepare(
      `
    SELECT
      (SELECT COUNT(*) FROM work_orders) as total_work_orders,
      (SELECT COUNT(*) FROM work_orders WHERE is_workaround = 1) as total_workarounds,
      (SELECT COUNT(*) FROM assets WHERE status = 'down') as assets_down
  `
    )
    .get() as {
    total_work_orders: number;
    total_workarounds: number;
    assets_down: number;
  };

  return {
    recurring_failures: recurring,
    knowledge_risks: risksWithSamples,
    ...totals,
  };
}

export function buildReasoningTrace(
  fault: string,
  asset: Asset | null,
  matches: WorkOrder[],
  workarounds: WorkOrder[]
): string[] {
  const trace: string[] = [];
  trace.push(`Parsing fault report: "${fault.slice(0, 80)}${fault.length > 80 ? "..." : ""}"`);

  if (asset) {
    trace.push(`Asset match: ${asset.name} (${asset.id})`);
    trace.push(`Searching ${matches.length} historical work orders for ${asset.name}...`);
  } else {
    trace.push("No exact asset match - searching full plant history...");
  }

  const faultCodes = Array.from(
    new Set(matches.map((m) => m.fault_code).filter((c): c is string => Boolean(c)))
  );
  if (faultCodes.length > 0) {
    trace.push(`Pattern match: recurring fault codes ${faultCodes.join(", ")}`);
  }

  const proxIssues = matches.filter(
    (m) =>
      m.description.toLowerCase().includes("prox") ||
      m.technician_notes.toLowerCase().includes("prox")
  );
  if (proxIssues.length > 0) {
    trace.push(
      `Found ${proxIssues.length} prior prox/interlock incidents - checking if standard swap failed before`
    );
  }

  const failedSwap = matches.find((m) =>
    m.technician_notes.toLowerCase().includes("didn't fix") ||
    m.technician_notes.toLowerCase().includes("did not fix") ||
    m.resolution.toLowerCase().includes("still")
  );
  if (failedSwap) {
    trace.push(
      `Ruling out: standard prox replacement alone (${failedSwap.wo_number} required additional steps)`
    );
  }

  if (workarounds.length > 0) {
    trace.push(
      `Workaround found: "${workarounds[0].workaround_label}" in ${workarounds[0].wo_number} by ${workarounds[0].technician_name}`
    );
    const tech = getAllTechnicians().find((t) => t.id === workarounds[0].technician_id);
    if (tech && tech.retirement_risk >= 80) {
      trace.push(
        `Knowledge risk: workaround held by ${tech.name} (retirement risk ${tech.retirement_risk}%)`
      );
    }
  }

  trace.push(`Assembling ranked plan with ${Math.min(matches.length, 4)} cited steps`);
  return trace;
}
