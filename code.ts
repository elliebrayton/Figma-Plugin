figma.showUI(__html__, { width: 400, height: 300 });

async function sendCollections() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const payload = [];

  for (const collection of collections) {
    const variables = [];
    for (const id of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(id);
      if (variable) variables.push({ id: variable.id, name: variable.name });
    }
    payload.push({ id: collection.id, name: collection.name, variables });
  }

  figma.ui.postMessage({ type: "collections", collections: payload });
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