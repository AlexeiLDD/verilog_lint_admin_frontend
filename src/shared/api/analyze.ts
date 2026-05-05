import { normalizeAnalyzeOutput } from '../lib/diagnostics';
import { apiBaseUrl } from './client';
import type { AnalyzeOutput, AnalyzeRequest, ApiAnalyzeOutput } from './types';

export async function analyzeVerilog(request: AnalyzeRequest): Promise<AnalyzeOutput> {
  const form = new FormData();
  const file = new File([request.code], 'input.v', {
    type: 'text/plain',
  });

  form.append('file', file);
  form.append('show_tokens', String(request.showTokens));
  form.append('show_ast', String(request.showAst));
  form.append('ast_pretty', request.astPretty);

  const response = await fetch(`${apiBaseUrl}/api/v1/lint`, {
    method: 'POST',
    body: form,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return normalizeAnalyzeOutput(payload as ApiAnalyzeOutput);
}
