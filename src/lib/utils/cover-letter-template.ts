const TEMPLATE_VARIABLE_REGEX = /\{\{\s*([^{}\r\n]+?)\s*\}\}/g;

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeTemplateVariable(value: string): string {
  return value.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '').trim();
}

export function isValidTemplateVariable(value: string): boolean {
  const normalized = normalizeTemplateVariable(value);
  return normalized.length > 0 && normalized.length <= 120 && !/[{}\r\n]/.test(normalized);
}

export function parseTemplateVariableInput(value: string): string[] {
  if (!value.trim()) {
    return [];
  }

  const uniqueVariables = new Set<string>();
  for (const entry of value.split(/[,\n]/)) {
    const normalized = normalizeTemplateVariable(entry);
    if (normalized) {
      uniqueVariables.add(normalized);
    }
  }

  return Array.from(uniqueVariables);
}

export function templateContainsVariable(text: string, variable: string): boolean {
  const normalized = normalizeTemplateVariable(variable);
  if (!normalized || !text) {
    return false;
  }

  const matcher = new RegExp(`\\{\\{\\s*${escapeForRegex(normalized)}\\s*\\}\\}`);
  return matcher.test(text);
}

export function validateTemplateVariables(text: string, variables: string[]) {
  const valid: string[] = [];
  const invalid: string[] = [];
  const missingInText: string[] = [];

  for (const variable of variables) {
    const normalized = normalizeTemplateVariable(variable);
    if (!normalized) {
      continue;
    }

    if (!isValidTemplateVariable(normalized)) {
      invalid.push(normalized);
      continue;
    }

    if (!templateContainsVariable(text, normalized)) {
      missingInText.push(normalized);
      continue;
    }

    valid.push(normalized);
  }

  return {
    valid: Array.from(new Set(valid)),
    invalid: Array.from(new Set(invalid)),
    missingInText: Array.from(new Set(missingInText)),
  };
}

export function mergeTemplateVariables(detected: string[], manual: string[]): string[] {
  return Array.from(new Set([...detected, ...manual].map(normalizeTemplateVariable).filter(Boolean)));
}

export function detectTemplateVariables(text: string): string[] {
  if (!text) {
    return [];
  }

  const matches = text.matchAll(TEMPLATE_VARIABLE_REGEX);
  const uniqueVariables = new Set<string>();

  for (const match of matches) {
    const variable = normalizeTemplateVariable(match[1] || '');
    if (variable) {
      uniqueVariables.add(variable);
    }
  }

  return Array.from(uniqueVariables);
}

export function hasTemplateVariables(text: string): boolean {
  return detectTemplateVariables(text).length > 0;
}
