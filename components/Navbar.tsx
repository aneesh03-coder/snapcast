"use client"
import { authClient } from '@/lib/auth-client'
import Image from 'next/image'
import Link from 'next/link'
import { redirect, useRouter } from 'next/navigation'

import React from 'react'




const Navbar = () => {
    const router=useRouter()
    const {data:session}=authClient.useSession()
    const user=session?.user

    const logout= async ()=>{
        return await authClient.signOut({
              fetchOptions: {
                    onSuccess: () => {
                      redirect("/sign-in");
                    },
                  },
        })
    }

  return (
    <header className='navbar'>
        <nav>
            <Link href='/'>
                <Image src='/assets/icons/logo.svg' alt='Logo' width={32} height={32}/>
                <h1>Snapcast</h1>
            </Link>
            {user && (
                <figure>
                    <button onClick={()=>router.push(`/profile/${user?.id}`)}>
                        <Image src={user.image || ''} alt="User" 
                        width={36} height={36} className=' aspect-square rounded-full' />
                    </button>
                    <button className='cursor-pointer' onClick={logout}>
                        <Image src='/assets/icons/logout.svg' alt='logout' width={24} height={24} className='rotate-180'/>
                    </button>
                </figure>
            )}
        </nav>
    </header>
  )
}

export default Navbar