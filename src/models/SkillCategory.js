import mongoose from "mongoose";

const SkillCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    skills: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
        },
    ],
});

export default mongoose.models.SkillCategory ||
    mongoose.model("SkillCategory", SkillCategorySchema);
