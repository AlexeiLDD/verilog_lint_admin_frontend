import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  emptyRulesConfig,
  fetchBuiltinRules,
  fetchRulesConfig,
  formatRulesConfig,
  normalizeRulesConfig,
  parseRulesConfig,
  resetRulesConfig,
  updateRulesConfig,
} from '../../shared/api/rules';
import type { ExternalRuleBundle, RuleView, RulesConfig } from '../../shared/api/types';

export function RulesPage() {
  const queryClient = useQueryClient();
  const [rulesConfigDraft, setRulesConfigDraft] = useState<string | null>(null);
  const [rulesConfigError, setRulesConfigError] = useState<string | null>(null);
  const [bundleID, setBundleID] = useState('');
  const [bundlePath, setBundlePath] = useState('');

  const rulesConfigQuery = useQuery({
    queryKey: ['rules-config'],
    queryFn: fetchRulesConfig,
  });
  const builtinRulesQuery = useQuery({
    queryKey: ['builtin-rules'],
    queryFn: fetchBuiltinRules,
  });

  const updateConfigMutation = useMutation({
    mutationFn: updateRulesConfig,
    onSuccess: (data) => {
      queryClient.setQueryData(['rules-config'], data);
      setRulesConfigDraft(null);
      setRulesConfigError(null);
    },
    onError: (error) => {
      setRulesConfigError(error instanceof Error ? error.message : 'Failed to update config.');
    },
  });

  const resetConfigMutation = useMutation({
    mutationFn: resetRulesConfig,
    onSuccess: (data) => {
      queryClient.setQueryData(['rules-config'], data);
      setRulesConfigDraft(null);
      setRulesConfigError(null);
    },
    onError: (error) => {
      setRulesConfigError(error instanceof Error ? error.message : 'Failed to reset config.');
    },
  });

  const handleConfigFileLoad = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setRulesConfigDraft(await file.text());
    setRulesConfigError(null);
    event.target.value = '';
  };

  const activeRules = rulesConfigQuery.data?.active_rules ?? [];
  const availableRules = rulesConfigQuery.data?.available_rules ?? [];
  const builtinRuleIDs = new Set((builtinRulesQuery.data?.rules ?? []).map((rule) => rule.id));
  const rulesConfigText =
    rulesConfigDraft ??
    formatRulesConfig(rulesConfigQuery.data?.config ?? emptyRulesConfig);
  const parsedDraft = parseDraftConfig(rulesConfigText);
  const externalBundles = parsedDraft.config?.external_rule_bundles ?? [];
  const configStatus = rulesConfigQuery.isPending
    ? 'loading'
    : rulesConfigQuery.isError
      ? 'error'
      : `${activeRules.length}/${availableRules.length} active`;
  const configError =
    rulesConfigError ??
    (rulesConfigQuery.error instanceof Error ? rulesConfigQuery.error.message : null);
  const isConfigActionPending = updateConfigMutation.isPending || resetConfigMutation.isPending;

  const applyRulesConfig = () => {
    try {
      const config = parseRulesConfig(rulesConfigText);
      setRulesConfigError(null);
      updateConfigMutation.mutate(config);
    } catch (error) {
      setRulesConfigError(error instanceof Error ? error.message : 'Invalid JSON config.');
    }
  };

  const updateDraftConfig = (updater: (config: RulesConfig) => RulesConfig) => {
    const baseConfig = parsedDraft.config ?? normalizeRulesConfig(rulesConfigQuery.data?.config ?? emptyRulesConfig);
    const nextConfig = updater(baseConfig);
    setRulesConfigDraft(formatRulesConfig(nextConfig));
    setRulesConfigError(null);
  };

  const addExternalBundle = () => {
    const id = bundleID.trim();
    const path = bundlePath.trim();
    if (!id || !path) {
      setRulesConfigError('External bundle id and path are required.');
      return;
    }
    if (externalBundles.some((bundle) => bundle.id === id)) {
      setRulesConfigError(`External bundle id "${id}" is already used.`);
      return;
    }

    updateDraftConfig((config) => ({
      ...config,
      external_rule_bundles: [...(config.external_rule_bundles ?? []), { id, path }],
    }));
    setBundleID('');
    setBundlePath('');
  };

  const removeExternalBundle = (id: string) => {
    updateDraftConfig((config) => ({
      ...config,
      external_rule_bundles: (config.external_rule_bundles ?? []).filter((bundle) => bundle.id !== id),
    }));
  };

  return (
    <section className="rules-page" aria-label="Rules config">
      <div className="rules-page-toolbar">
        <div>
          <h2>Rules config</h2>
          <span>{configStatus}</span>
        </div>
        <div className="rules-actions">
          <label className="file-button">
            Load JSON
            <input accept=".json,application/json" type="file" onChange={handleConfigFileLoad} />
          </label>
          <button
            type="button"
            onClick={applyRulesConfig}
            disabled={isConfigActionPending || rulesConfigText.trim().length === 0}
          >
            {updateConfigMutation.isPending ? 'Applying...' : 'Apply'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => resetConfigMutation.mutate()}
            disabled={isConfigActionPending}
          >
            {resetConfigMutation.isPending ? 'Resetting...' : 'Reset'}
          </button>
        </div>
      </div>

      <div className="rules-layout">
        <article className="rules-editor">
          <textarea
            className="rules-config-textarea"
            value={rulesConfigText}
            spellCheck={false}
            onChange={(event) => {
              setRulesConfigDraft(event.target.value);
              setRulesConfigError(null);
            }}
            aria-label="Rules config JSON"
          />
          {configError ? (
            <div className="config-error" role="alert">
              {configError}
            </div>
          ) : null}
          <ExternalBundlesPanel
            bundles={externalBundles}
            bundleID={bundleID}
            bundlePath={bundlePath}
            onBundleIDChange={setBundleID}
            onBundlePathChange={setBundlePath}
            onAdd={addExternalBundle}
            onRemove={removeExternalBundle}
          />
        </article>

        <RuleList title="Active rules" rules={activeRules} builtinRuleIDs={builtinRuleIDs} active />
        <RuleList title="Available rules" rules={availableRules} builtinRuleIDs={builtinRuleIDs} />
      </div>
    </section>
  );
}

