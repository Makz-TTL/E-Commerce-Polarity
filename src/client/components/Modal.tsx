import { PropsWithChildren } from "@kitajs/html"
import classNames from "classnames"

type ModalSize = "sm" | "md"
type ModalProps = Omit<JSX.HtmlTag, "title"> &
  PropsWithChildren<{
    ariaLabelledby?: string
    centered?: boolean
    className?: string
    footer?: JSX.Element
    isOpen?: boolean
    size?: ModalSize
    title: JSX.Element
    removeOnClose?: boolean
    closable?: boolean
  }>

export default ({
  ariaLabelledby,
  centered,
  children,
  className,
  footer,
  isOpen = true,
  size = "md",
  title,
  removeOnClose = true,
  closable = true,
  ...props
}: ModalProps) => {
  return (
    <div
      class={classNames(
        `modal__wrap modal__wrap--${size}`,
        isOpen && "is-open",
        centered && "is-centered",
        className
      )}
      tabindex="-1"
      role="dialog"
      aria-labelledby={ariaLabelledby}
      aria-hidden="true"
      {...props}
    >
      <div class="modal__overlay" aria-hidden="true" />

      <div class="modal" role="document">
        <div class={"flex justify-between items-center gap-4 mb-4"}>
          <div class="modal__title" id={ariaLabelledby}>
            {title}
          </div>

          {
            closable
              ?
              <button type="button" class="modal__close" aria-label="Chiudi" onclick={`closeModal(event, ${removeOnClose})`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
              : null
          }
        </div>

        <div class="modal__content">{children as "safe"}</div>

        {footer
          ?
          <div class="modal__footer">
            {footer ? footer : null}
          </div>
          : null
        }
      </div>
    </div>
  )
}
