import { asyncHandler } from "../utils/asyncHandler";
import {apiError} from "../utils/apiError"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary }from "../utils/cloudinary.js"
import {ApiRespone} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { accessSync } from "node:fs";

const generateAccessAndRefreshToken = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.refreshToken()
    user.refreshToken = refreshToken
     await user.save({validateBeforeSave: false})
     return {accessToken, refreshToken}
  } catch (error) {
    throw new apiError(500, "something went wrong while generating refresh and access token")
  }
}
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
const loginUser = asyncHandler(async(req,res )=>{
  // reqbody se data
  const {email, username, password} = req.body
  // username and email
  if(!username || !email){
    throw new apiError(400, "username or email is required")
  }
  // find the user
  const user = await User.findOne({
    $or :[{username},{email}]
  })
  if(!user){
    throw new apiError(400, "user is required")
  }

  
  // check the password //
  const isPasswordVAlid = await user.isPasswordCorrect(password)
  if(!isPasswordVAlid){
    throw new apiError(401, "invalid user Credentials")
  }
  // acess and refresh token
  const {accessToken,refreshToken} = await  generateAccessAndRefreshToken(user._id)
  // send cookies 
  const loggedInUser = User.findById(user._id).select("-password","-refreshToken")
  const options ={
    httpOnly : true,
    secure: true
  }
  return res.status(200).cookie("accessToken", accessToken,options).cookie("refreshToken",refreshToken, options)
  .json( 
    new ApiRespone(
      200, {
        user : loggedInUser,accessToken,refreshToken
      },
      "user logged In successfully"
    )
  )
  
})
const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",accessToken, options)
    .clearCookie("refreshToken",refreshToken, options)
    .json(
      new ApiResponse
      (200, {logoutUser,accessToken,refreshToken}, "User logged Out")
    )
})
const refreshAccessToken = asyncHandler(async(req,res)=>{ 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new apiError(401, "unautharized request")
  }
  try {
  
  const decodedToken =  jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET)

    const user = User.findById(decodedToken?._id)
     if(!user){
    throw new apiError(401, "invalid refrsh token request")
  }
  if(user?.refreshToken !== incomingRefreshToken){
    throw new apiError(401, " refresh token is expired ir used ")
  }
  const options ={
    httpOnly : true,
    secure: true  
  }
  const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
  return res.status(200).cookie("accessToken", accessToken,options).cookie("refreshToken",newRefreshToken, options)
  .json( 
    new ApiRespone(
      200, {
        user ,accessToken,newRefreshToken
      },
      "token generated successfully"
    )
  )
  } catch (error) {
    throw new apiError(401, "invalid refrsh token request") 
  }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword, newPassword} = req.body
  
  const user = await User.findById(req.user?._id)
 const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)
 if(!isPasswordCorrect){
  throw new apiError(400, "old password is incorrect ")
  }
  user.password = newPassword
  await user.save({validateBeforeSave: false})
  return res.status(200).json(new ApiRespone(200, null, "password changed successfully"))
})
const getCurrentUser = asyncHandler(async(req,res )=>{
  return res.status(200).json(new ApiRespone(200, {user: req.user}, "user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullname, email} = req.body
  if(!fullname || !email ){
    throw new apiError(400, "fullname and email are required")
  }
  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {fullname, email: email

      }
    },
    {new : true}
  ).select("-password ")
  return res.status(200).json(new ApiRespone(200, {updatedUser}, "user details updated successfully")
)
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.avatar?.path
  if(!avatarLocalPath){
    throw new apiError(400, "avatar is required")
  }
const avatar= await uploadOnCloudinary(avatarLocalPath)
 if(!avatar?.url){
    throw new apiError(500, "error while uploading image")
 }
 const user = await User.findByIdAndUpdata(
  req.user?._id,
  {
    $set : {avatar: avatar.url}
  },
  {new : true}
  ).select("-password")
   return res.status(200).json(new ApiRespone(200, user, "user avatar image updated successfully"))
 })

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new apiError(400, "cover image is missing")
  }
const coverImage= await uploadOnCloudinary(coverImageLocalPath)
 if(!coverImage?.url){
    throw new apiError(500, "error while uploading coverimage")
 }
 const user = await User.findByIdAndUpdata(
  req.user?._id,
  {
    $set : {coverImage: coverImage.url}
  },
  {new : true}
  ).select("-password")
  return res.status(200).json(new ApiRespone(200, user, "user cover image updated successfully"))
 })

  export default{
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   getCurrentUser,
   changeCurrentPassword,
   updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};