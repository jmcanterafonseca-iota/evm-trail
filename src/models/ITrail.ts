export interface ITrail {
    trail: {
        id: string;
        stateIndex: number;
        record: unknown;
        immutable?: unknown;
    };
    meta: {
        created: string;
        updated: string;
        controller: string;
        governor: string;
        lastTrailStateHash: Uint8Array;
        firstInclusionBlock?: number;
        lastInclusionBlock?: number;
    };
}
