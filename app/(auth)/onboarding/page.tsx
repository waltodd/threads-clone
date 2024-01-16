import { UserButton } from "@clerk/nextjs";
async function Page (){
    return (
        <main className="head-text">
        <h1>Onboarding</h1>
        <UserButton />
        </main>
    )
}
export default Page;