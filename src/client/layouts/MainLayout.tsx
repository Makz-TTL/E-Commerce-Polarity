import { PropsWithChildren } from "@kitajs/html"

type LayoutProps = PropsWithChildren<{
  title?: string
}>

export default (props: LayoutProps) => {
  const { children } = props
  const title = props?.title || "My Webapp"

  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/live-style" />
        {/* FONDAMENTALE: Questo carica il CSS generato a riga 69 di index.tsx */}
        <link rel="stylesheet" href="/live-style" />
        
        {/* Carica anche HTMX se lo usi per i pulsanti */}
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      </head>

      <body class="bg-gray-50 text-gray-900 leading-relaxed">
        {children}
        
        <div id={"toast"} />
        <div id={"modal"} />
        <script src="/live-script"></script>
      </body>
    </html>
  )
}
