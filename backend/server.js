
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// --------------------
// DATABASE MODELS
// --------------------

const User = mongoose.model("User", new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { type: String, required: true }
}, { timestamps: true }));

const Task = mongoose.model("Task", new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: { type: String, required: true, trim: true },
    subject: String,
    date: String,
    completed: { type: Boolean, default: false }
}, { timestamps: true }));

const TestResult = mongoose.model("TestResult", new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: Number
}, { timestamps: true }));

// --------------------
// AUTHENTICATION
// --------------------

function authenticateToken(req, res, next) {
    const header = req.headers.authorization;
    const token = header && header.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Please log in first."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token."
        });
    }
}

// --------------------
// REGISTER
// --------------------

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must have at least 8 characters."
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Account created successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Registration failed."
        });
    }
});

// --------------------
// LOGIN
// --------------------

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Login failed."
        });
    }
});

// --------------------
// CURRENT USER
// --------------------

app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({
            message: "Could not retrieve profile."
        });
    }
});

// --------------------
// STUDY TASKS
// --------------------

app.post("/api/tasks", authenticateToken, async (req, res) => {
    try {
        const { title, subject, date } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required."
            });
        }

        const task = await Task.create({
            userId: req.userId,
            title: title.trim(),
            subject,
            date
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({
            message: "Could not create task."
        });
    }
});

app.get("/api/tasks", authenticateToken, async (req, res) => {
    const tasks = await Task.find({
        userId: req.userId
    }).sort({ createdAt: -1 });

    res.json(tasks);
});

app.patch("/api/tasks/:id", authenticateToken, async (req, res) => {
    const updates = {};

    if (typeof req.body.completed === "boolean") {
        updates.completed = req.body.completed;
    }

    if (typeof req.body.title === "string") {
        updates.title = req.body.title.trim();
    }

    const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: updates },
        { new: true, runValidators: true }
    );

    if (!task) {
        return res.status(404).json({
            message: "Task not found."
        });
    }

    res.json(task);
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    const task = await Task.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
    });

    if (!task) {
        return res.status(404).json({
            message: "Task not found."
        });
    }

    res.json({ message: "Task deleted." });
});

// --------------------
// MOCK TEST RESULTS
// --------------------

app.post("/api/tests", authenticateToken, async (req, res) => {
    try {
        const { score, total } = req.body;

        if (
            !Number.isInteger(score) ||
            !Number.isInteger(total) ||
            total <= 0 ||
            score < 0 ||
            score > total
        ) {
            return res.status(400).json({
                message: "Invalid test result."
            });
        }

        const result = await TestResult.create({
            userId: req.userId,
            score,
            total,
            percentage: Math.round(score / total * 100)
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({
            message: "Could not save test result."
        });
    }
});

app.get("/api/tests", authenticateToken, async (req, res) => {
    const results = await TestResult.find({
        userId: req.userId
    }).sort({ createdAt: -1 });

    res.json(results);
});

// --------------------
// HEALTH CHECK
// --------------------

app.get("/api", (req, res) => {
    res.json({
        message: "Welcome to ExamPath Backend!",
        status: "Running successfully"
    });
});

// --------------------
// START SERVER
// --------------------

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully.");

        app.listen(PORT, () => {
            console.log(`ExamPath running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
