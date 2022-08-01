<div align="center">

  <img src="./src/assets/logo.webp" width="70">
  <img src="./src/assets/figma.png" width="70">

# Geenes 2 Figma plugin

[Geenes.app](https://geenes.app) is a free app where you can easily create and maintain full colour palettes and their variations.

Seamlessly import them as styles into Figma with this plugin.

[Try it here](https://www.figma.com/community/plugin/887066243068431786/Geenes)
</div>

## Get Started

```bash
# Clone Repo
git clone https://github.com/gigig987/Geenes2Figma.git [plugin-name]

#Install dependencies
npm install
```

### Build Setup

```bash
# Watch files for local dev
npm run dev

# Build for production
npm run build

# Preview UI
npm run preview
```

## Tips

If you get this error with
plugin-typings 1.42.1:

```bash
node_modules/@figma/plugin-typings/index.d.ts:11:9 - error TS2649: Cannot augment module 'console' with value exports because it resolves to a non-module entity.

11   const console: Console
           ~~~~~~~
```

Can you make const to var:

```ts
// node_modules/@figma/plugin-typings/index.d.ts

var console: Console;
```

From:
[Github issues: unable to use typings with v 1.39.0 #90](https://github.com/figma/plugin-typings/issues/90)

## Enjoy ;-)
