import userQueries from "./user/queries"
import tagQueries from "./tag/queries"
import careerQueries from "./career/queries"
import donationQueries from "./donation/queries"
import messageQueries from "./message/queries"
import organisationQueries from "./organisation/queries"
export default `
    type Query {
        ${userQueries}
        ${tagQueries}
        ${careerQueries}
        ${donationQueries}
        ${messageQueries}
        ${organisationQueries}
    }
`
