import { IApiCred } from "./modo";
export interface ISignature {
    signature: string;
    timestamp: number;
}
export declare type SignatureGenerator = (uri: string, bodyContent: string, credentials: IApiCred) => ISignature;
export declare const ModoSignatures: {
    [type: string]: SignatureGenerator;
};
