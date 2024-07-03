import { builder } from "./builder";

import { db } from "./db";


builder.prismaObject("User", {
    fields: t => ({
        id: t.exposeID("id"),
        name: t.exposeString("name", { nullable: true }),
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
        title: t.exposeString("title", { nullable: true }),
        content: t.expose("content", {
            type: "Json",
            nullable: true
        }),
        upvotes: t.exposeInt("upvotes", { nullable: true }),
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
                publishedAfter: t.arg.string({ required: true })
            },
            resolve: async (query, _root, args) => {

                const publishedAfterDate = new Date(args.publishedAfter);
                publishedAfterDate.setUTCHours(0, 0, 0, 0);

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
            resolve: async (query, _root, args) => {

                const today = new Date();

                const startOfToday = new Date(today.setUTCHours(0, 0, 0, 0));

                const endOfToday = new Date(today.setUTCHours(0, 0, 0, 0));


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
                email: t.arg.string({ required: true })
            },
            resolve: async (query, _root, args) => db.user.findUnique({
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
                createdAfter: t.arg.string({ required: true })
            },
            resolve: async (query, _root, args) => {

                const usersCreatedAfter = new Date(args.createdAfter);

                usersCreatedAfter.setUTCHours(0, 0, 0, 0);

                return db.user.findMany({
                    ...query,

                    where: {
                        createdAt: {
                            gte: usersCreatedAfter
                        }
                    }
                })
            }
        }),


        getUsersWithBio: t.prismaConnection({
            type: "User",
            cursor: "id",
            nullable: true,
            args: {
                bioContent: t.arg.string({ required: true })
            },
            resolve: async (query, _root, args) => {

                return db.user.findMany({
                    ...query,
                    where: {
                        bio: {
                            contains: args.bioContent
                        }
                    }
                })
            }
        }),


        getUsersByBirthDateRange: t.prismaConnection({
            type: "User",
            nullable: true,
            cursor: "id",
            args: {
                startDateArg: t.arg.string({ required: true }),
                endDateArg: t.arg.string({ required: true })
            },

            resolve: async (query, _root, args) => {

                const startDate = new Date(args.startDateArg);
                const endDate = new Date(args.endDateArg);

                startDate.setUTCHours(0, 0, 0, 0);
                endDate.setUTCHours(23, 59, 59, 999);

                return db.user.findMany({
                    ...query,
                    where: {
                        birthDate: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                })

            }
        }),


        getPostsWithMinUpvotes: t.prismaConnection({
            type: "Post",
            cursor: "id",
            nullable: true,
            args: {
                minUpvotes: t.arg.int({ required: true })
            },
            resolve: async (query, _root, args) => db.post.findMany({
                ...query,
                where: {
                    upvotes: {
                        gte: args.minUpvotes
                    }
                }
            })

        }),


        getPostsWithSpecificTag: t.prismaConnection({
            type: "Post",
            nullable: true,
            cursor: "id",
            args: {
                tag: t.arg.string({ required: true })
            },
            resolve: async (query, _root, args) => db.post.findMany({
                ...query,
                where: {
                    tags: {
                        has: args.tag
                    }
                }
            })
        }),


        getUsersWithProfilePics: t.prismaConnection({
            type: "User",
            cursor: "id",
            resolve: async (query, _root, args) => db.user.findMany({
                ...query,
                where: {
                    NOT: {
                        profilePic: null
                    }
                }
            })
        }),


        //Get users who have posted in the last N days
        getRecentlyActiveUsers: t.prismaConnection({
            type: "User",
            cursor: "id",
            nullable: true,
            args: {
                noOfDays: t.arg.int({ required: true })
            },
            resolve: async (query, _root, args) => {

                const dateThreshold = new Date();
                dateThreshold.setDate(dateThreshold.getDate() - args.noOfDays);


                return db.user.findMany({
                    ...query,
                    where: {
                        createdAt: {
                            gte: dateThreshold
                        }
                    }
                })
            }
        })


    }),
}),


    builder.relayMutationField("addNewUser",
        {
            inputFields: (t) => ({

                name: t.string({ required: true }),
                email: t.string({ required: true }),
                bio: t.string({ required: false }),
                birthDate: t.field({
                    type: "Date",
                    required: false
                }),
                isActive: t.boolean({ required: false }),
                profilePic: t.field({
                    type: "Bytes",
                    required: false
                }),
                address: t.field({
                    type: "Json",
                    required: false
                }),
                password: t.string({ required: true })
            })
        },
        {
            resolve: async (_, args) => {

                const result = await db.user.create({
                    data: {
                        name: args.input.name,
                        email: args.input.email,
                        bio: args.input.bio,
                        birthDate: args.input.birthDate,
                        password: args.input.password,
                        isActive: args.input.isActive,
                        profilePic: args.input.profilePic,
                        address: args.input.address
                    }
                })

                console.log("User created: ", result);

                return { status: true, id: result.id }
            }
        },
        {
            outputFields: (t) => ({

                success: t.boolean({
                    resolve: (res) => res.status
                }),
                id: t.int({
                    resolve: (res) => res.id
                })
            })
        }),


    builder.relayMutationField("addNewPost",
        {
            inputFields: (t) => ({
                title: t.string({ required: true }),
                content: t.field({
                    type: "Json",
                    required: false
                }),
                tags: t.stringList({
                    required: false
                }),
                upvotes: t.int({
                    required: false
                }),
                publishedAt: t.field({
                    type: "DateTime",
                    required: false
                }),
                authorId: t.int({ required: true }),

            })
        },
        {
            resolve: async (_, args) => {

                const result = await db.post.create({


                    data: {
                        title: args.input.title,
                        content: args.input.content,
                        upvotes: Number(args.input.upvotes),
                        publishedAt: args.input.publishedAt,
                        authorId: args.input.authorId,
                        tags: args.input.tags || []
                    }
                })

                console.log("Post created :", result);

                return { status: true, id: result.id }
            }
        },
        {
            outputFields: (t) => ({

                success: t.boolean({
                    resolve: (res) => res.status
                }),

                id: t.int({
                    resolve: (res) => res.id
                })
            })
        }),


    builder.relayMutationField("addNewComment",
        {
            inputFields: (t) => ({
                content: t.string({ required: false }),
                postId: t.int({ required: true }),
                authorId: t.int({ required: true })
            })
        },
        {
            resolve: async (_, args) => {
                const result = await db.comment.create({
                    data: {
                        content: args.input.content,
                        postId: args.input.postId,
                        authorId: args.input.authorId
                    }
                })

                console.log("Comment added: ", result);

                return { status: true, id: result.id };
            }
        },
        {
            outputFields: (t) => ({
                success: t.boolean({
                    resolve: (result) => result.status
                }),

                id: t.int({
                    resolve: (result) => result.id
                })
            })
        })




