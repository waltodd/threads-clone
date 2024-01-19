"use client"

import {FilterQuery, SortOrder} from 'mongoose'
import { revalidatePath } from 'next/cache'


import Community from '../models/community.model'
import Thread from '../models/thread.model'
import User from '../models/user.model'

import { connectToDB } from '../mongoose'

export async function fetchUser(userId: string){
    try {
        connectToDB();
        return await User.findOne({id: userId}).populate({
            path: "communities",
            model: Community,
        });
    } catch (error:any) {
        throw new Error(`Failed to fetch user: ${error.message}`)
    }
}

interface Params {
    userId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
    path: string
}

export async function updateUser({
    userId,
    username,
    name,
    bio,
    image,
    path
}: Params): Promise<void>{
    connectToDB();

    await User.findOneAndUpdate(
        {id: userId},
        {
            username: username.toLowerCase(),
            name,
            bio,
            image,
            onboarded: true
        },
        {
            upsert: true
        }
    );

    if(path === "/profile/edit"){
        revalidatePath(path);
    }
}

export async function fetchUserPosts(userId: string){

    try {
        connectToDB();
        //Find all threads authored by the user with the given userId
        const threads = await User.findOne({id: userId}).populate({
            path: "threads",
            model: Thread,
            populate:[
                {
                    path: "community",
                    model: Community,
                    select: "name id image >id"
                },
                {
                    path: "children",
                    model: Thread,
                    populate:{
                        path: "author",
                        model : User,
                        select: "name image id"
                    }
                }
            ]
        })

        return threads;
        
    } catch (error: any) {
        console.error(`Error fetching user threads`);
        throw error
    }
}
//Almost similar to Thread (search + pagination) and 
// Community (search + pagination)

export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc"
}:{
    userId: string,
    searchString?: string,
    pageNumber?: number,
    pageSize?: number,
    sortBy?: SortOrder
}){
    try {
        connectToDB()


        //calculate the number of uers to skip based on the page number and page size
        const skipAmount = (pageNumber - 1 ) * pageSize;

        //Create a case-insensitive regular expression for the provided search string

        const regex = new RegExp(searchString, 'i');

        //create an initial query to filter users
        const query: FilterQuery<typeof User> = {
            id: { $ne: userId}
        }

        //if the search string in not empty, add the $or operator to match either username
        //or name fields

        if (searchString.trim() !== "") {
            query.$or = [
                {username: {$regex: regex}},
                {name: {$regex: regex}}
            ]
        }

        //Define the sort options for the fetched users based on createAt field and provided sort order
        const sortOptions = {createAt: sortBy};

        const usersQuery = User.find(query).
            sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize)

            //Count the total number of users that match the search criteria(without pagination)
            const totalUsersCount =  await User.countDocuments(query);

            const users = await usersQuery.exec()

            //check if there are more users beyond the current page
            const isNext = totalUsersCount > skipAmount + users.length;

            return {users, isNext}

    } catch (error) {
        console.error("Error fetching users:", error)
        throw error;
    }
}

export async function getActivity(userId: string){
    try {
        connectToDB()

        //Find all threads create by the user
        const userThreads = await Thread.find({author: userId});

        //collect all child threads  ids (replies) from the children field of each user thread
        const childrenThreads = userThreads.reduce((acc, userThread) =>{
            return acc.concat(userThread.children);
        },[]);

        //Find and return the child threads (replies) excluding the ones created by the
        //same user
        const replies = await Thread.find({
            _id: {$in: childrenThreads},
            author: {$ne: userId},
        }).populate({
            path: "author",
            model: User,
            select: "name image _id"
        })

        return replies

    }catch(error){
        console.log("Error fetching replies", error)
        throw error
    }
}

