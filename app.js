// Import required modules
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("connect-flash");
const expressLayouts = require("express-ejs-layouts");

// Create Express app
const app = express();

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/admin"));
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));

// Use express-ejs-layouts
app.use(expressLayouts);

// Optional: Set the default layout file if it's named something else
app.set("layout", "admin-layout"); // Adjust this if you have other layouts

const mongoUri = process.env.MONGODB_URI;

// Connect to MongoDB Atlas using Mongoose
mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB Atlas:", error);
  });

// Define Mongoose schema and model for posts
const postSchema = new mongoose.Schema(
  {
    image: String,
    title: String,
    description: String,
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

// Define Mongoose schema and model for users
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },

  isAdmin: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

// Define Mongoose schema for applications
const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  startDate: Date,
  endDate: Date,
  status: { type: String, default: "Pending" }, // Adding a status field with a default value
});

const Application = mongoose.model("Application", applicationSchema);

// Configure Multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/image"); // Specify the destination folder for storing the uploaded images
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9); // Generate a unique name for the image
    cb(null, uniqueName + path.extname(file.originalname)); // Use the unique name and the original file extension
  },
});

const upload = multer({ storage: storage });

// Middleware to parse the form data
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
app.use(express.static("public"));

const saltRounds = 10;

// Configure session and passport
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Configure Passport.js strategies
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email });
        if (!user) return done(null, false, { message: "Incorrect email." });
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) return done(null, user);
        return done(null, false, { message: "Incorrect password." });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, { id: user.id, isAdmin: user.isAdmin });
});

passport.deserializeUser(async (obj, done) => {
  if (obj.isAdmin) {
    done(null, obj); // Admin user
  } else {
    try {
      const user = await User.findById(obj.id);
      done(null, {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      });
    } catch (err) {
      done(err, null);
    }
  }
});

// Admin hardcoded credentials
const admin = { username: "admin", password: "11", isAdmin: true }; // Add isAdmin property

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You need to be logged in to access this page");
  res.redirect("/login");
};

app.use((req, res, next) => {
  res.locals.isLoggedIn = req.isAuthenticated(); // This makes `isLoggedIn` available in all views
  next();
});

// Middleware to check if user is authenticated and an admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.redirect("/admin/login");
};

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
app.set("layout", "layout");

app.use("/admin", (req, res, next) => {
  res.locals.layout = "admin-layout";
  res.locals.path = req.path;
  next();
});

// Routes
app.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: "desc" });

    // Truncate descriptions
    const truncatedPosts = posts.map((post) => ({
      ...post._doc,
      description:
        post.description.length > 100
          ? post.description.substring(0, 100) + "..."
          : post.description,
    }));

    res.render("index", { posts: truncatedPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.render("index", { posts: [] });
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/posts", (req, res) => {
  res.render("posts");
});

app.get("/posts/:id", async function (req, res) {
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId).exec();
    if (!post) return res.render("error.ejs", { error: "Post not found" });
    res.render("posts", {
      header: "partials/header",
      footer: "partials/footer",
      post: post,
      user: req.user,
    });
  } catch (err) {
    res.render("error.ejs", { error: "An error occurred" });
  }
});

app.get("/register", (req, res) => {
  res.render("register", { message: req.flash("error") });
});

app.post("/register", async (req, res) => {
  const { email, password, name } = req.body; // Add name to the destructured variables
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ email: email, password: hash, name: name }); // Add name to the new user document
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    req.flash("error", "Email already exists");
    res.redirect("/register");
  }
});

app.get("/login", (req, res) => {
  res.render("login", { message: req.flash("error") });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/admin/login", (req, res) => {
  res.render("admin/login", { message: req.flash("error") });
});

app.post("/admin/login", (req, res, next) => {
  const { username, password } = req.body;
  if (username === admin.username && password === admin.password) {
    req.login(admin, (err) => {
      if (err) return next(err);
      res.redirect("/admin/add-post");
    });
  } else {
    req.flash("error", "Incorrect username or password");
    res.redirect("/admin/login");
  }
});

app.get("/admin/add-post", isAdmin, (req, res) => {
  res.render("admin/add-post");
});

app.get("/admin/", isAdmin, (req, res) => {
  res.render("admin/add-post");
});

