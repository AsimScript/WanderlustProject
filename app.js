if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}



const express=require("express");
const app=express();
const mongoose=require("mongoose");
//const Listing=require("./models/listing.js");
//const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";
const dbUrl='mongodb+srv://asimpathan233:hEytDjoTx9JoBmOR@cluster0.i8iwr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
//const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
//const {listingSchema,reviewSchema}=require("./schema.js");
//const Review=require("./models/review.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');

const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
}); 
async function main(){
    //await mongoose.connect(MONGO_URL);
    await mongoose.connect(dbUrl); 
}

mongoose.connect(dbUrl)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));   
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:"mysupersecretcode"
    },
    touchAfter:24*3600, //24 hour session will refresh/update

});

store.on("error",()=>{
    console.log("ERROR in MONGO SESSION STORE",err);
});
const sessionOptions={
    store, //session info will be saved on mongoAtlas
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7 * 24 * 60 * 60 * 1000,  //7 days time period
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly:true,
    },
};

// app.get("/",(req,res)=>{
//     res.send("Hi,I am root");
// });


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
   
    next();
});
//not useful just for example
// app.get("/demouser",async (req,res)=>{
//     let fakeUser=new User({
//         email:"student@gmaul.com",
//         username:"delta-student"
//     });
//    let registeredUser=await User.register(fakeUser,"helloworld");
//    res.send(registeredUser);

// })





app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);






// app.get("/testListing", async(req,res)=>{
//  let sampleListing=new Listing({
//     title:"My New Villa",
//     description:"By the beach",
//     price:1200,
//     location:"calangute,Goa",
//     country:"india",
//  });
//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});
app.use((err,req,res,next)=>{
    let{statusCode=500,message="Something went wrong!"}=err; /*By default code and msg if they are not present*/
   res.status(statusCode).render("error.ejs",{message});
   // res.status(statusCode).send(message);
    
})
app.listen(8080,()=>{
    console.log("server is listening to port 8080");
})
   