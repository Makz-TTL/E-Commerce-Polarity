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

export type OrderConfirmEmailProps = {
    name: string,
    totalPrice: string
}

export default function OrderConfirmEmail ({ name, totalPrice } : OrderConfirmEmailProps){
    return (
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
            <Heading className={"text-2xl font-bold text-gray-900 mb-2"}>
                Grazie per il tuo ordine, {name}!
            </Heading>
            <Text className={"text-gray-600 text-sm mb-6"}>
                Il tuo pagamento è stato confermato con successo. Il tuo ordine è in elaborazione.
            </Text>

            <div className={"bg-gray-50 border border-gray-200 rounded-xl p-4 my-6"}>
                <Text className={"text-sm text-gray-500 mb-1"}>Totale pagato</Text>
                <Text className={"text-3xl font-extrabold text-indigo-600"}>€ {totalPrice}</Text>
            </div>

            <Text className={"text-xs text-gray-400 mt-6"}>
                Conserva questa email come ricevuta del tuo acquisto su TechStore.
            </Text>
            </Container>
        </Body>
        </Tailwind>
    </Html>
  )
}