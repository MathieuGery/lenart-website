import clsx from 'clsx'
import Link from 'next/link'

function Office({
  name,
  children,
  invert = false,
}: {
  name: string
  children: React.ReactNode
  invert?: boolean
}) {
  return (
    <address
      className={clsx(
        'text-sm not-italic',
        invert ? 'text-neutral-300' : 'text-neutral-600',
      )}
    >
      <strong className={invert ? 'text-white' : 'text-neutral-950'}>
        {name}
      </strong>
      <br />
      {children}
    </address>
  )
}

export function ContactCallToAction({
  invert = false,
  ...props
}: React.ComponentPropsWithoutRef<'ul'> & { invert?: boolean }) {
  return (
    <ul role="list" {...props}>
      <li>
        <Office name="mail" invert={invert}>
          <Link
            href="mailto:contact@len-art.fr"
            className=""
          >
            contact@len-art.fr
          </Link>
        </Office>
      </li>
      <li>
        <Office name="instagram" invert={invert}>
          <Link
            href="https://instagram.com/len_._art"
            className=""
          >
            @len_._art
          </Link>
        </Office>
      </li>
    </ul>
  )
}
