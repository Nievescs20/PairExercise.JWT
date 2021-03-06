const jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");
const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

const SECRET_KEY = "sharpie_pen";

User.byToken = async (token) => {
  try {
    console.log("TESTING", token);
    const userData = await jwt.verify(token, SECRET_KEY);
    console.log("USER DATA----->", userData);

    const user = await User.findByPk(userData.userId);
    if (user) {
      // console.log("USER DATA--->", userdata);
      // console.log("XXXXXXXXXX", user);
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
      password,
    },
  });
  if (user) {
    // console.log("XX<--FOUND USER-->XX", user);
    const token = jwt.sign({ userId: user.id }, SECRET_KEY);
    // console.log(token);
    return token;
  } else {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
