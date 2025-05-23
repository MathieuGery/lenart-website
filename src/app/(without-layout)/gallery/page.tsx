'use client'
import { navigate } from './action'
import { LockClosedIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'

export default function Gallery() {
  const [isLoading, setIsLoading] = useState(false)
  return (
    <div className="h-screen flex items-center justify-center z-10">
      <div className="fixed">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full ring-neutral-800">
                <LockClosedIcon className="h-6 w-6 text-neutral-950" aria-hidden="true"/>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <div className="text-base font-semibold leading-6 text-gray-900">
                  Accéder à vos photos
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Saisir le code pour avoir accès à la galerie.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <form action={navigate}>
                <div className="mb-2 mx-10">
                  <input
                    type="text"
                    name="id"
                    id="code"
                    className="text-center px-4 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm sm:leading-6"
                    placeholder="1234"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md bg-neutral-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={() => (setIsLoading(true))}
                >
                  {isLoading ? ( <svg aria-hidden="true"
                                      className="w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-white mr-2"
                                      viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"/>
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"/>
                  </svg>) : (<></>)}
                  Accéder aux photos
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
