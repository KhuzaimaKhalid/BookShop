const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("localApi", true);