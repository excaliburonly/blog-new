const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { UserInputError } = require("apollo-server")

const {
  validateRegisterInput,
  validaterLoginInput,
} = require("./../../util/validators")
const User = require("./../../models/User")

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    "SaumyaShome"
  )
}

module.exports = {
  Mutation: {
    async login(_, { username, password }) {
      const { errors, valid } = validaterLoginInput(username, password)
      if (!valid) {
        throw new UserInputError("Errors", { errors })
      }
      const user = await User.findOne({ username })
      if (!user) {
        errors.general = "User not found"
        throw new UserInputError("User not found", { errors })
      }

      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        errors.general = "Wrong Credentials"
        throw new UserInputError("Wrong Credentials", { errors })
      }

      const token = generateToken(user)

      return {
        ...user._doc,
        id: user._id,
        token,
      }
    },
    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } },
      context,
      info
    ) {
      // Validate User data
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      )
      if (!valid) {
        throw new UserInputError("Errors", { errors })
      }
      // TODO! Make sure user doesnt already exist
      const user = await User.findOne({ username })
      if (user) {
        throw new UserInputError("Username is taker", {
          errors: {
            username: "This username is taken",
          },
        })
      }

      // Hash password and create an auth token
      password = await bcrypt.hash(password, 10)

      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString(),
      })

      const res = await newUser.save()

      const token = generateToken(res)

      return {
        ...res._doc,
        id: res._id,
        token,
      }
    },
  },
}
