import { SignIn } from "@clerk/nextjs";

export default function Home() {
  return (
    <>
      <div className="h-screen bg-dark-1">
        <div>Your home page's content can go here.</div>
        <SignIn></SignIn>
      </div>
    </>
  )
}