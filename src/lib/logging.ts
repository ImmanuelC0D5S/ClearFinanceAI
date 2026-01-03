type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export function logStructured(level: LogLevel, message: string, meta: Record<string, any> = {}) {
  // Emit a single-line JSON log to keep it compatible with structured logging systems.
  const entry = {
    timestamp: new Date().toISOString(),
    severity: level,
    message,
    ...meta,
  };
  // Keep using console for now; swap to Google Cloud Logging later by replacing this implementation.
  try {
    console.log(JSON.stringify(entry));
  } catch (e) {
    // Fallback if circular structures sneak in
    console.log(JSON.stringify({ ...entry, meta: JSON.stringify(meta) }));
  }
}
