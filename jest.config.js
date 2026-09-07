/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "node",
	testMatch: ["<rootDir>/src/**/*.test.ts"],
	transform: {
		"^.+\\.tsx?$": ["ts-jest", { isolatedModules: true }],
	},
};
