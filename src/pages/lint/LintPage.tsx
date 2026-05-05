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
    return `Ошибка запроса:\n${error.message}`;
  }

  if (!result) {
    return 'Запустите анализ, чтобы увидеть диагностики и ответ API.';
  }

  const sections = [
    `Статус: ${result.ok ? 'OK' : 'найдены диагностики'}`,
    '',
    formatDiagnostics(result.diagnostics),
  ];

  if (result.tokens) {
    sections.push('', 'Токены:', JSON.stringify(result.tokens, null, 2));
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
      <section className="options lint-toolbar" aria-label="Параметры анализа">
        <label>
          <input
            checked={showTokens}
            type="checkbox"
            onChange={(event) => setShowTokens(event.target.checked)}
          />
          токены
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
          Режим AST
          <select
            value={astPretty}
            onChange={(event) =>
              setAstPretty(event.target.value === 'full' ? 'full' : 'compact')
            }
            disabled={!showAst}
          >
            <option value="compact">краткий</option>
            <option value="full">полный</option>
          </select>
        </label>
        <div className="toolbar-spacer" />
        <label className="file-button">
          Загрузить .v
          <input accept=".v,.sv,.vh,text/plain" type="file" onChange={handleFileLoad} />
        </label>
        <button
          type="button"
          onClick={runLint}
          disabled={lintMutation.isPending || code.trim().length === 0}
        >
          {lintMutation.isPending ? 'Анализ...' : 'Запустить анализ'}
        </button>
      </section>

      <section className="workspace">
        <article className="editor-pane">
          <div className="pane-header">
            <h2>Входной Verilog</h2>
            <span>{formatLineCount(code.split('\n').length)}</span>
          </div>
          <textarea
            value={code}
            spellCheck={false}
            onChange={(event) => setCode(event.target.value)}
            aria-label="Исходный код Verilog"
          />
        </article>

        <article className="editor-pane output-pane">
          <div className="pane-header">
            <h2>Результат анализа</h2>
            <span>
              {lintMutation.data
                ? formatDiagnosticCount(lintMutation.data.diagnostics?.length ?? 0)
                : 'ожидание'}
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
                    <strong>{diagnostic.code ?? 'НЕИЗВЕСТНО'}</strong>
                    <span>{formatSeverity(diagnostic.severity)}</span>
                  </div>
                  <p>{diagnostic.message ?? 'Сообщение не получено.'}</p>
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

function formatSeverity(severity: string | undefined) {
  if (severity === 'warning') {
    return 'предупреждение';
  }
  return 'ошибка';
}

function formatDiagnosticCount(count: number) {
  return `${count} ${pluralRu(count, 'диагностика', 'диагностики', 'диагностик')}`;
}

function formatLineCount(count: number) {
  return `${count} ${pluralRu(count, 'строка', 'строки', 'строк')}`;
}

function pluralRu(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}
