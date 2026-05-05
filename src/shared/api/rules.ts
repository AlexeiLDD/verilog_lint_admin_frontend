import { requestJSON } from './client';
import type { RulesConfig, RulesConfigResponse } from './types';

export const emptyRulesConfig: RulesConfig = {
  enabled_rules: [],
  disabled_rules: [],
};

export function fetchRulesConfig(): Promise<RulesConfigResponse> {
  return requestJSON<RulesConfigResponse>('/api/v1/rules/config');
}

export function updateRulesConfig(config: RulesConfig): Promise<RulesConfigResponse> {
  return requestJSON<RulesConfigResponse>('/api/v1/rules/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
}

export function resetRulesConfig(): Promise<RulesConfigResponse> {
  return requestJSON<RulesConfigResponse>('/api/v1/rules/config', {
    method: 'DELETE',
  });
}

export function formatRulesConfig(config: RulesConfig) {
  return JSON.stringify(config, null, 2);
}

export function parseRulesConfig(text: string): RulesConfig {
  const parsed: unknown = JSON.parse(text);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Config must be a JSON object.');
  }

  const candidate = parsed as Partial<RulesConfig>;
  const enabled = candidate.enabled_rules ?? [];
  const disabled = candidate.disabled_rules ?? [];

  if (!Array.isArray(enabled) || !enabled.every((id) => typeof id === 'string')) {
    throw new Error('enabled_rules must be an array of strings.');
  }

  if (!Array.isArray(disabled) || !disabled.every((id) => typeof id === 'string')) {
    throw new Error('disabled_rules must be an array of strings.');
  }

  return {
    enabled_rules: enabled,
    disabled_rules: disabled,
  };
}
