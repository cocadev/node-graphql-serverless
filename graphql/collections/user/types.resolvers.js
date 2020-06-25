export default {
  // User:{
  //   queue_status: async ({approved,accountCreatedOn }) => {
  //     console.log("accountCreatedOn: "+accountCreatedOn);
  //     //const user = await User.get({ id: args.id });
  //     if(approved || !accountCreatedOn ) return null;
  //     var jsonObject =  JSON.parse(accountCreatedOn);
  //     accountCreatedOn = typeof jsonObject == 'object' ? jsonObject.N : accountCreatedOn;
  //     return await User.scan()
  //     .filter("approved")
  //     .not()
  //     .eq(true)
  //     .and()
  //     .filter("accountCreatedOn")
  //     .le(accountCreatedOn)
  //     .count()
  //     .exec();
  //   }
  // },
}
