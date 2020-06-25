import userMutations from "./user/mutations"
import tagMutations from "./tag/mutations"
import careerMutations from "./career/mutations"
import messageMutations from "./message/mutations"

import organisationMutations from "./organisation/mutations"
export default `
    type Mutation {
        ${userMutations}
        ${tagMutations}
        ${careerMutations}
        ${messageMutations}
        ${organisationMutations}
    }
`
