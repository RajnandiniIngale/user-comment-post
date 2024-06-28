import { table } from "console";
import { builder } from "./builder";

import { db } from "./db";
import { Prisma } from "@prisma/client";


builder.prismaObject("User", {
    fields: t => ({
        id: t.exposeID("id"),
        name: t.exposeString("name"),
        email: t.exposeString("email"),
        bio: t.exposeString("bio", {
            nullable: true
        }),
        birthDate: t.expose("birthDate", {
            nullable: true,
            type: 'Date'
        }),
        isActive: t.exposeBoolean("isActive", {
            nullable: true
        }),
        address: t.expose("address", {
            nullable: true,
            type: "Json"
        }),
        profilePic: t.expose("profilePic", {
            nullable: true,
            type: "Bytes"
        }),
        posts: t.relation("posts"),
        comments: t.relation("comments"),
        createdAt: t.expose("createdAt", {
            type: "DateTime"
        }),
        updatedAt: t.expose("updatedAt", {
            type: "DateTime"
        })
    })
})


builder.prismaObject("Post", {
    fields: t => ({
        id: t.exposeID("id"),
        title: t.exposeString("title"),
        content: t.expose("content", {
            type: "Json",
            nullable: true
        }),
        upvotes: t.exposeInt("upvotes"),
        publishedAt: t.expose("publishedAt", {
            type: "Date",
            nullable: true
        }),
        tags: t.exposeStringList("tags"),
        authorId: t.exposeInt("authorId"),
        createdAt: t.expose("createdAt", {
            type: "DateTime"
        }),
        updatedAt: t.expose("updatedAt", {
            type: "DateTime"
        }),
        author: t.relation("author"),
        comment: t.relation("comment")
    })
})


builder.prismaObject("Comment", {
    fields: t => ({
        id: t.exposeID("id"),
        content: t.exposeString("content", {
            nullable: true
        }),
        postId: t.exposeInt("postId"),
        authorId: t.exposeInt("authorId"),
        createdAt: t.expose("createdAt", {
            type: "DateTime"
        }),
        updatedAt: t.expose("updatedAt", {
            type: "DateTime"
        }),
        author: t.relation("author"),
        post: t.relation("post")
    })
})


builder.queryType({
    fields: t => ({

        getAllUsers: t.prismaConnection({
            type: "User",
            cursor: "id",
            resolve: async (query, _root, args) => db.user.findMany({
                ...query
            })

        }),

        getUser: t.prismaField({
            type: "User",
            nullable: true,
            args: {
                id: t.arg.id({ required: true })
            },
            resolve: async (query, _root, args) => db.user.findUnique({
                ...query,
                where: {
                    id: Number(args.id)
                }
            })
        }),

        getAllPosts: t.prismaConnection({
            type: "Post",
            cursor: "id",
            resolve: async (query, _root, args) => db.post.findMany({
                ...query
            })
        }),

        getPost: t.prismaField({
            type: "Post",
            nullable: true,
            args: {
                id: t.arg.id({ required: true })
            },
            resolve: async (query, _root, args) => db.post.findUnique({
                ...query,
                where: {
                    id: Number(args.id)
                }
            })
        }),

        getAllComments: t.prismaConnection({
            type: "Comment",
            cursor: "id",
            resolve: async (query, _root, args) => db.comment.findMany({
                ...query
            })
        }),

        getComment: t.prismaField({
            type: "Comment",
            nullable: true,
            args: {
                id: t.arg.id({ required: true })
            },
            resolve: async (query, _root, args) => db.comment.findUnique({
                ...query,
                where: {
                    id: Number(t.arg.id)
                }
            })
        }),


        getCommentByAuthorId: t.prismaConnection({
            type: "Comment",
            nullable: true,
            cursor: "id",
            args: {
                authorId: t.arg.int({ required: true })
            },
            resolve: async (query, _root, args) => db.comment.findMany({
                ...query,
                where: {
                    authorId: args.authorId
                }
            })
        }),


        getCommentByPostId: t.prismaConnection({
            type: "Comment",
            nullable: true,
            cursor: "id",
            args: {
                postId: t.arg.int({ required: true })
            },
            resolve: async (query, _root, args) => db.comment.findMany({
                ...query,
                where: {
                    postId: args.postId
                }
            })
        }),


        getInActiveUsers: t.prismaConnection({
            type: "User",
            nullable: true,
            cursor: "id",
            resolve: async (query, _root, args) => db.user.findMany({
                where: {
                    isActive: false
                }
            })

        }),


        getPostWithMaxUpvotes: t.prismaField({
            type: "Post",
            nullable: true,
            resolve: async (query, _root, args) => {
                const [postWithMaxUpvotes] = await db.post.findMany({
                    ...query,
                    orderBy: {
                        upvotes: 'desc'
                    },
                    take: 1
                })

                return postWithMaxUpvotes;
            }
        }),


        getMultiplePostsWithMaxUpvotes: t.prismaField({
            type: ["Post"],   //return list of posts ... this is accepted here beacuse of prismaField
            nullable: true,
            resolve: async (query, _root, args) => {

                // Find the maximum number of upvotes
                const maxUpvotes = await db.post.aggregate({
                    _max: {
                        upvotes: true
                    }
                });

                const maxUpvotesCount = maxUpvotes._max.upvotes;

                console.log("maxUpvotesCount: ", maxUpvotesCount);

                if (maxUpvotes === null) {
                    return null;    //No posts found
                }

                // Retrieve all posts with the maximum number of upvotes
                const postsWithMaxUpvotes = await db.post.findMany({
                    ...query,
                    where: {

                        upvotes: Number(maxUpvotesCount)
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }

                })

                return postsWithMaxUpvotes;
            }
        }),


        getAllPostsPublishedAfter: t.prismaConnection({
            type: "Post",
            cursor: "id",
            args: {
                publishedAfter: t.arg.string({required: true})
            },
            resolve: async(query,_root,args) => {
                
                const publishedAfterDate = new Date(args.publishedAfter);
                publishedAfterDate.setUTCHours(0,0,0,0);

                return db.post.findMany({
                    ...query,
                    where: {
                        publishedAt: {
                            gte: publishedAfterDate
                        }
                    }
                })
            } 
        }),


        getUsersCreatedToday: t.prismaConnection({
            type: "User",
            cursor: "id",
            resolve: async(query,_root,args) => {

                const today = new Date();

                const startOfToday = new Date(today.setUTCHours(0,0,0,0));

                const endOfToday = new Date(today.setUTCHours(0,0,0,0));


                return db.user.findMany({
                    ...query,
                    where: {
                        createdAt: {
                            gte: startOfToday,
                            lte: endOfToday
                        }
                    }
                })
            }
        }),


        getUserByEmail: t.prismaField({
            type: "User",
            nullable: true,
            args: {
                email: t.arg.string({required: true})
            },
            resolve: async(query,_root,args) => db.user.findUnique({
                ...query,
                where: {
                    email: args.email
                }
            })
        }),


        getUsersCreatedAfter: t.prismaConnection({
            type: "User",
            nullable: true,
            cursor: "id",
            args: {
               createdAfter: t.arg.string({required: true})
            },
            resolve: async(query,_root,args) => {
                
                const usersCreatedAfter = new Date(args.createdAfter);

                usersCreatedAfter.setUTCHours(0,0,0,0);

                return db.user.findMany({
                    ...query,

                })
            }
        })
    }),


    
})