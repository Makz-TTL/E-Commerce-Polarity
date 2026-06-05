import { createTransport } from "nodemailer"
import { render } from "@react-email/render"

import SampleEmail, { SampleEmailProps } from "./templates/SampleEmail"
import WelcomeEmail, { WelcomeEmailProps } from "./templates/WelcomeEmail"

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
  | { template: "SampleEmail"; payload: SampleEmailProps }
  | { template: "WelcomeEmail"; payload: WelcomeEmailProps }

export const sendTemplateEmail = async (
  options: SendTemplateEmailOptions & { to: string; subject: string }
) => {
  const { template, payload, to, subject } = options

  let body
  
  // FIX: Calling them as regular functions removes all JSX brackets
  if (template === "SampleEmail") {
    body = SampleEmail(payload)
  } else if (template === "WelcomeEmail") {
    body = WelcomeEmail(payload)
  }

  if (!body) throw new Error(`Template missing`)

  // @react-email/render can process the raw function output perfectly
  const html = await render(body)
  const text = await render(body, { plainText: true })

  await sendLocalEmail({ html, to, text, subject })
}