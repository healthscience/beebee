export const schedulingSchema = {
    type: "object",
    properties: {
        task_emulation: { type: "string" },
        energy_weight: { type: "number", minimum: 0, maximum: 1 },
        context_buffer_allocation: { type: "integer" },
        priority_strata: { enum: ["immediate", "buffered", "background"] }
    },
    required: ["task_emulation", "energy_weight", "priority_strata"]
};

// Usage within a peer task:
// const bee = await createBeeBee({ gpu: true });
// const state = await bee.emulate("Analyze 'Refactor HOP core' task", schedulingSchema);
// console.log(JSON.parse(state));