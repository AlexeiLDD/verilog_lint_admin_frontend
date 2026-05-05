export type Position = {
  line: number;
  column: number;
  offset: number;
};

export type ApiPosition = Partial<Position> & {
  Line?: number;
  Column?: number;
  Offset?: number;
};

export type Diagnostic = {
  code?: string;
  message?: string;
  severity?: 'error' | 'warning';
  range?: {
    start?: Position;
    end?: Position;
  };
};

export type ApiDiagnostic = Diagnostic & {
  Code?: string;
  Message?: string;
  Severity?: 'error' | 'warning';
  Range?: {
    Start?: ApiPosition;
    End?: ApiPosition;
  };
};

export type ApiRange = NonNullable<Diagnostic['range']> | NonNullable<ApiDiagnostic['Range']>;

export type TokenView = {
  index: number;
  type: string;
  lexeme: string;
  range: {
    start: Position;
    end: Position;
  };
};

export type AnalyzeOutput = {
  diagnostics?: Diagnostic[];
  tokens?: TokenView[];
  ast?: unknown;
  ok: boolean;
};

export type ApiAnalyzeOutput = Omit<AnalyzeOutput, 'diagnostics'> & {
  diagnostics?: ApiDiagnostic[];
};

export type AnalyzeRequest = {
  code: string;
  showTokens: boolean;
  showAst: boolean;
  astPretty: 'compact' | 'full';
};

export type RuleView = {
  id: string;
  description: string;
};

export type ExternalRuleBundle = {
  id: string;
  path: string;
};

export type RulesConfig = {
  enabled_rules: string[];
  disabled_rules: string[];
  external_rule_bundles?: ExternalRuleBundle[];
};

export type RulesConfigResponse = {
  config: RulesConfig;
  active_rules: RuleView[];
  available_rules: RuleView[];
};

export type RulesResponse = {
  rules: RuleView[];
};