app.post(
  "/admin/add-post",
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    const { title, description } = req.body;

    if (req.file) {
      const newPost = new Post({
        image: req.file.filename,
        title,
        description,
      });

      try {
        await newPost.save();
        res.render("admin/add-post");
      } catch (error) {
        console.error("Error saving post:", error);
        res.send("Error saving post");
      }
    } else {
      console.error("No file uploaded");
      res.send("No file uploaded");
    }
  }
);

app.get("/admin/my-posts", isAdmin, async (req, res) => {
  try {
    const posts = await Post.find();
    res.render("admin/my-posts", { posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.render("my-posts", { posts: [] });
  }
});

app.post("/delete-post/:id", isAdmin, async (req, res) => {
  const postId = req.params.id;
  try {
    await Post.findByIdAndRemove(postId);
    console.log("Post deleted successfully");
    res.redirect("/admin/my-posts");
  } catch (error) {
    console.error("Error deleting post:", error);
    res.redirect("/my-posts");
  }
});

app.get("/admin/update-post/:id", isAdmin, async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await Post.findById(postId);
    res.render("admin/update-post", { post: post });
  } catch (error) {
    console.error("Error finding post:", error);
    res.redirect("/admin/my-posts");
  }
});

app.post(
  "/update-post/:id",
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    const postId = req.params.id;
    const updatedPost = {
      title: req.body.title,
      description: req.body.description,
    };

    try {
      await Post.findByIdAndUpdate(postId, updatedPost);
      console.log("Post updated successfully");
      res.redirect("/admin/my-posts");
    } catch (error) {
      console.error("Error updating post:", error);
      res.redirect("/my-posts");
    }
  }
);

// Route for applying to a job
app.post("/apply", async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You need to be logged in to apply for jobs");
    return res.redirect("/login");
  }

  const { post, startDate, endDate } = req.body;
  const userId = req.user.id;

  console.log(req.user); // Check if req.user has the _id property
  console.log(post, startDate, endDate); // Check the values of form fields

  if (!post) {
    req.flash("error", "No post ID found");
    return res.redirect("/");
  }

  try {
    const newApplication = new Application({
      user: userId, // Pass the user id
      post,
      startDate,
      endDate,
    });

    await newApplication.save();
    req.flash("success", "Application submitted successfully");
    res.redirect("/");
  } catch (err) {
    req.flash("error", `Error applying for job: ${err.message}`);
    res.redirect(`/posts/${post}`);
  }
});

// Admin route to view job applications
app.get("/admin/applications", isAdmin, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("user")
      .populate("post");
    res.render("admin/applications", { applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.render("admin/applications", { applications: [] });
  }
});

// Admin route to update application status
app.post("/admin/application/:id/status", isAdmin, async (req, res) => {
  const applicationId = req.params.id;
  const { status } = req.body;

  try {
    await Application.findByIdAndUpdate(applicationId, { status });
    res.redirect("/admin/applications");
  } catch (error) {
    console.error("Error updating application status:", error);
    res.redirect("/admin/applications");
  }
});

app.post("/admin/application/:id/delete", isAdmin, async (req, res) => {
  const applicationId = req.params.id;
  try {
    await Application.findByIdAndDelete(applicationId);
    res.redirect("/admin/applications");
  } catch (error) {
    console.error("Error deleting application:", error);
    res.redirect("/admin/applications");
  }
});

// Route to view all registered users
app.get("/admin/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.render("admin/users", { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.redirect("/admin");
  }
});

// Route to delete a user
app.post("/admin/users/delete/:id", isAdmin, async (req, res) => {
  const userId = req.params.id;
  try {
    await User.findByIdAndDelete(userId);
    console.log("User deleted successfully");
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.redirect("/admin/users");
  }
});

// Route to log out the user
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.redirect("/");
    }
    req.flash("success", "You have been logged out successfully");
    res.redirect("/");
  });
});

app.get("/history", ensureAuthenticated, async (req, res) => {
  try {
    const applications = await Application.find({
      user: req.user.id,
    }).populate("post");
    res.render("history", { applications });
  } catch (error) {
    console.error("Error fetching application history:", error);
    res.render("history", { applications: [] });
  }
});
// Start the server
const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
