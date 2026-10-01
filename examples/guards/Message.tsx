import { Container, Text } from '@react-three/uikit'

interface MessageProps {
  message: string
}

export const Message = ({ message }: MessageProps) => {
  console.log('But I am still rendered no matter what!')
  return (
    <group position={[-2, 2, -3]}>
      <Container borderRadius={50} backgroundColor={'black'} padding={5}>
        <Text color={'white'}>{message}</Text>
      </Container>
    </group>
  )
}
