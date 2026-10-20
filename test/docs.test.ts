import { expect, test } from 'vitest'

const docs = import.meta.glob<string>(['../README.md', '../guide/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true
})
const examples = Object.values(
  import.meta.glob<string>('../examples/*', { query: '?raw', import: 'default', eager: true })
).map(withoutIndent)

const runnableBlocks = Object.entries(docs).flatMap(([file, text]) =>
  Array.from(text.matchAll(/^```(?:js|ts|html)\n([\s\S]*?)^```$/gm), ([, code = '']) => ({
    file,
    code
  })).filter(({ code }) => !code.includes('…'))
)

test.each(runnableBlocks)('runs the code block from $file in an example', ({ code }) => {
  expect(examples.some((example) => example.includes(withoutIndent(code)))).toBe(true)
})

function withoutIndent(code: string): string {
  return code.replaceAll(/^[ \t]+/gm, '')
}
