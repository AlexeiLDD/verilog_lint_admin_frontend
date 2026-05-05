import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { analyzeVerilog } from '../../shared/api/analyze';
import type { AnalyzeOutput } from '../../shared/api/types';
import { formatDiagnostics, locationLabel } from '../../shared/lib/diagnostics';

const sampleCode = `module fib(
  input clk,
  input reset,
  output reg [7:0] value
);
  always @(posedge clk) begin
    if (reset) begin
      value <= 8'd1;
    end else begin
      value <= value + 8'd1;
    end
  end
endmodule
`;

function formatOutput(result: AnalyzeOutput | undefined, error: Error | null) {
  if (error) {
    return `Request error:\n${error.message}`;
  }

  if (!result) {
    return 'Run lint to see diagnostics and API output here.';
  }

  const sections = [
    `Status: ${result.ok ? 'OK' : 'Diagnostics found'}`,
    '',
    formatDiagnostics(result.diagnostics),
  ];

  if (result.tokens) {
    sections.push('', 'Tokens:', JSON.stringify(result.tokens, null, 2));
  }

  if (result.ast) {
    sections.push('', 'AST:', JSON.stringify(result.ast, null, 2));
  }

  return sections.join('\n');
}

export function LintPage() {
  const [code, setCode] = useState(sampleCode);
  const [showTokens, setShowTokens] = useState(false);
  const [showAst, setShowAst] = useState(false);
  const [astPretty, setAstPretty] = useState<'compact' | 'full'>('compact');

  const lintMutation = useMutation({
    mutationFn: analyzeVerilog,
  });

  const output = useMemo(
    () =>
      formatOutput(
        lintMutation.data,
        lintMutation.error instanceof Error ? lintMutation.error : null,
      ),
    [lintMutation.data, lintMutation.error],
  );

  const handleFileLoad = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setCode(await file.text());
    event.target.value = '';
  };

  const runLint = () => {
    lintMutation.mutate({ code, showTokens, showAst, astPretty });
  };

  return (
    <>
      <section className="options lint-toolbar" aria-label="Lint options">
        <label>
          <input
            checked={showTokens}
            type="checkbox"
            onChange={(event) => setShowTokens(event.target.checked)}
          />
          tokens
        </label>
        <label>
          <input
            checked={showAst}
            type="checkbox"
            onChange={(event) => setShowAst(event.target.checked)}
          />
          AST
        </label>
        <label>
          AST mode
          <select
            value={astPretty}
            onChange={(event) =>
              setAstPretty(event.target.value === 'full' ? 'full' : 'compact')
            }
            disabled={!showAst}
          >
            <option value="compact">compact</option>
            <option value="full">full</option>
          </select>
        </label>
        <div className="toolbar-spacer" />
        <label className="file-button">
          Load .v
          <input accept=".v,.sv,.vh,text/plain" type="file" onChange={handleFileLoad} />
        </label>
        <button
          type="button"
          onClick={runLint}
          disabled={lintMutation.isPending || code.trim().length === 0}
        >
          {lintMutation.isPending ? 'Running...' : 'Run lint'}
        </button>
      </section>

      <section className="workspace">
        <article className="editor-pane">
          <div className="pane-header">
            <h2>Verilog input</h2>
            <span>{code.split('\n').length} lines</span>
          </div>
          <textarea
            value={code}
            spellCheck={false}
            onChange={(event) => setCode(event.target.value)}
            aria-label="Verilog source code"
          />
        </article>

        <article className="editor-pane output-pane">
          <div className="pane-header">
            <h2>Linter output</h2>
            <span>
              {lintMutation.data
                ? `${lintMutation.data.diagnostics?.length ?? 0} diagnostics`
                : 'idle'}
            </span>
          </div>
          {lintMutation.data?.diagnostics?.length ? (
            <div className="diagnostics-list">
              {lintMutation.data.diagnostics.map((diagnostic, index) => (
                <section
                  className={`diagnostic diagnostic-${diagnostic.severity ?? 'error'}`}
                  key={`${diagnostic.code ?? 'diagnostic'}-${index}`}
                >
                  <div className="diagnostic-title">
                    <strong>{diagnostic.code ?? 'UNKNOWN'}</strong>
                    <span>{diagnostic.severity ?? 'error'}</span>
                  </div>
                  <p>{diagnostic.message ?? 'No message returned.'}</p>
                  <small>{locationLabel(diagnostic)}</small>
                </section>
              ))}
            </div>
          ) : null}
          <pre aria-live="polite">{output}</pre>
        </article>
      </section>
    </>
  );
}
