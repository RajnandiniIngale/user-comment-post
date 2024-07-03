We use object destructuring to separate the id from the rest of the input fields.
The ...updateData spread syntax creates an object with all the remaining fields from args.input.
Prisma will automatically ignore any undefined fields in the data object, so we don't need to explicitly check for them.

This method is even more concise and achieves the same result: only updating the fields that are provided in the input and preserving the existing values for fields that are not provided.
The key here is that Prisma's update operation is designed to only update the fields that are explicitly provided. If a field is undefined, Prisma will ignore it and not update that field in the database.
This approach is not only more concise but also more flexible. If you add new fields to your Comment model in the future, you won't need to modify this mutation - it will automatically handle any new fields provided in the input.

`builder.relayMutationField("updateComment", {
  inputFields: t => ({
    id: t.int({ required: true }),
    content: t.field({ type: "Json", required: false }),
    authorId: t.int({ required: false }),
    postId: t.int({ required: false })
  })
},
{
  resolve: async (_, args) => {
    const { id, ...updateData } = args.input;

    const result = await db.comment.update({
      where: { id },
      data: updateData
    });

    console.log("Comment updated: ", result);
    return { status: true, id: result.id };
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
});
`