import query from './rootQueries';
import mutation from './rootMutations';
import userType from './user/types';
import tagType from './tag/types';
import sharedType from './shared/types';
import careerType from './career/types';
import donationType from './donation/types';
import messageType from './message/types';
import organisationType from './organisation/types';

const schema = `
    schema {
        query: Query
        mutation: Mutation
    }
`;

export default `
    ${userType}
    ${tagType}
    ${careerType}
    ${donationType}
    ${messageType}
    ${organisationType}
    ${sharedType}
    ${query}
    ${mutation}
    ${schema}
`;
