export interface IInclusionResult {
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
