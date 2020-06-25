import _ from "lodash"
import typeResolvers from "./types.resolvers"
import queryResolvers from "./queries.resolvers"
import mutationResolvers from "./mutations.resolvers"

var resolvers = {}

_.merge(
  resolvers,
  typeResolvers,
  { Query: queryResolvers },
  { Mutation: mutationResolvers }
)

export default resolvers
