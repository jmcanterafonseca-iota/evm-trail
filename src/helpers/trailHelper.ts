export abstract class TrailHelper {
    public static extractSmartContractAddress(trailID: string) {
        new URL(trailID);
        const components = trailID.split(":");
        const smartContractAddress = components[components.length - 1];

        return smartContractAddress;
    }
}
