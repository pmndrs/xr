# @pmndrs/handle

framework agnostic handle implementation for threejs

## How to use

```ts
//lets create a handle to translate the object on the x axis (the target and the handle are both the object)
const store = new HandleStore(object, () => ({ scale: false, rotate: false, translate: "x" }))
store.bind(object)
```