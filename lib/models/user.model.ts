import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    id:{
        type: String,
        required:true
    },
    username:{
        type: String,
        unique:true,
        required: true
    },
    name:{
        typr: String,
        required: true
    },
    image: String,
    bio: String,
    threads:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Theads"
        }
    ],
    onboarded:{
        type: Boolean,
        default: false
    },
    communities:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Community"
        }
    ]
})

const User = mongoose.models.User || mongoose.model("User", UserSchema);


export default User;