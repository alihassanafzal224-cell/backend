import mongoose, { Schema } from "mongoose";
import validator from "validator";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
        index: true,

    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email address"]
    },
    balance: {
        type: Number,
        required: true,
        default: 400
    },
    followers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: [],
    },

    following: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: [],
    },

},

    { timestamps: true }
);

export const User = mongoose.model('User', userSchema); 