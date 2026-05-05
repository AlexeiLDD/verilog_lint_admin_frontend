import { requestJSON } from './client';
import type { RulesConfig, RulesConfigResponse, RulesResponse } from './types';

export const emptyRulesConfig: RulesConfig = {
  enabled_rules: [],
  disabled_rules: [],
  external_rule_bundles: [],
};

export function fetchRulesConfig(): Promise<RulesConfigResponse> {
  return requestJSON<RulesConfigResponse>('/api/v1/rules/config');
}

export function fetchBuiltinRules(): Promise<RulesResponse> {
  return requestJSON<RulesResponse>('/api/v1/rules');
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
  return JSON.stringify(normalizeRulesConfig(config), null, 2);
}

export function parseRulesConfig(text: string): RulesConfig {
  const parsed: unknown = JSON.parse(text);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Конфиг должен быть JSON-объектом.');
  }

  const candidate = parsed as Partial<RulesConfig>;
  const enabled = candidate.enabled_rules ?? [];
  const disabled = candidate.disabled_rules ?? [];
  const externalBundles = candidate.external_rule_bundles ?? [];

  if (!Array.isArray(enabled) || !enabled.every((id) => typeof id === 'string')) {
    throw new Error('enabled_rules должен быть массивом строк.');
  }

  if (!Array.isArray(disabled) || !disabled.every((id) => typeof id === 'string')) {
    throw new Error('disabled_rules должен быть массивом строк.');
  }

  if (
    !Array.isArray(externalBundles) ||
    !externalBundles.every(
      (bundle) =>
        bundle &&
        typeof bundle === 'object' &&
        !Array.isArray(bundle) &&
        typeof bundle.id === 'string' &&
        typeof bundle.path === 'string',
    )
  ) {
    throw new Error('external_rule_bundles должен быть массивом объектов со строковыми id и path.');
  }

  return {
    enabled_rules: enabled,
    disabled_rules: disabled,
    external_rule_bundles: externalBundles,
  };
}

export function normalizeRulesConfig(config: RulesConfig): RulesConfig {
  return {
    enabled_rules: config.enabled_rules ?? [],
    disabled_rules: config.disabled_rules ?? [],
    external_rule_bundles: config.external_rule_bundles ?? [],
  };
}
