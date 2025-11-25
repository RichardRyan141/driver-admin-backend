const crypto = require("crypto");

// IMPORTANT: use an environment variable in production
const SALT = process.env.PASSWORD_SALT || "STATIC_SALT_CHANGE_ME";

exports.hashPassword = async (plain) => {
  return crypto
    .createHash("sha256")
    .update(plain + SALT)
    .digest("hex");
};

exports.comparePassword = async (plain, storedHash) => {
  const hashed = crypto
    .createHash("sha256")
    .update(plain + SALT)
    .digest("hex");

  return hashed === storedHash;
};
