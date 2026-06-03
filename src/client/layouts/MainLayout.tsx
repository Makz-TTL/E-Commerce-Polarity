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
