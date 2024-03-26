export interface IInclusionResult {
    trail: {
        id: string;
    };
    inclusionProofed: boolean;
    claims?: unknown;
    proof?: {
        type: string;
        transactionHash: string;
        transactionIndex: number;
        blockNumber: number;
        timestamp: string;
    };
}
