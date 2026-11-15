import { sanitizeVaultExtraLinks, type SanitizedVaultExtraLink } from "./url-safety";

export const VAULT_SUGGESTION_TYPES = ["DRIVE", "MODUL", "SILABUS", "OTHER"] as const;
export type VaultSuggestionType = (typeof VAULT_SUGGESTION_TYPES)[number];

export function normalizeVaultSuggestionType(raw?: string | null): VaultSuggestionType {
  const upper = (raw ?? "OTHER").trim().toUpperCase();
  if ((VAULT_SUGGESTION_TYPES as readonly string[]).includes(upper)) {
    return upper as VaultSuggestionType;
  }
  return "OTHER";
}

export interface VaultTargetState {
  driveUrl?: string | null;
  modulUrl?: string | null;
  silabusUrl?: string | null;
  extraLinks?: unknown;
}

export interface ApprovedSuggestionInput {
  id: string;
  title: string;
  url: string;
  type: string;
  description?: string | null;
}

function toExtraLinkType(type: VaultSuggestionType): SanitizedVaultExtraLink["type"] {
  if (type === "MODUL") return "MODULE";
  if (type === "SILABUS") return "SYLLABUS";
  if (type === "DRIVE") return "DRIVE";
  return "OTHER";
}

/**
 * Merges an approved student material suggestion into a CourseVault record cleanly
 * without overwriting already-configured primary URLs (unless they are empty).
 */
export function applySuggestionToVaultLinks(
  existing: VaultTargetState | null | undefined,
  suggestion: ApprovedSuggestionInput,
) {
  const type = normalizeVaultSuggestionType(suggestion.type);
  let driveUrl = existing?.driveUrl ?? null;
  let modulUrl = existing?.modulUrl ?? null;
  let silabusUrl = existing?.silabusUrl ?? null;
  const extraLinks: SanitizedVaultExtraLink[] = sanitizeVaultExtraLinks(existing?.extraLinks);

  const normalizedUrl = suggestion.url.trim();
  const alreadyPresent =
    driveUrl === normalizedUrl ||
    modulUrl === normalizedUrl ||
    silabusUrl === normalizedUrl ||
    extraLinks.some((link) => link.url === normalizedUrl);

  if (alreadyPresent) {
    return { driveUrl, modulUrl, silabusUrl, extraLinks };
  }

  if (type === "DRIVE" && !driveUrl) {
    driveUrl = normalizedUrl;
  } else if (type === "MODUL" && !modulUrl) {
    modulUrl = normalizedUrl;
  } else if (type === "SILABUS" && !silabusUrl) {
    silabusUrl = normalizedUrl;
  } else {
    extraLinks.push({
      id: `sug-${suggestion.id}`,
      title: suggestion.title.trim().slice(0, 120),
      url: normalizedUrl,
      type: toExtraLinkType(type),
      description: suggestion.description?.trim().slice(0, 240) || undefined,
    });
  }

  return { driveUrl, modulUrl, silabusUrl, extraLinks };
}
