import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts"],
	format: ["esm", "cjs"],
	target: "es2019",
	exports: {
		enabled: true,
	},
});
