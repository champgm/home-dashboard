import { verifyType } from ".";

export interface State {
  on: boolean;
}

export namespace State {
  export function create(payload: State): State {
    if (!payload) { throw new Error("State not found"); }
    return {
      on: verifyType(payload.on, "on", "boolean"),
    };
  }
}
