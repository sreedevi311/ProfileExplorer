import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ---- MongoDB connection ----
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ---- Cloudinary config ----
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---- Multer setup for memory storage ----
const upload = multer({ storage: multer.memoryStorage() });

// ---- Profile schema ----
const profileSchema = new mongoose.Schema({
  profilePicture: String,
  fullName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true },
  passwordHash: String,
  phoneNumber: { type: String, unique: true, sparse: true },
  aboutMe: String,
  location: String,
}, { timestamps: true });

const Profile = mongoose.model("Profile", profileSchema);

// ---- Helper: sanitize profile ----
function sanitizeProfile(profile) {
  if (!profile) return null;
  const obj = profile.toObject ? profile.toObject() : profile;
  delete obj.passwordHash;
  return obj;
}

// ---- Cloudinary upload route ----
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const result = await cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) throw error;
        res.json({ url: result.secure_url });
      }
    ).end(req.file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ---- Signup ----
app.post("/signup", async (req, res) => {
  try {
    const { fullName, password, emailOrPhone, emailMode, profilePicture, about, location } = req.body;
    if (!fullName?.trim() || !password?.trim() || !emailOrPhone?.trim()) {
      return res.status(400).json({ message: "Full name, email/phone, and password are required" });
    }

    const newProfile = { fullName: fullName.trim(), passwordHash: await bcrypt.hash(password, 10) };

    if (emailMode === "true" || emailMode === true) {
      const exists = await Profile.findOne({ email: emailOrPhone });
      if (exists) return res.status(400).json({ message: "Email already registered" });
      newProfile.email = emailOrPhone.trim();
    } else {
      const exists = await Profile.findOne({ phoneNumber: emailOrPhone });
      if (exists) return res.status(400).json({ message: "Phone already registered" });
      newProfile.phoneNumber = emailOrPhone.trim();
    }

    if (profilePicture) newProfile.profilePicture = profilePicture;
    if (about) newProfile.aboutMe = about;
    if (location) newProfile.location = location;

    const created = await Profile.create(newProfile);
    res.status(201).json(sanitizeProfile(created));
  } catch (err) {
    console.error(err);
    if (err.code === 11000) return res.status(400).json({ message: "Duplicate value", details: err.keyValue });
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---- Login ----
app.post("/login", async (req, res) => {
  try {
    const { emailOrPhone, emailMode, password } = req.body;
    if (!emailOrPhone || !password) return res.status(400).json({ message: "Provide email/phone and password" });

    const query = emailMode === "true" || emailMode === true
      ? { email: emailOrPhone }
      : { phoneNumber: emailOrPhone };

    const profile = await Profile.findOne(query);
    if (!profile || !profile.passwordHash) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, profile.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    res.json(sanitizeProfile(profile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---- Profiles CRUD ----
app.get("/profiles", async (req, res) => {
  const profiles = await Profile.find().sort({ createdAt: -1 });
  res.json(profiles.map(sanitizeProfile));
});

app.put("/profiles/:id", async (req, res) => {
  try {
    const { fullName, email, phone, about, location, password, profilePicture } = req.body;
    const update = {};

    if (fullName) update.fullName = fullName;
    if (email) update.email = email;
    if (phone) update.phoneNumber = phone;
    if (about) update.aboutMe = about;
    if (location) update.location = location;
    if (password) update.passwordHash = await bcrypt.hash(password, 10);
    if (profilePicture) update.profilePicture = profilePicture;

    const updatedProfile = await Profile.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updatedProfile) return res.status(404).json({ error: "Profile not found" });

    res.json(sanitizeProfile(updatedProfile));
  } catch (err) {
    console.error("Update profile error:", err);
    if (err.code === 11000) return res.status(400).json({ message: "Duplicate value", details: err.keyValue });
    res.status(500).json({ error: err.message });
  }
});


// ---- Start server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
