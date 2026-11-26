import styled from 'styled-components'

const Frame = styled.iframe`
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #05080f;
`

/** Embed an original three-screen-lab standalone page. */
export default function ScreenFrame({ src, title }: { src: string; title: string }) {
  return (
    <Frame
      title={title}
      src={`${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`}
      allow="fullscreen"
    />
  )
}
