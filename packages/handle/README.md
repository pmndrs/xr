# @pmndrs/handle

framework agnostic handle implementation for threejs

## How to use

```ts
//lets create a handle to translate the object on the x axis (the target and the handle are both the object)
const store = new HandleStore(object, () => ({ scale: false, rotate: false, translate: 'x' }))
store.bind(object)
//handles receive input through @pmndrs/pointer-events (e.g. forwardHtmlEvents) and apply it in update
renderer.setAnimationLoop((time) => {
  store.update(time)
  renderer.render(scene, camera)
})
```

## Agent skills

This package ships a usage skill for coding agents, matching the installed version. Install it with [skills-npm](https://github.com/antfu/skills-npm), which links the skills of your installed packages for your agent:

```bash
npm i -D skills-npm
npx skills-npm setup
```
