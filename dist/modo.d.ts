/// <reference types="node" />
import P = require("pino");
export interface IApiLoc {
    base: string;
    api_url: string;
    port?: number;
}
export interface IApiCred {
    secret: string;
    key: string;
}
export declare class Modo {
    private Agent;
    private credentials?;
    private location;
    private vaultEncKey;
    private vaultEncKeyProm;
    private logger;
    constructor(location: IApiLoc, credentials?: IApiCred, useKeepAliveAgent?: boolean, timeout?: number, logger?: P.Logger);
    vaultEncrypt(data: Buffer, credentials?: IApiCred): Promise<Buffer>;
    query(endpoint: string, params?: object, locationOverride?: IApiLoc, credentials?: IApiCred, authType?: "MODO1" | "MODO2" | "NONE", json?: boolean, callRef?: string): Promise<any>;
    private _getKey;
}
