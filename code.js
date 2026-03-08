"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, { width: 400, height: 300 });
function sendCollections() {
    return __awaiter(this, void 0, void 0, function* () {
        const collections = yield figma.variables.getLocalVariableCollectionsAsync();
        const payload = [];
        for (const collection of collections) {
            const variables = [];
            for (const id of collection.variableIds) {
                const variable = yield figma.variables.getVariableByIdAsync(id);
                if (variable)
                    variables.push({ id: variable.id, name: variable.name });
            }
            payload.push({ id: collection.id, name: collection.name, variables });
        }
        figma.ui.postMessage({ type: "collections", collections: payload });
    });
}
sendCollections();
// Receive selected leaf variable ID
figma.ui.onmessage = (msg) => {
    if (msg.type === "variable-selected") {
        const variableId = msg.variableId;
        console.log("Leaf variable selected:", variableId);
        // This variableId represents the entire variable including all modes
        // You can use it for any further plugin logic
    }
};
