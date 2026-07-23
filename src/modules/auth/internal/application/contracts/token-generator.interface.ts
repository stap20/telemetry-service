// cypod-telemetry
export interface ITokenGenerator {
    generateToken(payload: Record<string, any>): Promise<string>;
  }
  export const ITokenGenerator = Symbol('ITokenGenerator');