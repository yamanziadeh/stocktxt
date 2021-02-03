var mongoose = require('mongoose'),
    bcrypt = require("bcryptjs"),
    Schema = mongoose.Schema;

var SALT_FACTOR = 12;

var UserSchema = new Schema({
    phonenumber: { type: String, required: true, index: { unique: true } },
    username: { type: String, required: true },
    password: { type: String, required: true }
});

UserSchema.pre('save', async function save(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(SALT_FACTOR);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (err) {
        return next(err);
    }
});

module.exports = mongoose.model('User', UserSchema);