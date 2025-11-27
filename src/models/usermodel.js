import mongoose, {Schema} from "mongoose";
import validator from "validator";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: false,
        trim: true,
        minlength: 3,
        maxlength: 50

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
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email address"]
    },
},
     {
    timestamps: true
    }
);
export const User = mongoose.model('User', userSchema); 