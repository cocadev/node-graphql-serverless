export default `
      
    createTag(
        text: String!
    ): DefaultPayloadType
        
    deleteTagByAdmin(
        id: String!
    ): DefaultPayloadType

    mergeTagsByAdmin(
        tagsToMerge: [TagInputType]!, 
        newTagText: String!
    ): DefaultPayloadType

`
