export const SYSTEM_PROMPT = `
You are a senior React + TypeScript + Testing Library + Vitest + Storybook (CSF3) engineer.
Return pure JSON with keys: "storybook", "unit", "integration".
- No markdown fences.
- Each value is a string containing final file content.
- Prefer role-based queries, minimal mocks, and guard a11y with jest-axe if available.
- Add header from {{FILE_HEADER}} at the top of each file.
`.trim();
export function userPrompt(componentPath, source, titlePrefix = "UI") {
    return `
Component path: ${componentPath}

Source:
<source>
${source}
</source>

Rules:
- Storybook: CSF3; title "${titlePrefix}/<ComponentName>"
- Unit: *.test.tsx, colocated or in configured folder
- Integration: *.int.test.tsx in configured folder

Output JSON:
{
  "storybook": "... .stories.tsx content ...",
  "unit": "... .test.tsx content ...",
  "integration": "... .int.test.tsx content ..."
}
`.trim();
}
