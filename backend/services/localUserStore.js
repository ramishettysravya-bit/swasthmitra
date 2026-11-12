const { randomUUID } = require('crypto');

const users = new Map();

const toPublicUser = (user) => ({
  ...user,
  id: user._id,
});

const findByEmail = (email) => {
  for (const user of users.values()) {
    if (user.email === email) return toPublicUser(user);
  }
  return null;
};

const findById = (id) => {
  const user = users.get(id);
  return user ? toPublicUser(user) : null;
};

const create = ({ email, password, name }) => {
  const user = {
    _id: randomUUID(),
    email,
    password,
    name,
    conditions: [],
    riskScore: 0,
  };
  users.set(user._id, user);
  return toPublicUser(user);
};

const update = (id, data) => {
  const user = users.get(id);
  if (!user) return null;
  Object.assign(user, data);
  return toPublicUser(user);
};

module.exports = {
  findByEmail,
  findById,
  create,
  update,
};
