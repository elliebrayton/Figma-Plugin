figma.showUI(__html__, { width: 400, height: 420 });

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
figma.ui.onmessage = async (msg) => {
  if (msg.type === "variable-selected") {
    console.log("Leaf variable selected:", msg.variableId);
  }

  if (msg.type === "read-variable") {
    const variable = await figma.variables.getVariableByIdAsync(msg.variableId);
    if (!variable) return;

    const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
    const modeMap = new Map(collection?.modes.map(m => [m.modeId, m.name]) ?? []);

    async function resolveValue(value: VariableValue): Promise<{ display: string; raw: VariableValue }> {
      if (typeof value === "object" && value !== null && "type" in value && value.type === "VARIABLE_ALIAS") {
        const alias = await figma.variables.getVariableByIdAsync((value as VariableAlias).id);
        if (alias) {
          const firstModeId = Object.keys(alias.valuesByMode)[0];
          return resolveValue(alias.valuesByMode[firstModeId]);
        }
        return { display: (value as VariableAlias).id, raw: value };
      }
      if (typeof value === "object" && value !== null && "r" in value) {
        const { r, g, b, a } = value as RGBA;
        const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        return { display: a < 1 ? `${hex}${toHex(a)}` : hex, raw: value };
      }
      if (typeof value === "object" && value !== null) return { display: JSON.stringify(value), raw: value };
      return { display: String(value), raw: value };
    }

    const values = await Promise.all(
      Object.entries(variable.valuesByMode).map(async ([modeId, value]) => {
        const resolved = await resolveValue(value);
        return {
          modeId,
          mode: modeMap.get(modeId) ?? modeId,
          value: resolved.display,
          rawValue: resolved.raw
        };
      })
    );

    figma.ui.postMessage({
      type: "variable-readback",
      id: variable.id,
      name: variable.name,
      resolvedType: variable.resolvedType,
      values
    });
  }

  if (msg.type === "apply-to-modes") {
    const variable = await figma.variables.getVariableByIdAsync(msg.variableId);
    if (!variable) return;

    for (const modeId of msg.modeIds as string[]) {
      variable.setValueForMode(modeId, msg.rawValue);
    }

    figma.ui.postMessage({ type: "apply-complete" });
  }
};