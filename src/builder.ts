import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import PrismaUtilsPlugin from "@pothos/plugin-prisma-utils";
import RelayPlugin from "@pothos/plugin-relay";
import { db } from "./db";

import type PrismaTypes from "@pothos/plugin-prisma/generated"  //v.v.imp


import { ByteResolver, DateResolver, DateTimeResolver, JSONResolver } from "graphql-scalars";

export const builder = new SchemaBuilder<{
    PrismaTypes: PrismaTypes;   //v.v.v.imp
    Scalars: {
        DateTime: {
            Output: Date;
            Input: Date;
        },
        Json: {
            Output: any,
            Input: any
        },
        Date: {
            Output: any,
            Input: any
        },
        Bytes: {
            Output: any,
            Input: any
        }
    };
}>({
    plugins: [PrismaPlugin],
    relayOptions: {

        clientMutationId: "omit",
        cursorType: "String"
    },
    prisma: {
        client: db
    }
});



builder.addScalarType('Date', DateResolver, {});
builder.addScalarType('DateTime', DateTimeResolver, {});
builder.addScalarType('Json', JSONResolver, {});
builder.addScalarType('Bytes', ByteResolver,{});
