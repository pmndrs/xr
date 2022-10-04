export const uniq = <T>(arr: T[]) => {
  const uniqSet = new Set<T>()
  arr.forEach((item) => {
    uniqSet.add(item)
  })
  return [...uniqSet.values()]
}
