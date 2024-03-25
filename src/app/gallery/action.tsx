'use server'

import { redirect } from 'next/navigation'

export async function navigate(data: FormData) {
  redirect(`/gallery/${data.get('id')}`)
}

export async function redirect404() {
  redirect(`/notfound`)
}