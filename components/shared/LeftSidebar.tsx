"use client"
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignOutButton, SignedIn, useAuth } from "@clerk/nextjs";

import { sidebarLinks } from "@/constants";
export default function LeftSidebar (){
    const router = useRouter()
    const pathname = usePathname()
    return (
        <div className="leftsidebar">
            <div className="">
                {sidebarLinks.map((link) =>{
                    const isActive = (
                        pathname.includes(link.route) && link.route.length > 1
                    ) || pathname ===link.route
                    return(
                        <Link
                        href={link.route}
                        key={link.label}
                        className={`leftsidebar_link ${isActive && "bg-primary-500"}`}
                        >
                        <Image src={link.imgURL} width={24} height={24} alt={link.label} />
                        <p className="text-light-1 max-lg:hidden">{link.label}</p>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}