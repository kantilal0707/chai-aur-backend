import { asyncHandler } from "../utils/asyncHandler";
import {apiError} from "../utils/apiError"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary }from "../utils/cloudinary.js"
import {ApiRespone} from "../utils/ApiResponse.js"
const registerUser = asyncHandler( async( req,res)=>{
    res.status(200).json({message :"ok"})
    //get user details from fronted
    //validation- not empty
    // check if user already exits : username, email
    // check for image , check for avatar
    // upload time to cloudinary url
     // create user object - create entry in db
     //remove password and refresh token field from response
     //  check for user creati0on 
     // return res 

     const {fullname, username, email, password} = req.body
     console.log("email:", email);;
     if ([fullname, username, email, password].some((field)=>
        field ?.trim () ==="")
     ){
        throw new apiError(400, "all field  are required")
     }
    const existedUser = User.findOne({
        $or : [{username},{email}]
    })
    if (existedUser){
        throw new apiError(409, "user with email and username")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath =  req.files?.coverImage[0]?.path;
   if (!avatarLocalPath){
    throw new apiError(400, "avatar is  required")
   }
   const avatar = await  uploadOnCloudinary(avatarLocalPath);
  const coverImage =  await uploadOnCloudinary(coverImageLocalPath)
   if (!coverImageLocalPath){
    throw new apiError(400, "coverimage is  required")
   }
  const user =  await User.create({
    fullname, 
    avatar: avatar.url,
    coverImage: coverImage?. url || "",
    email,
    password,
    username : username.toLowerCase()
  })
  const createdUser =  await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if(!createdUser){
    throw new apiError(500,"user given error in registeration")
  }
  return res.status(201).json(
    new ApiRespone(200, "user registration successfully")
  )
})

export default registerUser;