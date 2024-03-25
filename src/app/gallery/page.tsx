import { navigate } from './action'
import { LockClosedIcon } from '@heroicons/react/24/solid'

export default async function Gallery() {
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
                    Saisir le code pour avoir accès à la gallerie.
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
                >
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