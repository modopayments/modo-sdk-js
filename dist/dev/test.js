"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modo_1 = require("../modo");
const apiLoc = {
    api_url: "localhost",
    base: "/test",
    port: 1337,
};
const creds = {
    key: "key",
    secret: "secret",
};
const client = new modo_1.Modo(apiLoc, creds, false, 1000);
client.query("test").then((data) => {
    console.log(data);
});
