'use server'

import { redirect } from 'next/navigation'

export async function navigate(data: FormData) {
  redirect(`/gallery/${data.get('id')?.toString().toLowerCase()}`)
}

export async function redirect404() {
  redirect(`/notfound`)
}
