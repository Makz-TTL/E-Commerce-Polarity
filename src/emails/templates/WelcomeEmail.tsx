declare module "react/jsx-runtime"

/** @jsxImportSource react */
import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Tailwind,
} from "react-email"

export type WelcomeEmailProps = {
  name: string
}

export default ({ name }: WelcomeEmailProps) => (
  <Html>
    <Head>
      <Font
        fontFamily={"Inter"}
        fallbackFontFamily={["Arial", "sans-serif"]}
        webFont={{
          url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
          format: "woff2",
        }}
      />
    </Head>
    <Tailwind>
     
      <Body className={"bg-gray-100 font-sans"}>
        <Container className={"bg-white p-6 rounded-lg shadow-md"}>
          <Heading className={"text-2xl font-bold mb-4"}>Benvenuto, {name}!<br /></Heading>
          <Text className={"text-gray-700 mb-4"}>Grazie per esserti registrato</Text>
          <Button
            href={"https://example.com"}
            className={"bg-blue-500 text-white px-4 py-2 rounded"}
          >
            Copia il codice di verifica
          </Button>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)