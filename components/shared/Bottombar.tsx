"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {sidebarLinks} from '@/constants'



export default function Bottombar (){
    const pathname = usePathname()
    return (
        <section className="bottombar flex">
            <div className="bottom_container">
                {sidebarLinks.map((link) =>{
                    return(
                        <Link
                        href={link.route}
                        key={link.label}
                        >
                            <Image 
                            src={link.imgURL} 
                            alt={link.label} 
                            width={16}
                            height={16}
                            />
                            <p>{link.label}</p>
                        </Link>
                        
                    )
                })}
            </div>
        </section>
    )
}