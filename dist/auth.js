"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const jsonwebtoken_1 = require("jsonwebtoken");
const MODO1 = (uri, bodyContent, credentials) => {
    const SIGN_VERSION = "MODO1";
    const bodyHash = crypto.createHash("sha256").update(bodyContent).digest("hex");
    const timestamp = Date.now();
    const signingKey = crypto.createHmac("sha256", SIGN_VERSION + credentials.secret)
        .update(timestamp.toString()).digest();
    const stringToSign = `${timestamp}&${uri}&${bodyHash}`;
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
    return {
        signature: `${SIGN_VERSION} key=${credentials.key}, sig=${signature}`,
        timestamp,
    };
};
const MODO2 = (uri, bodyContent, credentials) => {
    const bodyHash = crypto.createHash("sha256").update(bodyContent).digest("hex");
    const payload = {
        api_uri: uri,
        body_hash: bodyHash,
        api_identifier: credentials.key,
    };
    const token = jsonwebtoken_1.sign(payload, credentials.secret, {
        header: {
            typ: "JWT",
        },
    });
    return {
        signature: "MODO2 " + token,
        timestamp: Date.now(),
    };
};
const NONE = (uri, bodyContent, credentials) => {
    return {
        signature: "",
        timestamp: Date.now(),
    };
};
exports.ModoSignatures = {
    MODO1,
    MODO2,
    NONE,
};
