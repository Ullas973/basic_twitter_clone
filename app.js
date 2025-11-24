const express = require('express')
const app = express();

const userModel = require('./models/user');
const postModel = require('./models/post')
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Path = require('path');
const user = require('./models/user');
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const upload = require("./config/multerconfig")


app.set("view engine","ejs")
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(Path.join(__dirname,'public')));

app.get("/",(req,res)=>{
    res.render("index")
});

app.get("/profile/upload", (req, res) => {
  res.render("profileUpload");
});

app.post("/upload",isLoggedIn,upload.single("image"), async (req, res) => {
       const user = await userModel.findOne({email:req.user.email})
       user.profilepic = req.file.filename;
       await user.save()
       res.redirect("/profile")
});


app.get("/profile",isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({email:req.user.email});
  let allPosts = await postModel.find().populate("user")
    
  
  res.render("profile",{user, allPosts})
});


app.post("/register", async (req, res) => {
const {name,username,password,email,age}=req.body;
const user = await userModel.findOne({email})
 if(user)
    return  res.redirect("/login");
 
 bcrypt.genSalt(10,(err,salt)=>{
    bcrypt.hash(password,salt,async (err,hash)=>{
        const user=await userModel.create({
            username,
            name,
            password:hash,
            age,
            email
         })
         let token = jwt.sign(
           { email, userid: user._id },
           process.env.JWT_SECRET
         );
         res.cookie("token",token);
         res.redirect("/profile");
    })
 })
      

});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const {password, email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user)
    return res
      .status(500)
      .redirect("/login");
    
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
            let token = jwt.sign(
              { email, userid: user._id },
              process.env.JWT_SECRET
            );
            res.cookie("token", token); 
            res.status(200).redirect("profile")
        }
            else res.redirect("/login")
    })
  
});

app.get("/logout",(req,res)=>{
    res.cookie("token","").redirect("/login")
})

app.post("/post",isLoggedIn, async (req,res)=>{
   let user = await userModel.findOne({email:req.user.email});
   const {content} =req.body;
   let post = await postModel.create({
       user:user._id,
       content
   })
   user.posts.push(post._id); //this is because post has user id but user doesnt have post id yet so thatis why we are ushing post id in user's posts section
   await user.save();
   res.redirect("/profile")
      
})

app.get("/like/:id",isLoggedIn, async(req, res) => {
    let post = await postModel.findOne({_id:req.params.id}).populate("user");

    if(post.likes.indexOf(req.user.userid)===-1){
        post.likes.push(req.user.userid)
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1)
    }
    
    await post.save();
    res.redirect("/profile")
});

app.get("/profile/:id", isLoggedIn, async(req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
   if (post.user.toString() === req.user.userid.toString()) {
     await postModel.findOneAndDelete({ _id: req.params.id }); // delete if same user do no lt odrs post
   }

 res.redirect("/profile")
});




function isLoggedIn(req,res,next){
     if(!req.cookies.token)
        res.redirect("/login");
     else{
      let data = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      req.user = data;
      next();
     }
     
}

app.listen(PORT,()=>{
    console.log("server started at port",PORT)
});