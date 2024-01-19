"use server"

import { revalidatePath } from "next/cache"
import { connectToDB } from "../mongoose"

import User from "../models/user.model"
import Thread from "../models/thread.model"
import Community from "../models/community.model"

export async function fetchPosts(pageNumber = 1, pageSize=20){
    connectToDB()

    // Calculate the number of posts to skip based on the page number and page size.
    const skipAmount = (pageNumber * 1) * pageSize;

    // Create a query to fetch the posts that have no parent
    // (top-level threads) (a thread that is not a comment/reply).
    const postQuery = Thread.find({parentId: {$in: [null, undefined]}})
        .sort({createdAt: 'desc'})
        .skip(skipAmount)
        .limit(pageSize)
        .populate({
            path: "author",
            model: User
        })
        .populate({
                path: "community",
                model: Community
        })
        .populate({
            path: "children",
            populate :{
                path: "author",
                model: User,
                select: "_id name parentId image"
            }
        })

        // Count the total number of top-level posts (threads) i.e., threads that are not comments.
        const totalPostsCount =  await Thread.countDocuments({
            parentId: {$in: [null, undefined]}
        })

        const posts = await postQuery.exec();

        const isNext = totalPostsCount > skipAmount + posts.length;
        return {posts, isNext}
}

interface Params {
    text: string;
    author: string,
    communityId?: string | null;
    path: string;
}

export async function createThread({
    text,
    author,
    communityId,
    path
}:Params){
    try {
        connectToDB();

    const communityIdObject = await Community.findOne(
        {id: communityId},
        {_id: 1}
    );

    const createThread = await Thread.create({
        text,
        author,
        community: communityIdObject
    })

    //update the user
    await User.findByIdAndUpdate(author,{
        $push: {threads: createThread._id}
    })

    if (communityIdObject) {
        await User.findByIdAndUpdate(communityIdObject,{
            $push: {threads: createThread._id}
        })
    }
     revalidatePath(path)

    } catch (error: any) {
        throw new Error(`Failed to create Thead ${error.message}`)
    }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
    const childThreads = await Thread.find({parentId: threadId});

    const descendantThreads = [];

    for (const childThread of childThreads){
        const descendants =  await fetchAllChildThreads(childThread._id);
        descendantThreads.push(childThread, ...descendants)
    }

    return descendantThreads;
}

export async function deleteThread(id: string, path: string) : Promise<void>{
    try {
        connectToDB();

        //Find the thread to be deleted (the main thread)
        const mainThread = await Thread.findById(id).populate("author community");
        if (!mainThread) {
            throw new Error("Thread not found");
        }

        //Fetch all child threads and their descendants recursively
        const descendantThreads = await fetchAllChildThreads(id);

        //Get all descendant thread IDs including the main thread ID and child threads IDs
        const descendantThreadIds = [
            id,
            ...descendantThreads.map((thread) => thread._id)
        ]

        //Extract the authorIds and communitIds to update User and Community models respectively
        const uniqueAuthorIds = new Set([
            ...descendantThreads.map((thread) => thread.author?._id.toString()),
            mainThread.author?._id?.toString()
        ].filter((id)=> id !== undefined))


        const uniqueCommunityIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.community?._id.toString()),
                mainThread.community?._id?.toString(),
            ].filter((id) => id !== undefined)
        )

        // Recursively delete child threads and their descendants
        await Thread.deleteMany({_id: {$in: descendantThreadIds}});

        //Update User model
        await User.updateMany(
            {_id: {$in: Array.from(uniqueAuthorIds)}},
            { $pull: {threads: {$in: descendantThreadIds}}}
        )
        //Update Community model
        await Community.updateMany(
            {_id: {$in: Array.from(uniqueCommunityIds)} },
            { $pull: { threads: {$in: descendantThreadIds}}}
        )

        revalidatePath(path)
    } catch (error: any) {
        throw new Error(`Failed to delete thread: ${error.message}`);
    }
}

export async function fetchThreadById(threadId: string){
    try {
        connectToDB();

        const thread = await Thread.findById(threadId)
            .populate({
               path: "author",
               model: User,
               select: "_id id name image" 
            }).
            populate({
                path: "community",
                model: Community,
                select: "_id id name image"
            }).populate({
                path: "children",
                populate : [
                    {
                        path: "author",
                        model: User,
                        select: "_id id name image"
                    },
                    {
                        path: "children",
                        model: Thread,
                        populate: {
                            path: "author",
                            model: User,
                            select: "_id id name image"
                        }
                    }
                ]
            }).exec();

            return thread
    } catch (err) {
        console.error("Error while fetching thread:", err);
        throw new Error("Unable to fetch thread"); 
    }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
){
    try {
        connectToDB()
        //Find the original thread by its ID
        const originalThread = await Thread.findById(threadId);

        if (!originalThread) throw new Error("Thread nit found");

        //create the new comment thread
        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId
        })

        //Save the comment thread to the database
        const savedCommentThread = await commentThread.save();

        //add the comment thread's ID to the original thread's children array
        originalThread.children.push(savedCommentThread._id);

        //Save the updated orignal thread to the database
        await originalThread.save();

        revalidatePath(path)
    } catch (err) {
        console.error("Error while adding comment", err);
        throw new Error("Unable to add comment")
    }
}