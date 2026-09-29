export class PolicyViolationError extends Error {
  constructor(
    public readonly policy: string,
    message: string,
  ) {
    super(`[OBIX Policy: ${policy}] ${message}`);
    this.name = 'PolicyViolationError';
  }
}

export interface PolicyViolation {
  policy: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface PolicyResult {
  valid: boolean;
  /** Same as `valid`: the name the published Gen-2 `validateFudCompliance` used (`{ compliant, violations, warnings }`). */
  compliant?: boolean;
  violations: PolicyViolation[];
  /** Advice that is not a violation (none are produced today; kept so the Gen-2 result shape is a subset of this one). */
  warnings?: string[];
}
