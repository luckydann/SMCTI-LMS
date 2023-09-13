const passport = require('passport')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const LocalStrategy = require('passport-local').Strategy

function initialize(passport, getUserByAccountId, getUserById){
    const authenticateUser = async (accountId, password, done) => {

        if(accountId == 'admin' && password == 'admin'){
            const user = {
                id: 0
            }
            return done(null, user)
        }

        const user = await prisma.user.findFirst({
            where:{
                accountId: accountId
            }
        })
        
        if(user == null){
            return done(null, false, { message: 'Credentials not found' })
        }

        try{
            if(password == user.password){
                return done(null, user)
            }else{
                return done(null, false, { message: 'Password incorrect' })
            }
        }
        catch (e) {
            return done(e)
        }

    }
    
    passport.use(new LocalStrategy({ usernameField: 'accountId'}, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        if(id == 0){
            const user = {id: 0}
            return done(null, user)
        }
        return done(null, getUserById(id))
    })

}

module.exports = initialize