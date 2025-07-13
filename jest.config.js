module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg|mp3)$": "<rootDir>/__mocks__/fileMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/test/test-utils.ts"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  transformIgnorePatterns: [
    "/node_modules/(?!(react-markdown|remark-.*|rehype-.*|hast-.*|unist-.*|vfile|vfile-message|mdast-.*|micromark.*|devlop|unified|bail|is-plain-obj|trough|zwitch|ccount|decode-named-character-reference|parse-entities|property-information|space-separated-tokens|stringify-entities|style-to-object|comma-separated-tokens|web-namespaces|direction|html-void-elements|longest-streak|markdown-escapes|markdown-table|mdast-util-.*|micromark-.*|trim-lines|unist-util-.*|unist-builder|unist-types|@babel/runtime|estree-util-is-identifier-name|html-url-attributes)/)",
  ],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
