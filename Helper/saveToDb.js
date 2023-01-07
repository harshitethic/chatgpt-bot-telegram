const Group = require("../Model/groups");
const User = require("../Model/user");
const checkAndSave = async (ctx) => {
  console.log(ctx.chat)
  const foundUser = await User.findOne({ userId: ctx.from.id });

  // console.log(ctx.message);

  if (!foundUser) {
    const userObject = {
      userId: ctx.from.id,
      username: ctx.from.username || "",
      name: ctx.from.first_name + (ctx.from.last_name || ""),
      totalQuestionAsked: 0,
      language_code: ctx.from.language_code,

      is_premium_user: ctx.from.is_premium,
    };

    const user = await User.create(userObject);

    await user.save();
  }

  await User.updateOne(
    { userId: ctx.from.id },
    { $inc: { useCount: +1 } }
  );

  if (ctx.chat.type === "group") {
    const foundGroup = await Group.findOne({ groupId: ctx.chat.id });

    const user = await User.findOne({ userId: ctx.from.id });
    
    if (user) {
      const groupObject = {
        groupId: ctx.chat.id,
        title: ctx.chat.title,
      };
      const foundGroup = await user.groups.find(
        (grp) => grp.groupId === ctx.chat.id
      );

      if (!foundGroup) {
        user.groups.push(groupObject);

        await user.save();
      }
    }

    if (!foundGroup) {
      const groupObject = {
        groupId: ctx.chat.id,
        title: ctx.chat.title,
      };

      const group = await Group.create(groupObject);

      group.save();
    }
  }
};

module.exports = checkAndSave;
