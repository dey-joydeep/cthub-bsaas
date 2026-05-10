import type { TransformedSource } from '@jest/transform';
import { transformSync } from 'esbuild';

export function process(sourceText: string, sourcePath: string): TransformedSource {
  // Transpile TypeScript to JavaScript using esbuild for better performance
  const result = transformSync(sourceText, {
    loader: 'ts',
    format: 'cjs',
    target: 'node14',
    sourcefile: sourcePath,
  });

  return {
    code: result.code,
    map: result.map || '',
  };
}
