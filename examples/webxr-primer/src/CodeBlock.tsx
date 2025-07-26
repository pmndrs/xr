import { ReactNode } from 'react'

interface CodeBlockProps {
  children: ReactNode
}
export const CodeBlock = ({ children }: CodeBlockProps) => {
  return <div className="codeBlock">{children}</div>
}
