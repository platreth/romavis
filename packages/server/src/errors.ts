/** An expected failure with a stable code the client can translate. */
export class GameError extends Error {
  constructor(public readonly code: string, public readonly status = 400) {
    super(code);
  }
}
