import { redirect } from 'next/navigation'

/** /espia was renamed to /radar — keep the old URL alive for existing bookmarks/links. */
export default function EspiaRedirect() {
  redirect('/radar')
}