function parseDraftConfig(text: string): { config: RulesConfig | null } {
  try {
    return { config: parseRulesConfig(text) };
  } catch {
    return { config: null };
  }
}

function ExternalBundlesPanel({
  bundles,
  bundleID,
  bundlePath,
  onBundleIDChange,
  onBundlePathChange,
  onAdd,
  onRemove,
}: {
  bundles: ExternalRuleBundle[];
  bundleID: string;
  bundlePath: string;
  onBundleIDChange: (value: string) => void;
  onBundlePathChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="external-bundles" aria-label="External rule bundles">
      <div className="external-bundles-header">
        <h2>External bundles</h2>
        <span>{bundles.length}</span>
      </div>
      <div className="bundle-form">
        <label>
          <span>ID</span>
          <input
            type="text"
            value={bundleID}
            onChange={(event) => onBundleIDChange(event.target.value)}
            placeholder="example"
          />
        </label>
        <label>
          <span>Executable path</span>
          <input
            type="text"
            value={bundlePath}
            onChange={(event) => onBundlePathChange(event.target.value)}
            placeholder="C:\\tools\\custom-rule-bundle.exe"
          />
        </label>
        <button type="button" onClick={onAdd}>
          Add bundle
        </button>
      </div>
      <div className="bundle-items">
        {bundles.length ? (
          bundles.map((bundle) => (
            <div className="bundle-item" key={bundle.id}>
              <div>
                <strong>{bundle.id}</strong>
                <span>{bundle.path}</span>
              </div>
              <button className="secondary-button" type="button" onClick={() => onRemove(bundle.id)}>
                Remove
              </button>
            </div>
          ))
        ) : (
          <p className="empty-state">No external bundles configured.</p>
        )}
      </div>
    </div>
  );
}

function RuleList({
  title,
  rules,
  builtinRuleIDs,
  active = false,
}: {
  title: string;
  rules: RuleView[];
  builtinRuleIDs: Set<string>;
  active?: boolean;
}) {
  return (
    <article className="rules-list" aria-label={title}>
      <div className="rules-list-header">
        <h2>{title}</h2>
        <span>{rules.length}</span>
      </div>
      <div className="rule-items">
        {rules.length ? (
          rules.map((rule) => {
            const source = builtinRuleIDs.has(rule.id) ? 'builtin' : 'custom';
            return (
              <div className={`rule-item${active ? ' rule-item-active' : ''}`} key={rule.id}>
                <div className="rule-id-cell">
                  <strong>{rule.id}</strong>
                  <RuleSourceChip source={source} />
                </div>
                <span>{rule.description}</span>
              </div>
            );
          })
        ) : (
          <p className="empty-state">No rules returned.</p>
        )}
      </div>
    </article>
  );
}

function RuleSourceChip({ source }: { source: 'builtin' | 'custom' }) {
  return <span className={`rule-source-chip rule-source-${source}`}>{source}</span>;
}
