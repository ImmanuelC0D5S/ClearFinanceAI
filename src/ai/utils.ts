export function extractJsonFromText(text: string): string | null {
  if (!text) return null;
  let t = text.trim();

  // Remove code fences and common wrappers
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  t = t.replace(/^`+|`+$/g, '').trim();
  t = t.replace(/^json\s*/i, '').trim();

  // Quick parse attempt on cleaned text
  try { JSON.parse(t); return t; } catch (e) { /* fallthrough */ }

  // Find first JSON opener and match braces/brackets to extract a balanced JSON substring
  const start = t.search(/[\{\[]/);
  if (start === -1) return null;
  
  const openChar = t[start];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let bestCandidate: string | null = null;
  
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (ch === openChar) depth++;
    else if (ch === closeChar) depth--;

    if (depth === 0 && i > start) {
      const candidate = t.slice(start, i + 1);
      try { 
        JSON.parse(candidate);
        return candidate;
      } catch (e) { 
        // Keep trying, but save this as best attempt
        bestCandidate = candidate;
      }
    }
  }

  // If we found a balanced JSON even if it doesn't parse perfectly, return it
  // The downstream handler can try to recover from errors
  if (bestCandidate) {
    return bestCandidate;
  }

  return null;
}

/**
 * Attempt to repair truncated/incomplete JSON by closing open structures
 */
export function repairTruncatedJson(text: string): string {
  if (!text) return '{}';
  
  let repaired = text.trim();
  
  // Count open braces/brackets
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (ch === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (ch === '"' && !inString) {
      inString = true;
    } else if (ch === '"' && inString) {
      inString = false;
    }
    
    if (!inString) {
      if (ch === '{') braceDepth++;
      if (ch === '}') braceDepth--;
      if (ch === '[') bracketDepth++;
      if (ch === ']') bracketDepth--;
    }
  }
  
  // If we're inside a string that was cut off, close it
  if (inString) {
    repaired += '"';
  }
  
  // Close any open brackets/braces in reverse order
  while (bracketDepth > 0) {
    repaired += ']';
    bracketDepth--;
  }
  while (braceDepth > 0) {
    repaired += '}';
    braceDepth--;
  }
  
  return repaired;
}
