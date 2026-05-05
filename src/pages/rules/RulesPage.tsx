import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  emptyRulesConfig,
  fetchRulesConfig,
  formatRulesConfig,
  parseRulesConfig,
  resetRulesConfig,
  updateRulesConfig,
} from '../../shared/api/rules';
import type { RuleView } from '../../shared/api/types';

export function RulesPage() {
  const queryClient = useQueryClient();
  const [rulesConfigDraft, setRulesConfigDraft] = useState<string | null>(null);
  const [rulesConfigError, setRulesConfigError] = useState<string | null>(null);

  const rulesConfigQuery = useQuery({
    queryKey: ['rules-config'],
    queryFn: fetchRulesConfig,
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
  const rulesConfigText =
    rulesConfigDraft ??
    formatRulesConfig(rulesConfigQuery.data?.config ?? emptyRulesConfig);
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
        </article>

        <RuleList title="Active rules" rules={activeRules} active />
        <RuleList title="Available rules" rules={availableRules} />
      </div>
    </section>
  );
}

function RuleList({ title, rules, active = false }: { title: string; rules: RuleView[]; active?: boolean }) {
  return (
    <article className="rules-list" aria-label={title}>
      <div className="rules-list-header">
        <h2>{title}</h2>
        <span>{rules.length}</span>
      </div>
      <div className="rule-items">
        {rules.length ? (
          rules.map((rule) => (
            <div className={`rule-item${active ? ' rule-item-active' : ''}`} key={rule.id}>
              <strong>{rule.id}</strong>
              <span>{rule.description}</span>
            </div>
          ))
        ) : (
          <p className="empty-state">No rules returned.</p>
        )}
      </div>
    </article>
  );
}
