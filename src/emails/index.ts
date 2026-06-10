import { createTransport } from "nodemailer"
import { render } from "@react-email/render"


import WelcomeEmail, { WelcomeEmailProps } from "./templates/WelcomeEmail"
import ChangePasswordEmail, { ChangePasswordEmailProps } from "./templates/ChangePasswordEmail"
import OrderConfirmEmail, { OrderConfirmEmailProps } from "./templates/OrderConfirmEmail"

const transport = createTransport({
  port: 1025,
  host: "localhost",
})

export const sendLocalEmail = async (options: {
  to: string
  subject: string
  text?: string
  html: string
}) => {
  const { to, subject, text, html } = options
  await transport.sendMail({
    from: "no-reply@polarity.dev",
    to,
    subject,
    text,
    html,
  })
}

export type SendTemplateEmailOptions = 
  
  ({ template: "WelcomeEmail"; payload: WelcomeEmailProps, } | {
    template: "ChangePasswordEmail"; payload: ChangePasswordEmailProps
   } | {template: "OrderConfirmEmail"; payload: OrderConfirmEmailProps})

export const sendTemplateEmail = async (
  options: SendTemplateEmailOptions & { to: string; subject: string }
) => {
  const { template, payload, to, subject } = options

  let body
  
  if (template === "WelcomeEmail") {
    body = WelcomeEmail(payload)
  } else if (template === "ChangePasswordEmail") {
    body = ChangePasswordEmail(payload)
  } else if (template == "OrderConfirmEmail") {
    body = OrderConfirmEmail(payload)
  }

  if (!body) throw new Error(`Template missing`)


  const html = await render(body)
  const text = await render(body, { plainText: true })

  await sendLocalEmail({ html, to, text, subject })
}