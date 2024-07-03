import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { createServer } from "http";

const yoga = createYoga({
    graphqlEndpoint: "/",
    schema
})

const server = createServer(yoga);

const PORT = 3001;

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}/graphql`)
})


