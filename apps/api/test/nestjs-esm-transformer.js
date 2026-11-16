const tsJestModule = require('ts-jest');
const tsJest = tsJestModule.default || tsJestModule;

const transformer = tsJest.createTransformer({
    tsconfig: {
        allowJs: true,
        module: 'commonjs',
        target: 'ES2021',
        esModuleInterop: true,
        isolatedModules: true,
    },
});

module.exports = {
    process(sourceText, sourcePath, options) {
        const patched = sourceText.replace(
            /import\.meta\.url/g,
            "require('url').pathToFileURL(__filename).href",
        );
        return transformer.process(patched, sourcePath, options);
    },
};