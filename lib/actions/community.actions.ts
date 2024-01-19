"use server";

import { FilterQuery, SortOrder } from "mongoose";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";

export async function createCommunity (
    id: string,
    name: string,
    username: string,
    image: string,
    bio: string,
    createdById: string
){


    try {
        connectToDB();

        //Find the userwith the provided Id
        const user = await User.findOne({id: createdById});

        if(!user) throw new Error("User not found");


        const newCommunity = new Community({
            id,
            name,
            username,
            image,
            bio,
            createdById: user._id
        });

        const createdCommunity = await newCommunity.save();

        //update user model

        user.communities.push(createdCommunity._id);

        await user.save();

        return createCommunity

    } catch (error) {
        console.error("Error creating community", error)
        throw error
    }
}

export async function fetchCommunityDetails(id: string){
    try {
        connectToDB();

        const communityDetails  = await Community.findOne({id}).populate([
            "createdBy",
            {
                path: "members",
                model: User,
                select: "name username image id _id"
            }
        ])

        return communityDetails

    } catch (error) {
        console.error("Error fetching community detail");
        throw error
    }
}

export async function fetchCommunityPosts(id: string){
    try {
        connectToDB();

        const communityPosts = await Community.findById(id).populate({
            path: "threads",
            model: Thread,
            populate: [
               {
                path: "author",
                model: User,
                select: "name image id"
               },
               {
                path: "children",
                model: Thread,
                populate: {
                    path: "author",
                    model: User,
                    select: "image _id"
                }
               }
            ]
        })

        return communityPosts

    } catch (error) {
        console.error("Error fetching community posts:", error)
        throw error
    }
}
export async function fetchCommunities({
    searchString = "",
    pageNumber = 1,
    pageSize= 20,
    sortBy = "desc"
}:{
    searchString?: string,
    pageNumber?: number,
    pageSize?: number,
    sortBy?: SortOrder
}){
    try {
        //Calculate the number of communties to skip based on the page number and page size
        const skipAmount = (pageNumber - 1) * pageSize;

        //Create a case-insensitive regular expression for the provided search string
        const regex = new RegExp(searchString, 'i');

        //Create an initial query object to filter communities
        const query: FilterQuery<typeof Community> = {}

        //If the search string is not empty, add the $or operator
        //to match either username or name fields
        if (searchString.trim() !== "") {
            query.$or = [
                {username: {$regex: regex}},
                {name: {$regex: regex}}
            ]
        }

        //Define the sort options for the fetched communites based
        // on created field and provide sort order
        const sortOptions = {createdAt: sortBy};

        //create a query to fetch the communities based on the search and sort criteria
        const communitiesQuery = Community.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize)
            .populate("members");

        //count the total number of communities that match the search criteria (withut pagination)
        const totalCommunitiesCount = await Community.countDocuments(query);

        const communities = await communitiesQuery.exec()

        //Check if there are more communities beyond the current page
        const isNext = totalCommunitiesCount > skipAmount + communities.length;

        return {communities, isNext}
        
    } catch (error) {
        console.error("Error fetching community", error)
        throw error 
    }
}
export async function addMemberToCommunity(
    communityId: string,
    memberId: string
){
    try {
        connectToDB();

        //Find the communty by its unique id
        const community = await Community.findOne({id: communityId});

        if(!community) throw new Error("Community not found");

        //Find the user by their unique Id
        const user = await User.findOne({id: memberId});

        if(!user) throw new Error("User not found");

        //Check if the user is alredya member of the community
        if(community.members.includes(user._id)) {
            throw new Error("User is alredy a member of the community");  
        }

        //Add the user's _id to the members array in the community
        community.members.push(user._id)
        await community.save();

        //Add the community's _id the communities array in the user
        user.communities.push(community._id)
        await user.save();

        return community;
        
    } catch (error) {
        console.error("Error adding member to community");
        throw error
    }
}

export async function removeUserFromCommunity(
    userId: string,
    communityId: string
){
    connectToDB();

    try {
        
        const userIdObject =  await User.findOne({id: userId},{_id: 1});
        const communityIdObject = await Community.findOne(
            {id: communityId},
            {_id: 1}
        );

        if (!userIdObject) {
            throw new Error("User not found")
        }

        if(!communityIdObject){
            throw new Error("Community not found")
        }

        //Remove the user's Id from the member array in the community
        await Community.updateOne(
            {_id: communityIdObject._id},
            {$pull: {members: userIdObject._id}}
        )

        //Reove the community's _id from the communities array in the user
        await User.updateOne(
            {_id: userIdObject._id},
            {$pull: {communities: communityIdObject._id}}
        )

        return {success:true}

    } catch (error) {
        console.error("Error removing user from community", error)
        throw error
    }
}

export async function updateCommunityInfo(
    communityId: string,
    name: string,
    username: string,
    image: string
){
    try {
        connectToDB();

        //Find the community bt its Id and update the info
        const updatedCommunity = await Community.findOneAndUpdate(
            {_id: communityId},
            {name, username, image}
        )
        if (!updatedCommunity) {
            throw new Error("Community not found")
        }

        return updatedCommunity;

    } catch (error) {
        console.error("Error updatng community information", error);
        throw error
    }
}

export async function deleteCommunity(
    communityId: string,
){
    try {
        connectToDB();

        //Find the community bt its Id and delete the info
        const deletedCommunity = await Community.findOneAndDelete(
            {_id: communityId},
        )
        if (!deletedCommunity) {
            throw new Error("Community not found")
        }
        //Delete all threads associated with the community
        await Thread.deleteMany({ community: communityId});

        //Find all users who are part of the community
        const communityUsers = await User.find({communities: communityId});

        //Remove the community from the communities array for each user
        const updateUserPromeses = communityUsers.map((user) =>{
            user.communties.pull(communityId)
            return user.save();
        })
        await Promise.all(updateUserPromeses)

        return deletedCommunity;
        
    } catch (error) {
        console.error("Error deleting community", error);
        throw error
    }
}