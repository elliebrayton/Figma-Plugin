"use strict";
figma.showUI(__html__, { width: 400, height: 300 });
async function sendCollections() {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const payload = [];
    for (const collection of collections) {
        const variables = [];
        for (const id of collection.variableIds) {
            const variable = await figma.variables.getVariableByIdAsync(id);
            if (variable)
                variables.push({ id: variable.id, name: variable.name });
        }
        payload.push({ id: collection.id, name: collection.name, variables });
    }
    figma.ui.postMessage({ type: "collections", collections: payload });
}
sendCollections();
// Receive selected leaf variable ID
figma.ui.onmessage = async (msg) => {
    var _a;
    if (msg.type === "variable-selected") {
        console.log("Leaf variable selected:", msg.variableId);
    }
    if (msg.type === "read-variable") {
        const variable = await figma.variables.getVariableByIdAsync(msg.variableId);
        if (!variable)
            return;
        const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
        const modeMap = new Map((_a = collection === null || collection === void 0 ? void 0 : collection.modes.map(m => [m.modeId, m.name])) !== null && _a !== void 0 ? _a : []);
        const values = Object.entries(variable.valuesByMode).map(([modeId, value]) => {
            var _a;
            return ({
                mode: (_a = modeMap.get(modeId)) !== null && _a !== void 0 ? _a : modeId,
                value: typeof value === "object" && value !== null
                    ? JSON.stringify(value)
                    : String(value)
            });
        });
        figma.ui.postMessage({
            type: "variable-readback",
            id: variable.id,
            name: variable.name,
            resolvedType: variable.resolvedType,
            values
        });
    }
};