builder.relayMutationField("deleteUserById",
    {
        inputFields: (t) => ({
            id: t.int({ required: true })
        })
    },
    {
        resolve: async (_, args) => {
            const result = await db.user.delete({
                where: {
                    id: args.input.id
                }
            })

            console.log("Deleted User: ", result)

            return { status: true }
        }
    },
    {
        outputFields: (t) => ({

            success: t.boolean({
                resolve: (result) => result.status
            })
        })
    }),


    builder.relayMutationField("deletePostById",
        {
            inputFields: (t) => ({
                id: t.int({ required: true })
            })
        },
        {
            resolve: async (_, args) => {
                const result = await db.post.delete({
                    where: {
                        id: args.input.id
                    }
                })

                console.log("Deleted post :", result);

                return { status: true }
            }
        },
        {
            outputFields: (t) => ({
                success: t.boolean({
                    resolve: (result) => result.status
                })
            })
        }),


    builder.relayMutationField("deleteCommentById",
        {
            inputFields: (t) => ({
                id: t.int({ required: true })
            })
        },
        {
            resolve: async (_, args) => {

                const result = await db.post.delete({
                    where: {
                        id: args.input.id
                    }
                })

                console.log("Deleted Comment: ", result);

                return { status: true }
            }
        },
        {
            outputFields: (t) => ({
                success: t.boolean({
                    resolve: (result) => result.status
                })
            })
        }),


    builder.relayMutationField("deleteCommentsByAuthorId",
        {
            inputFields: (t) => ({
                authorId: t.int({ required: true })
            })
        },
        {
            resolve: async (_, args) => {

                const result = await db.comment.deleteMany({
                    where: {
                        authorId: args.input.authorId
                    }
                })

                //Prisma's delete operation requires a unique identifier for the record to be deleted. In your Comment model, authorId is not a unique field, so we can't use it directly in a delete operation.
                //To resolve this, we need to change our approach. Instead of deleting a single comment, we'll delete all comments by a specific author.
                console.log("Deleted Comment: ", result);

                return { status: true }
            }

        },
        {
            outputFields: (t) => ({
                success: t.boolean({
                    resolve: (result) => result.status
                })
            })
        }),


    builder.relayMutationField("deleteCommentsByPostId",
        {
            inputFields: (t) => ({
                postId: t.int({ required: true })
            })
        },
        {
            resolve: async (_, args) => {
                const result = await db.comment.deleteMany({
                    where: {
                        postId: args.input.postId
                    }
                })

                console.log("Comments deleted: ", result);

                return { status: true }
            }
        },
        {
            outputFields: (t) => ({

                success: t.boolean({
                    resolve: (result) => result.status
                })
            })
        }),


    builder.relayMutationField("deletePostsByAuthorId",
        {
            inputFields: (t) => ({
                authorId: t.int({ required: true })
            })
        },
        {
            resolve: async (_, args) => {
                const result = await db.post.deleteMany({
                    where: {
                        authorId: args.input.authorId
                    }
                })

                console.log("Posts deleted: ", result);

                return { status: true }
            }
        },
        {
            outputFields: (t) => ({

                success: t.boolean({
                    resolve: (result) => result.status
                })
            })
        }),


    // builder.relayMutationFid("updateUser", {
    //     inputFields: (t) => ({
    //       id: t.int({ required: true }),
    //       name: t.string({ required: false }), // Make name field optional
    //       email: t.string({ required: false }),
    //       bio: t.string({ required: false }),
    //       birthDate: t.field({ type: "Date", required: false }),
    //       isActive: t.boolean({ required: false }),
    //       address: t.field({ type: "Json", required: false }),
    //       profilePic: t.field({ type: "Bytes", required: false }),
    //     }),
    // },
    // {
    //     resolve: async (_, args) => {

    //         const { id, name, email } = args.input;

    //         const updateData: any = {};
    // if (name !== null) updateData.name = name;
    // if (email !== null) updateData.email = email;
    //       const result = await db.user.update({
    //         where: { id: args.input.id },
    //         data: updateData
    //       });
    //       return result;
    //     }
    //     },{
    //     outputFields: (t) => ({}),
    //   }),

    builder.relayMutationField("updatePost",
        {
            inputFields: t => ({
                id: t.int({ required: true }),
                title: t.string({ required: false }),
                content: t.field({
                    type: "Json",
                    required: false
                }),
                tags: t.stringList({
                    required: false
                }),
                upvotes: t.int({
                    required: false,
                }),
                publishedAt: t.field({
                    type: "Date",
                    required: false
                }),
                authorId: t.int({ required: false })
            })
        },
        {
            resolve: async (_, args) => {
                const result = await db.post.update({
                    where: {
                        id: args.input.id
                    },
                    data: {
                        title: args.input.title,
                        content: args.input.content,
                        tags: args.input.tags || [],
                        upvotes: args.input.upvotes,
                        publishedAt: args.input.publishedAt,
                        authorId: args.input.authorId || undefined
                    }
                })


                console.log("Updated Post : ", result);

                return { status: true, id: result.id }
            }
        },
        {
            outputFields: t => ({
                success: t.boolean({
                    resolve: (result) => result.status
                }),

                id: t.int({
                    resolve: (result) => result.id
                })
            })
        }),


    builder.relayMutationField("updateComment",
        {
            inputFields: t => ({
                id: t.int({ required: true }),
                content: t.field({
                    type: "Json",
                    required: false
                }),
                authorId: t.int({ required: false }),
                postId: t.int({ required: false })
            })
        },
        {
            resolve: async (_, args) => {
                const result = await db.comment.update({
                    where: {
                        id: args.input.id
                    },
                    data: {
                        content: args.input.content,
                        authorId: args.input.authorId || undefined,
                        postId: args.input.postId || undefined
                    }
                })


                console.log("Comment updated: ", result);

                return { status: true, id: result.id }
            }
        },
        {
            outputFields: t => ({

                success: t.boolean({
                    resolve: (result) => result.status
                }),

                id: t.int({
                    resolve: (result) => result.id
                })
            })
        })

builder.mutationType({
    fields: t => ({})
})


export const schema = builder.toSchema();



//builder.mutationType({}) and builder.queryType({})