import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
    test: {
        globals: true,
        root: './src',
        include: ['**/*.spec.ts'],
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['**/*.ts'],
            exclude: [
                '**/*.spec.ts',
                '**/*.module.ts',
                '**/main.ts',
                'seed.ts',
                '**/*.dto.ts',
                'platform/database/prisma.service.ts',
            ],
        },
    },
    plugins: [
        swc.vite({
            module: { type: 'es6' },
            jsc: {
                target: 'es2023',
                parser: {
                    syntax: 'typescript',
                    decorators: true,
                },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true,
                },
            },
        }),
    ],
});
