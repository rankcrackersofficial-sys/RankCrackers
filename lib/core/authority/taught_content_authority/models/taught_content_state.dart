/// State semantics for teaching execution and taught content authority.
enum TaughtExecutionState {
  executionPending,
  executed,
  validated,
  invalidated,
  superseded,
}

enum TaughtAuthorityState {
  validated,
  invalidated,
  superseded,
}
