
import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
    testEnvironment: 'node',
    transform: {
        ...tsJestTransformCfg,
    },

    testMatch: [
        '**/src/**/*.test.ts',
        '**/src/**/*.spec.ts',
    ],

    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
    ],
    moduleNameMapper: {
        // Кажемо Jest: якщо ти бачиш імпорт типу './logger.js',
        // поводься з ним так, ніби це './logger'
        // (і Jest автоматично знайде ./logger.ts)
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};