'use client'

import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { usePathname } from 'next/navigation'
import {
  Bars3Icon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UserIcon,
  XMarkIcon,
  PercentBadgeIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Commandes', href: '/admin/dashboard/orders', icon: DocumentDuplicateIcon },
  { name: 'Collections', href: '/admin/dashboard/buckets', icon: FolderIcon },
  { name: 'Galeries', href: '/admin/dashboard/galleries', icon: PhotoIcon },
  { name: 'Codes promo', href: '/admin/dashboard/promo-codes', icon: PercentBadgeIcon }
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Détermine si un lien de navigation est actif en fonction du chemin actuel
  const isActive = (href: string) => {
    // Vérifier si le chemin actuel correspond exactement ou commence par le href
    return pathname === href ||
      (href !== '/admin/dashboard' && pathname.startsWith(href));
  }

  return (
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 left-full flex w-16 justify-center pt-5">
                      <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                        <span className="sr-only">Fermer la sidebar</span>
                        <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Sidebar component, swap this element with another sidebar if you like */}
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 shadow-lg">
                    <div className="flex h-16 shrink-0 items-center">
                      <Link href="/" className="text-xl font-bold text-gray-900">
                        Lenart Admin
                      </Link>
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  className={classNames(
                                    isActive(item.href)
                                      ? 'bg-gray-100 text-gray-900'
                                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                                    'group flex gap-x-3 rounded-md p-2 text-sm font-semibold'
                                  )}
                                >
                                  <item.icon
                                    className={classNames(
                                      isActive(item.href) ? 'text-gray-700' : 'text-gray-400 group-hover:text-gray-700',
                                      'h-6 w-6 shrink-0'
                                    )}
                                    aria-hidden="true"
                                  />
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                        <li className="-mx-6 mt-auto">
                          <div
                            className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                              <UserIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                            </span>
                            <span>Admin</span>
                          </div>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 shadow-lg border-r border-neutral-200">
            <div className="flex h-16 shrink-0 items-center mt-2">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Lenart Admin
              </Link>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            isActive(item.href)
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              isActive(item.href) ? 'text-gray-700' : 'text-gray-400 group-hover:text-gray-700',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="-mx-6 mt-auto mb-4">
                  <div
                    className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-md"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <UserIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                    </span>
                    <span>Admin</span>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm border-b border-neutral-200 sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Ouvrir la sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-sm font-semibold text-gray-900">Admin</div>
          <>
            <span className="sr-only">Admin</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <UserIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
            </span>
          </>
        </div>

        <main className="lg:pl-72">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
