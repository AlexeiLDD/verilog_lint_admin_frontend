import type {
  AnalyzeOutput,
  ApiAnalyzeOutput,
  ApiDiagnostic,
  ApiPosition,
  ApiRange,
  Diagnostic,
  Position,
} from '../api/types';

export function normalizePosition(position: ApiPosition | undefined) {
  if (!position) {
    return undefined;
  }

  return {
    line: position.line ?? position.Line ?? 0,
    column: position.column ?? position.Column ?? 0,
    offset: position.offset ?? position.Offset ?? 0,
  };
}

export function normalizeDiagnostic(diagnostic: ApiDiagnostic): Diagnostic {
  const range = diagnostic.range ?? diagnostic.Range;
  const normalizedRange = normalizeRange(range);

  return {
    code: diagnostic.code ?? diagnostic.Code,
    message: diagnostic.message ?? diagnostic.Message,
    severity: diagnostic.severity ?? diagnostic.Severity,
    range: normalizedRange,
  };
}

export function normalizeRange(range: ApiRange | undefined) {
  if (!range) {
    return undefined;
  }

  if ('Start' in range || 'End' in range) {
    const pascalRange = range as NonNullable<ApiDiagnostic['Range']>;

    return {
      start: normalizePosition(pascalRange.Start),
      end: normalizePosition(pascalRange.End),
    };
  }

  const camelRange = range as NonNullable<Diagnostic['range']>;

  return {
    start: normalizePosition(camelRange.start),
    end: normalizePosition(camelRange.end),
  };
}

export function normalizeAnalyzeOutput(output: ApiAnalyzeOutput): AnalyzeOutput {
  return {
    ...output,
    diagnostics: output.diagnostics?.map(normalizeDiagnostic) ?? [],
  };
}

export function formatPosition(position: Position | undefined) {
  if (!position) {
    return '?';
  }

  return `${position.line}:${position.column}`;
}

export function formatDiagnostics(diagnostics: Diagnostic[] | undefined) {
  if (!diagnostics) {
    return 'Диагностики: сервер не вернул список диагностик.';
  }

  if (diagnostics.length === 0) {
    return 'Диагностики: проблем не найдено.';
  }

  return diagnostics
    .map((diagnostic) => {
      const start = formatPosition(diagnostic.range?.start);
      const end = formatPosition(diagnostic.range?.end);
      const severity = diagnostic.severity === 'warning' ? 'ПРЕДУПРЕЖДЕНИЕ' : 'ОШИБКА';
      const code = diagnostic.code ?? 'НЕИЗВЕСТНО';
      const message = diagnostic.message ?? 'Сообщение не получено.';

      return [
        `${severity} ${code}`,
        `${start}-${end}`,
        message,
      ].join(' | ');
    })
    .join('\n');
}

export function locationLabel(diagnostic: Diagnostic) {
  const start = diagnostic.range?.start;
  const end = diagnostic.range?.end;

  if (!start || !end || start.line === 0 || start.column === 0) {
    return 'позиция неизвестна';
  }

  if (start.line === end.line) {
    return `строка ${start.line}, столбцы ${start.column}-${end.column}`;
  }

  return `строки ${start.line}:${start.column} - ${end.line}:${end.column}`;
}
