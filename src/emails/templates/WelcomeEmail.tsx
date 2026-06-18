declare module "react/jsx-runtime"

/** @jsxImportSource react */
import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Text,
  Tailwind,
} from "react-email"

export type WelcomeEmailProps = {
  name: string
  code: string 
}

export default ({ name, code }: WelcomeEmailProps) => (
  <Html>
    <Head>
      <Font
        fontFamily={"Inter"}
        fallbackFontFamily={["Arial", "sans-serif"]}
        webFont={{
          url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
          format: "woff2",
        }}
      />
    </Head>
    <Tailwind>
      <Body className={"bg-gray-100 font-sans"}>
        <Container className={"bg-white p-6 rounded-xl shadow-md max-w-md mx-auto my-8 text-center"}>
          <Heading className={"text-2xl font-bold text-gray-900 mb-2 text-center"}>
            Benvenuto, {name}!
          </Heading>
          <Text className={"text-gray-600 text-sm mb-6 text-center"}>
            Grazie per esserti registrato su TechStore. Usa il codice qui sotto per verificare il tuo account:
          </Text>
          
          <div className={"bg-gray-50 border border-gray-200 rounded-xl p-4 my-6 tracking-widest font-mono text-3xl font-extrabold text-indigo-600 select-all"}>
            {code}
          </div>
          
          <Text className={"text-xs text-gray-400 text-center mt-6"}>
            Se non hai richiesto tu questo codice, puoi tranquillamente ignorare questa email.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)