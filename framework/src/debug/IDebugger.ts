export interface LogMessage {
  text:      string
  level:     'info' | 'warn' | 'error'
  timestamp: string
}

export interface IDebugger {
  readonly enabled: boolean
  log(message: string): void
  logWarning(message: string): void
  logError(message: string): void
}
