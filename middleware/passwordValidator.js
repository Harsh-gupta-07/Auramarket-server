function isStrongPassword(req,res,next) {
    const {password} = req.body
    if (password.length < 8) {
        return res.status(400).json({passed: false,msg:"Password must be at least 8 characters long"})
    }
    
    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({passed: false,msg:"Password must contain at least one uppercase letter"})

    }
    
    // Check for lowercase
    if (!/[a-z]/.test(password)) {
        return res.status(400).json({passed: false,msg:"Password must contain at least one lowercase letter"})
    }
    
    // Check for numbers
    if (!/[0-9]/.test(password)) {
        return res.status(400).json({passed: false,msg:"Password must contain at least one number"})
    }
    
    // Check for special characters
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return res.status(400).json({passed: false,msg:"Password must contain at least one special character"})
    }
    
    next()
}


module.exports = {isStrongPassword}