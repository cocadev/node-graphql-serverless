import { RESTDataSource } from "apollo-datasource-rest"
import algoliasearch from "algoliasearch"

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_SEARCH_KEY
)
const index_name_in_algolia =
  process.env.SERVERLESS_STAGE === "production"
    ? "production-users"
    : process.env.IS_OFFLINE
    ? "staging-users" //'local-users'
    : "staging-users"

class AlgoliaUsersClass extends RESTDataSource {
  constructor() {
    super()
  }

  async searchUsers(
    query = "",
    filters = "",
    facetFilters = [],
    attributesToRetrieve = [],
    facets = "",
    hitsPerPage = 50,
    page = 0,
    sortByType = ""
  ) {
    try {
      var index = client.initIndex(index_name_in_algolia + sortByType)
      return new Promise((resolve, reject) => {
        index.search(
          {
            // pass arguments here
            query: query,
            filters: filters,
            facetFilters: facetFilters,
            // pass query attributes here
            attributesToRetrieve: attributesToRetrieve,
            facets: facets,
            //pagination
            hitsPerPage: hitsPerPage,
            page: page
          },
          (err, content) => {
            if (err) {
              console.log("searchUsers.err", err)
              reject(err)
            }
            // console.log('content.hits', content.hits);
            if (content && content.hits) {
              for (let i = 0; i < content.hits.length; i++) {
                try {
                  content.hits[i].id = content.hits[i].objectID
                } catch (error) {
                  reject(error)
                }
              }
            }
            resolve(content)
          }
        )
      })
    } catch (error) {
      console.error("searchUsers", error)
      return new Promise((resolve, reject) => {
        reject()
      })
    }
  }
}

export default new AlgoliaUsersClass()
