if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

//NODE PACKAGE MODULES
const express = require('express')
const bcrypt = require('bcrypt')    
const passport = require('passport') // module package for authentication
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const crypto = require('crypto')
const qrcode = require('qrcode')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const app = express()
const upload = multer({dest: 'public/uploads/'})
const materialUpload = multer({
    storage: multer.diskStorage({
        destination: 'public/uploads',
        filename: async function(req, file, cb){
            var currentFileName = file.originalname
            const activityId = req.params.activityId
            var activity = await getActivity(activityId)
            if(activity.type == 'Exam'){
                currentFileName = `${activityId}_${currentFileName}`
            }
            const fileName = modifyFileName(currentFileName)
            cb(null, fileName)
        }
    })
})

const initializePassport = require('./passport-config')
initializePassport(
    passport, 
    async accountId => {
        const findUser = await prisma.user.findFirst({
            where:{
                accountId: accountId
            }
        })
    },
    async id => {
        const findUser = await prisma.user.findUnique({
            where:{
                id:id
            }
        })
    }
)

app.use(express.static(__dirname + '/public'))

app.set('view-engine', 'ejs')
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.urlencoded())
app.use(express.json())

//ENDPOINT 
//app.get('/endpoint or url', middleware, function(request, respond){}) - 
//app.post('/endpoint or url', middleware, function(request, respond){}) - 
//checkNotAuthenticated, bawal paadtoon dria kung naka log-in
//checkAuthenticated, bawal paadtoon dria kung wala naka log-in
app.get('/', checkNotAuthenticated, async (req, res) => {
    res.render('pages/index.ejs')
})

app.get('/dashboard', checkAuthenticated, async (req, res) => {
    var userId = await req.session.passport.user
    if(userId == null)
        res.redirect('/')
    var account = await getUserById(userId)
    var subjects = await getSubjects(account)
    if(account.role == 'Student'){
        var ongoingActivities = await getOnGoingActivities(userId)
        res.render('pages/studentDashboard.ejs', {
            student: account,
            ongoingActivities: ongoingActivities
        })
    }
    else{
        if(subjects.length != 0){
            res.redirect('/dashboard/' + subjects[0].uniqueCode)
            return
        }
        res.render('pages/teacherDashboard.ejs', {
            teacher: account,
            subjects: subjects,
            type: 'home'
        })
    }
})
//purpose sa ':' any value
app.get('/dashboard/:subjectCode', checkAuthenticated, async (req, res) => {
    var subjectCode = req.params.subjectCode
    var userId = await req.session.passport.user
    if(userId == null)
        res.redirect('/')
    var account = await getUserById(userId)
    var subjects = await getSubjects(account)
    if(subjects.length == 0){
        res.redirect('/dashboard')
        return
    }
    var subject = null
    var activities = null
    for(var i = 0; i < subjects.length; i++){
        if(subjects[i].uniqueCode == subjectCode)
            subject = subjects[i]
    }
    if(subject != null){
        activities = await getActivities(subject)
    }
    if(account.role == 'Student')
        res.render('pages/studentDashboard.ejs', {student: account})
    else{
        res.render('pages/teacherDashboard.ejs', {
            teacher: account,
            subjects: subjects,
            type: 'home',
            uniqueCode: subjectCode,
            subject: subject,
            activities
        })
    }
})

app.get('/dashboard/:subjectCode/activities', checkAuthenticated, async (req, res) => {
    var subjectCode = req.params.subjectCode
    var userId = await req.session.passport.user
    if(userId == null)
        res.redirect('/')
    var account = await getUserById(userId)
    var subjects = await getSubjects(account)
    if(subjects.length == 0){
        res.redirect('/dashboard')
        return
    }
    var subject = null
    var activities = null
    var totalStudent = 0
    for(var i = 0; i < subjects.length; i++){
        if(subjects[i].uniqueCode == subjectCode)
            subject = subjects[i]
    }
    if(subject != null){
        activities = await getActivities(subject)
        totalStudent = await getTotalStudents(subject)
    }
    if(account.role == 'Student')
        res.redirect('/')
    else{
        res.render('pages/teacherDashboard.ejs', {
            teacher: account,
            subjects: subjects,
            type: 'activities',
            subtype: 'none',
            uniqueCode: subjectCode,
            subject: subject,
            activities: activities,
            totalStudents: totalStudent,
        })
    }
})

app.get('/dashboard/:subjectCode/settings', checkAuthenticated, async (req, res) => {
    var subjectCode = req.params.subjectCode
    var userId = await req.session.passport.user
    if(userId == null)
        res.redirect('/')
    var account = await getUserById(userId)
    var subjects = await getSubjects(account)
    var students = await getStudentsBySubject(subjectCode)
    if(subjects.length == 0){
        res.redirect('/dashboard')
        return
    }
    var subject = null
    for(var i = 0; i < subjects.length; i++){
        if(subjects[i].uniqueCode == subjectCode)
            subject = subjects[i]
    }
    if(account.role == 'Student')
        res.redirect('/')
    else{
        res.render('pages/teacherDashboard.ejs', {
            teacher: account,
            subjects,
            type: 'settings',
            uniqueCode: subjectCode,
            subject,
            students
        })
    }
})

app.get('/dashboard/:subjectCode/new-activity', checkAuthenticated, async (req, res) => {
    var subjectCode = req.params.subjectCode
    var userId = await req.session.passport.user
    if(userId == null)
        res.redirect('/')
    var account = await getUserById(userId)
    var subjects = await getSubjects(account)
    if(subjects.length == 0){
        res.redirect('/dashboard')
        return
    }
    var subject = null
    for(var i = 0; i < subjects.length; i++){
        if(subjects[i].uniqueCode == subjectCode)
            subject = subjects[i]
    }
    if(account.role == 'Student')
        res.redirect('/')
    else{
        res.render('pages/teacherDashboard.ejs', {
            type: 'activities',
            subtype: 'new-activity',
            subjects: subjects,
            uniqueCode: subjectCode,
            subject: subject
        })
    }
})

app.get('/dashboard/:subjectUniqueCode/:activityId/edit-activity', checkAuthenticated, async (req, res) => {
    var subjectUniqueCode = req.params.subjectUniqueCode
    var activityId = req.params.activityId
    var userId = await req.session.passport.user
    if(userId == null)
        res.redirect('/')

    var account = await getUserById(userId)
    var subjects = await getSubjects(account)
    var activity = await getActivity(activityId)
    var questions = await getQuestions(activity)
    var material = await getMaterial(activity)

    if(subjects.length == 0){
        res.redirect('/dashboard')
        return
    }
    var subject = null
    for(var i = 0; i < subjects.length; i++){
        if(subjects[i].uniqueCode == subjectUniqueCode)
            subject = subjects[i]
    }
    if(account.role == 'Student')
        res.redirect('/')
    else{
        res.render('pages/teacherDashboard.ejs', {
            type: 'activities',
            subtype: 'edit-activity',
            subjects: subjects,
            uniqueCode: subjectUniqueCode,
            subject: subject,
            activity: activity,
            questions: questions,
            material: material
        })
    }
})

app.get('/dashboard/student-progress/:subjectUniqueCode/:activityId', checkAuthenticated, async (req, res) => {
    const activityId = await req.params.activityId
    const studentsDetails = await getStudentsActivityDetails(activityId)
    
    var subjectCode = await req.params.subjectUniqueCode
    var userId = await req.session.passport.user
    if(userId == null)
        res.redirect('/')
    var account = await getUserById(userId)
    var subjects = await getSubjects(account)
    var activity = await getActivity(activityId)
    if(subjects.length == 0){
        res.redirect('/dashboard')
        return
    }
    var subject = null
    for(var i = 0; i < subjects.length; i++){
        if(subjects[i].uniqueCode == subjectCode)
            subject = subjects[i]
    }
    if(account.role == 'Student')
        res.redirect('/')
    else{
        res.render('pages/teacherDashboard.ejs', {
            teacher: account,
            subjects: subjects,
            type: 'student-progress',
            subtype: 'none',
            uniqueCode: subjectCode,
            subject: subject,
            studentsDetails,
            total: activity.questions.length
        })
    }
})

app.get('/admin', async (req, res) => {
    res.render('pages/admin.ejs', {
        'students': await getStudents(),
        'teachers': await getTeachers()
    })
})

app.get('/todos', checkAuthenticated, async (req, res) => {
    var userId = await req.session.passport.user
    var account = await getUserById(userId)
    var userSubjects = await getSubjects(account)
    res.render('pages/todos.ejs', {
        userSubjects
    })
})

app.get('/activity/:subjectUniqueCode/:activity', checkAuthenticated, async (req, res) => {
    var userId = await req.session.passport.user
    var subjectUniqueCode = await req.params.subjectUniqueCode
    var activityId = await req.params.activity

    var activity = await getActivity(activityId)
    var account = await getUserById(userId)
    const dateTime = new Date().toISOString()

    await prisma.examStartRecord.create({
        data:{
            timeStart: dateTime,
            activityId: activity.id,
            studentId: account.student.id
        }
    })
    res.redirect('/activity/' + subjectUniqueCode + '/' + activityId + '/1')
})

app.get('/activity/:subjectUniqueCode/:activity/:questionNumber', checkAuthenticated, async (req, res) => {
    var userId = await req.session.passport.user
    var subjectUniqueCode = await req.params.subjectUniqueCode
    var activityId = await req.params.activity
    var questionNumber = await req.params.questionNumber

    var student = await prisma.student.findUnique({
        where:{
            userId: Number(userId)
        },
        include:{
            subjects: {
                where:{
                    uniqueCode: subjectUniqueCode
                },
                include:{
                    activities: {
                        where: {
                            id: Number(activityId)
                        },
                        include:{
                            questions: true
                        }
                    }
                }
            }
        }
    })
    var subject = student.subjects
    console.log(subject[0])
    var activity = subject[0].activities[0]

    var examStartRecord = activity.type == 'Exam' ? await getExamStartRecord(student.id, activity.id) : null

    if(subject.length == 0){
        res.redirect('/dashboard')
        return
    }
    if(await checkIfAnswered(student.id, activityId)){
        res.redirect('/activity-result/' + subjectUniqueCode + '/' + activityId)
        return
    }

    var questions = subject[0].activities[0].questions
    if(questions[0] == null){
        res.redirect('/dashboard')
        return
    }
    var question = null
    for(var i = 0; i < questions.length; i++){
        if(i + 1 == Number(questionNumber)){
            question = questions[i]
        }
    }
    if(question == null){
        question = questions[0]
    }

    if(question.type == 'mc'){
        question.choices = shuffleChoices(question.choices.split('/=/=/'))
    }

    activity = await getQuestionsWithStatus(activity, student.id)
    
    for(var i = 0; i < activity.questions.length; i++){
        if(activity.questions[i].id == question.id){
            question = activity.questions[i]
        }
    }

    var imageName = await getImageName(question.id)

    var question = {
        ...question,
        withImg: imageName
    }

    if(activity.type == 'Lesson'){
        activity = {
            ...activity,
            material: await getMaterial(activity)
        }
    }

    res.render('pages/activity-template.ejs', {
        activity: activity,
        currentQuestion: question,
        questionNumber: questionNumber,
        hrefLink: '/activity/' + subjectUniqueCode + '/' + activityId + '/',
        examStartRecord
    })
})

app.get('/activity-result/:subjectUniqueCode/:activityId', checkAuthenticated, async (req, res) => {
    const userId = await req.session.passport.user
    const subjectUniqueCode = await req.params.subjectUniqueCode
    const activityId = await req.params.activityId

    const account = await getUserById(userId)

    if(!(await checkIfAnswered(account.student.id, activityId))){
        res.redirect('/todos')
    }

    var score = await getStudentScore(account.student.id, activityId)
    var activity = await getActivityWithAnswers(activityId, account.student.id)
    
    res.render('pages/results.ejs', {
        score: score,
        total: activity.questions.length,
        activity
    })
})

app.get('/profile', checkAuthenticated, async (req, res) => {
    var userId = await req.session.passport.user
    if(userId == null)
        res.redirect('/')

    var account = await getUserById(userId)
    var censoredPassword = ''
    for(var i = 0; i < account.password.length; i++){
        censoredPassword += '●'
    }
    var subjects = await getSubjects(account)

    account.password = censoredPassword
    res.render('pages/profile.ejs', {
        account: account,
        subjects: subjects,
        type: 'profile',
        message: null
    })
})

app.get('/profile/edit', checkAuthenticated, async (req, res) => {
    var userId = await req.session.passport.user
    var account = await getUserById(userId)
    var censoredPassword = ''
    for(var i = 0; i < account.password.length; i++){
        censoredPassword += '●'
    }
    var subjects = await getSubjects(account)

    account.password = censoredPassword
    res.render('pages/profile-edit.ejs', {
        account: account,
        subjects: subjects,
        type: 'profile'
    })
})

app.post('/login', checkAdmin, checkNotAuthenticated, passport.authenticate('local',{
    successRedirect: '/dashboard',
    failureRedirect: '/',
    failureFlash: true
}))

app.post('/login-via-qrcode', checkNotAuthenticated, async (req, res) => {
    const uniqueCode = req.body.code
    const user = await getUser(uniqueCode)
    res.send(user)
})

app.post('/add-student', async (req, res) => {
    var accountId = req.body.accountId
    var fullName = req.body.fullName
    var password = generateRandomString(10)
    var qrCode = accountId + generateRandomString(5)

    const savedStudent = await prisma.student.create({
        data:{
            email: '',
            sex: '',
            user:{
                create:{
                    name: fullName,
                    accountId: accountId,
                    password: password,
                    uniqueCode: qrCode,
                    role: 'Student'
                }
            }
            
        }
    })

    console.log(savedStudent)

    res.redirect('/admin')
})

app.post('/add-teacher', async (req, res) => {
    var accountId = req.body.accountId
    var fullName = req.body.fullName
    var password = generateRandomString(10)
    var qrCode = accountId + generateRandomString(5)

    await prisma.teacher.create({
        data:{
            email: '',
            user:{
                create:{
                    name: fullName,
                    accountId: accountId,
                    password: password,
                    uniqueCode: qrCode,
                    role: 'Teacher'
                }
            }
            
        }
    })

    res.redirect('/admin')
})

app.post('/ect', checkAuthenticated, async (req, res) => {
    var userId = await req.session.passport.user
    var uniqueCode = await getSubjectUniqueCode()
    await prisma.teacher.update({
        where:{
            userId: userId
        },
        data:{
            subjects:{
                create:{
                    code: req.body.code,
                    title: req.body.title,
                    description: req.body.description,
                    uniqueCode: uniqueCode
                }
            }
        }
    })
    res.redirect('/profile')
})

app.post('/update-teacher', checkAuthenticated, async (req, res) => {
    const userId = await req.session.passport.user
    const email = await req.body.email
    const name = await req.body.name
    const password = await req.body.password
    await prisma.teacher.update({
        where:{
            userId: userId
        },
        data:{
            email: email,
            user:{
                update:{
                    name: name,
                    password: password
                }
            }
        }
    })
    res.redirect('/profile')
})

app.post('/update-student', checkAuthenticated, async (req, res) => {
    const userId = await req.session.passport.user
    const email = await req.body.email
    const name = await req.body.name
    const password = await req.body.password
    const sex = await req.body.sex
    await prisma.student.update({
        where:{
            userId
        },
        data:{
            email,
            sex,
            user:{
                update:{
                    name,
                    password
                }
            }
        }
    })
    res.redirect('/profile')
})

app.post('/add-activity/:subjectUniqueCode', checkAuthenticated, async (req, res) => {
    const subjectUniqueCode = req.params.subjectUniqueCode
    const type = req.body.type
    const title = req.body.title
    const description = req.body.description
    const startDate = req.body.startDate
    const endDate = req.body.endDate
    const examDuration = req.body.examDuration
    
    const subject = await prisma.subject.findUnique({
        where:{
            uniqueCode: subjectUniqueCode
        }
    })

    const activity = await prisma.activity.create({
        data:{
            name: title,
            description: description,
            type: type,
            startDate: startDate,
            endDate: endDate,
            subjectId: subject.id,
            duration: examDuration && type == 'Exam' ? Number(examDuration) : 0
        }
    })
    res.redirect('/dashboard/' + subjectUniqueCode + '/' + activity.id + '/edit-activity') 
})

app.post('/add-question/:activityId/:subjectUniqueCode', checkAuthenticated, async (req, res) => {
    const activityId = req.params.activityId
    const subjectUniqueCode = req.params.subjectUniqueCode
    const question = req.body.question
    var choices = req.body.answer
    const isMultipleChoice = req.body.isMultipleChoice
    var type = ''
    var explanation = req.body.explanation

    var answer = ''

    if(isMultipleChoice == 'true'){
        type = 'mc'
        var splittedChoices = choices.split('/=/=/')
        answer = splittedChoices[0]
    }else{
        type = 'i'
        answer = choices
        choices = 'no choices'
    }

    savedQuestion = await prisma.question.create({
        data:{
            prompt: question,
            answer: answer,
            choices: choices,
            type: type,
            activityId: Number(activityId),
            explanation: explanation
        }
    })

    res.send({savedQuestion})
})

app.post('/delete-question/:activityId', async (req, res) => {
    const activityId = req.params.activityId
    const prompt = req.body.prompt
    console.log(activityId, prompt)
    const deletedQuestion = await prisma.question.deleteMany({
        where:{
            AND:[
                {activityId: Number(activityId)},
                {prompt: prompt}
            ]
        }
    })
    res.send({question: deletedQuestion})
})

app.post('/delete-all-questions/:subjectUniqueCode/:activityId', async (req, res) => {
    const activityId = req.params.activityId
    const subjectUniqueCode = req.params.subjectUniqueCode
    await prisma.question.deleteMany({
        where:{
            activityId: Number(activityId)
        }
    }) 

    res.redirect(`/dashboard/${subjectUniqueCode}/${activityId}/edit-activity`)
})

app.post('/delete-activity/:subjectUniqueCode', async (req, res) => {
    const activityId = req.body.activityId
    const subjectUniqueCode = req.params.subjectUniqueCode
    await prisma.activity.delete({
        where:{
            id: Number(activityId)
        }
    })
    res.redirect('/dashboard/' + subjectUniqueCode + '/activities')
})

app.post('/join-subject', async (req, res) => {
    const userId = await req.session.passport.user
    const subjectUniqueCode = await req.body.subjectUniqueCode
    var subjectExist = await prisma.subject.findUnique({
        where:{
            uniqueCode: subjectUniqueCode
        }
    })
    if(subjectExist == null){
        console.log('Im here')
        res.send({message: 'Not found'})
        return
    }
    await prisma.student.update({
        where:{
            userId: userId
        },
        data:{
            subjects:{
                connect:{
                    uniqueCode: subjectUniqueCode
                }
            }
        }
    })
    res.redirect('/profile')
})

app.post('/add-subject', checkAuthenticated, async (req, res) => {
    var userId = await req.session.passport.user
    var uniqueCode = await getSubjectUniqueCode()
    await prisma.teacher.update({
        where:{
            userId: userId
        },
        data:{
            subjects:{
                create:{
                    code: req.body.code,
                    title: req.body.title,
                    description: req.body.description,
                    uniqueCode: uniqueCode
                }
            }
        }
    })
    res.redirect('/profile')
})

app.post('/drop-subject', async (req, res) => {
    const userId = await req.session.passport.user
    const subjectUniqueCode = await req.body.subjectUniqueCode
    await prisma.student.update({
        where:{
            userId: userId
        },
        data:{
            subjects:{
                disconnect:{
                    uniqueCode: subjectUniqueCode
                }
            }
        }
    })
    res.redirect('/profile')
})

app.post('/get-activities-by-subject', async (req, res) => {
    const userId = await req.session.passport.user
    const subjectId = (await req.body.subjectId == 0) ? null : await req.body.subjectId
    const type = (await req.body.type == 'All') ? null : await req.body.type
    var activitiesOfSubject = await getActivitiesBySubjectAndUser(subjectId, userId, type)
    res.send({activitiesOfSubject})
})

app.post('/save-answer', async (req, res) => {
    const userId = await req.session.passport.user
    var answer = req.body.answer
    var questionId = req.body.questionId

    var account = await getUserById(userId)

    const answeredQuestion = await prisma.answeredQuestion.create({
        data:{
            questionId: Number(questionId),
            studentId: account.student.id,
            answer: answer
        }
    })
    res.send({answeredQuestion})
})

app.post('/submit-activity', async (req, res) => {
    const userId = await req.session.passport.user
    const activityId = await req.body.activityId

    var account = await getUserById(userId)
    var score = await getStudentScore(account.student.id, activityId)

    const answeredActivity = await prisma.answeredActivity.create({
        data:{
            activityId: Number(activityId),
            studentId: account.student.id,
            score: score + ''
        }
    })
    res.send({answeredActivity})
})

app.post('/upload/:questionId', upload.single('file'), async (req, res) => {
    var userId = await req.session.passport.user
    var file = await req.file
    var questionId = await req.params.questionId

    var account = await getUserById(userId)

    console.log(file, questionId)
    
    var savedFile = await prisma.file.create({
        data:{
            questionId: Number(questionId),
            fileName:file.filename
        }
    })

    res.send({savedFile})
})

app.post('/upload-material/:subjectUniqueCode/:activityId', materialUpload.single('file'), async (req, res) => {
    const activityId = Number(await req.params.activityId)
    const subjectUniqueCode = await req.params.subjectUniqueCode
    const file = req.file
    if(!file){
        return res.status(400).send('No file uploaded')
    }
    const newOriginalFileName = modifyFileName(file.originalname)
    const material = await prisma.material.upsert({
        where:{
            activityId: activityId
        },
        update:{
            fileName: newOriginalFileName
        },
        create:{
            activityId: activityId,
            fileName: newOriginalFileName
        }
    })
    res.redirect('/dashboard/' + subjectUniqueCode + '/' + activityId + '/edit-activity')
})


app.post('/upload-questions/:subjectUniqueCode/:activityId', materialUpload.single('file'), async (req, res) => {
    const activityId = Number(req.params.activityId)
    const subjectUniqueCode = req.params.subjectUniqueCode
    const file = req.file
    if(!file){
        return res.status(400).send('No file uploaded')
    }
    const newOriginalFileName = modifyFileName(`${activityId}_${file.originalname}`)

    var result = await getQuestionsData(newOriginalFileName)

    for(var i = 0; i < result.length; i++){
        var savedQuestion = await prisma.question.create({
            data:{
                prompt: result[i].question,
                answer: result[i].answer,
                choices: result[i].choices,
                type: result[i].type,
                explanation: result[i].explanation,
                activityId: activityId
            }
        })
    }
    

    res.redirect(`/dashboard/${subjectUniqueCode}/${activityId}/edit-activity`)

})

app.post('/delete-teacher-subject', async (req, res) => {
    var userId = await req.session.passport.user
    var subjectId = Number(await req.body.subjectId)

    var account = await getUserById(userId)

    disconnectFromStudent(subjectId)
    
    await prisma.subject.delete({
        where:{
            id: subjectId
        }
    })
    res.redirect('/profile')
})

app.get('/get-qrcode/:code', async (req, res) => {
    const code = req.params.code
    qrcode.toFileStream(res, code, {
        errorCorrectionLevel: 'H',
        version: 10,
        scale: 8
    }, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
    });
})

async function disconnectFromStudent(subjectId){
    var students = await prisma.student.findMany({
        where:{
            subjects:{
                some:{
                    id: subjectId
                }
            }
        }
    })

    for(var i = 0; i < students.length; i ++){
        await prisma.student.update({
            where:{
                id: students[i].id
            },
            data:{
                subjects:{
                    disconnect:{
                        id: subjectId
                    }
                }
            }
        })
    }
}

//logout?_method=DELETE POST METHOD
app.delete('/logout', function(req, res) {
    req.logout((err) => {
      if(err) {
        console.log(err);
      }
      res.redirect('/');
    });
});

async function getUser(uniqueCode){
    const user = await prisma.user.findUnique({
        where:{
            uniqueCode: uniqueCode
        },
        include:{
            teacher: true,
            student: true
        }
    })
    return user
}

async function getUserById(id){
    const user = await prisma.user.findUnique({
        where:{
            id: id
        },
        include:{
            teacher: true,
            student: {
                include: {
                    subjects: true
                }
            }
        }
    })
    return user
}

async function getStudents(){
    const students = await prisma.student.findMany({
        include:{
            user: true
        }
    })
    return students
}

async function getTeachers(){
    const teachers = await prisma.teacher.findMany({
        include:{
            user: true
        }
    })
    return teachers
}

async function getSubjects(account){
    var subjects = null
    if(account.role == 'Student'){
        var student = await prisma.student.findUnique({
            where:{
                id: account.student.id
            },
            include:{
                subjects:{
                    include:{
                        students: true
                    }
                }
            }
        })
        subjects = student.subjects
    }else{
        subjects = await prisma.subject.findMany({
            where:{
                teacherId: account.teacher.id
            }
        })
    }

    return subjects
}

async function getActivity(id){
    return await prisma.activity.findUnique({
        where:{
            id: Number(id)
        },
        include:{
            questions: {
                include:{
                    answers: true
                }
            }
        }
    })
}

async function getActivityWithAnswers(activityId, studentId){
    return await prisma.activity.findUnique({
        where:{
            id: Number(activityId)
        },
        include:{
            questions: {
                include:{
                    answers: {
                        where:{
                            studentId: studentId
                        }
                    }
                }
            }
        }
    })
}

async function getActivities(subject){
    const activities = await prisma.activity.findMany({
        where:{
            subjectId: subject.id
        },
        include:{
            answers: true
        }
    })

    const newActivities = Promise.all(activities.map(async (activity) => {
            const startDate = new Date(activity.startDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' });
            const endDate = new Date(activity.endDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' });
            const currentDate = new Date();
            const totalFinishedStudents = await getStudentsFinishedByActivity(activity.id)
            let status = 'Expired';
            if (currentDate < new Date(activity.startDate)) {
                status = 'Upcoming';
            } else if (currentDate <= new Date(activity.endDate)) {
                status = 'Ongoing';
            }
            return {
                ...activity,
                startDate,
                endDate,
                status,
                totalFinishedStudents
            }
        })
    )
    return newActivities;
}

async function getActivitiesBySubjectAndUser(subjectId = null, userId, type = null) {
    var newSubjectId = Number(subjectId)
    var activities = await prisma.activity.findMany({
        where: subjectId ? { subjectId: newSubjectId } : {},
        include: {
            answers: true,
            subject: true,
        },
    })

    const account = await getUserById(userId)

    for(var i = activities.length - 1; i >= 0; i--){
        var doesExist = false
        for(var j = 0; j < account.student.subjects.length; j++){
            if (activities[i].subjectId == account.student.subjects[j].id){
                doesExist = true
                break
            }
        }
        if(!doesExist){
            activities = activities.splice(i, i)
        }
    }
  
    const formattedActivities = await Promise.all(activities
        .filter((activity) => {
            const currentDate = new Date()
            const startDate = new Date(activity.startDate)
            return currentDate >= startDate
        })
        .map(async (activity) => {
            const currentDate = new Date()
            const endDate = new Date(activity.endDate)
            const daysLeft = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24))
            const formattedEndDate = endDate.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
            })
            const status = currentDate <= endDate ? "Ongoing" : "Expired"
            const answered = await checkIfAnswered(account.student.id, activity.id)
            return { ...activity, formattedEndDate, status, daysLeft, answered }
        })
    )
  
    if (type) {
        return formattedActivities.filter((activity) => activity.type === type)
    } else {
        return formattedActivities;
    }
}

async function getQuestions(activity){
    var questions = await prisma.question.findMany({
        where:{
            activityId: activity.id
        }
    })
    for( var i = 0; i < questions.length; i++){
        var question = questions[i]
        question.choices = question.choices.split('/=/=/')

        var imageName = await getImageName(question.id)
        questions[i] = {
            ...question,
            withImg: imageName
        }
    }
    return questions
}

async function getImageName(questionId){
    var imageRecord = await prisma.file.findUnique({
        where:{
            questionId: Number(questionId)
        }
    })
    return imageRecord
}

async function getSubjectUniqueCode(){
    var code = generateRandomString(5)
    var subject = await prisma.subject.findUnique({
        where:{
            uniqueCode: code
        }
    })

    if(subject == null)
        return code
    else
        return await getSubjectUniqueCode()
}

async function getTotalStudents(subject){
    var count = 0
    await prisma.subject.findUnique({
        where:{
            id: subject.id
        },
        select:{
            students:{
                distinct: ['id']
            }
        }
    }).then((subject) => {
        count = subject.students.length
    }).catch((error) => {
        console.error(error)
    })
    return count
}

async function getOnGoingActivities(userId) {
    const currentDate = new Date();
    const timezoneOffset = currentDate.getTimezoneOffset() * 60000; // convert to milliseconds
    const currentISODate = new Date(currentDate.getTime() - timezoneOffset).toISOString();
    const student = await prisma.student.findUnique({
        where: {
            userId: userId,
        },
        include: {
            subjects: {
            include: {
                activities: {
                    where: {
                        startDate: {
                            lte: currentISODate,
                        },
                        endDate: {
                            gt: currentISODate,
                        },
                    },
                    orderBy: {
                        endDate: 'asc',
                    },
                    include:{
                        subject: true
                    }
                },
            },
            },
        },
    });
  
    const ongoingActivities = await Promise.all(student.subjects.flatMap((subject) =>
        subject.activities.map(async (activity) => {
            var isAnswered = (await checkIfAnswered(student.id, activity.id)) != null
            const daysLeft = Math.floor(
                (Date.parse(activity.endDate) - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const formattedEndDate = new Date(activity.endDate).toLocaleString(
                "en-US",
                {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }
            );
            return {
                ...activity,
                status: 'Available',
                daysLeft,
                formattedEndDate,
                isAnswered
            };
        })
    ));
    return ongoingActivities;
}

async function getQuestionsWithStatus(activity, studentId) {
    for(var i = 0; i < activity.questions.length; i++){
        var questionId = activity.questions[i].id
        var answered = await prisma.answeredQuestion.findFirst({
            where:{
                AND:[
                    {questionId},
                    {studentId}
                ]
            }
        })
        activity.questions[i] = {
            ...activity.questions[i],
            status: answered != null,
            answerStatus: answered != null ? answered.answer : null
        }
    }
    return activity
}

async function checkIfAnswered(studentId, activityId){
    return await prisma.answeredActivity.findFirst({
        where:{
            AND:[
                {activityId: Number(activityId)},
                {studentId}
            ]
        }
    })
}

async function getStudentScore(studentId, activityId){
    var activity = await prisma.activity.findUnique({
        where:{
            id: Number(activityId)
        }
    })
    var questions = await getQuestions(activity)
    
    var data = await prisma.question.findMany({
        where:{
            activityId: Number(activityId)
        },
        include:{
            answers:{
                where:{
                    studentId: Number(studentId)
                }
            }
        }
    })

    var score = 0

    for(var i = 0; i < data.length; i++){
        var answer = data[i].answer

        if(data[i].answers[0] == null){
            break
        }

        var studentAnswer = data[i].answers[0].answer
        score += (answer == studentAnswer) ? 1 : 0
    }

    return score
}

async function getStudentsBySubject(subjectUniqueCode){
    var subject = await prisma.subject.findUnique({
        where:{
            uniqueCode: subjectUniqueCode
        },
        include:{
            students:{
                include:{
                    user: true
                }
            }
        }
    })
    return subject.students
}

async function getStudentsFinishedByActivity(activityId){
    var answeredActivity = await prisma.answeredActivity.findMany({
        where:{
            activityId: Number(activityId)
        }
    })
    return answeredActivity
}

async function getStudentsActivityDetails(activityId){
    var activity = await prisma.activity.findUnique({
        where:{
            id: Number(activityId)
        },
        include:{
            questions: true
        }
    })
    var students = await prisma.answeredActivity.findMany({
        where:{
            activityId: Number(activityId)
        },
        include:{
            student: {
                include:{
                    user: true,
                    answers:{
                        include:{
                            question: true
                        }
                    }
                }
            }
        }
    })

    var endDate = new Date(activity.endDate)

    for(var i = 0; i < students.length; i++){
        var studentDate = new Date(students[i].answeredAt)
        students[i] = {
            ...students[i],
            ontime: studentDate <= endDate
        }
    }
    
    return students
}

async function getMaterial(activity){
    var material = await prisma.material.findUnique({
        where:{
            activityId: activity.id
        }
    })
    return material
}

function modifyFileName(fileName){
    let cleanedString = fileName.replace(/[ /]+/g, '_')
    return cleanedString
}

function shuffleChoices(choicesArr){
    const filteredArr = choicesArr.filter(element => element !== '')
    var newChoicesArr = filteredArr.sort(() => Math.random() - 0.5)
    return newChoicesArr
}

async function getQuestionsData(fileName){
    const fileBuffer = fs.readFileSync(`public/uploads/${fileName}`)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    const headers = data[0]

    const result = []

    for (let i = 1; i < data.length && i < 300; i++) {
        const row = data[i]
        var obj = {}
        var answer = ''

        for (let j = 0; j < headers.length; j++) {
            var key = headers[j].toLowerCase()
            if(j == 1){
                obj[key] = changeType(row[j])
                continue
            }else if(j == 3){
                obj[key] = improveChoices(row[1], row[j])
                if(row[1].toLowerCase() == 'multiple choice'){
                    answer = row[j].split('\r')[0]
                }else if(row[1].toLowerCase() == 'identification'){
                    answer = row[j]
                }
                continue
            }
            obj[headers[j].toLowerCase()] = row[j]
        }
        obj = {
            ...obj,
            answer
        }
        result.push(obj)
    }
    
    return result
}

function changeType(type){
    if(type.toLowerCase() == 'multiple choice'){
        return 'mc'
    }else if(type.toLowerCase() == 'identification'){
        return 'i'
    }

    return '404'
}

function improveChoices(type, choices){
    type = type.toLowerCase()
    if(type == 'multiple choice'){
        var splitChoices = choices.split('\r\n')
        choices = ''
        for(var i = 0; i < splitChoices.length; i++){
            choices += splitChoices[i] + '/=/=/'
        }
        return choices
    }else if(type == 'identification'){
        return 'no choices'
    }

    return '404'
}

async function getExamStartRecord(studentId, activityId){
    return await prisma.examStartRecord.findFirst({
        where:{
            AND:[
                {studentId: studentId},
                {activityId: activityId}
            ]
        }
    })
}

function generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length/2))
      .toString('hex')
      .slice(0,length)
}

function checkAdmin (req, res, next){
    if(req.body.accountId == 'admin' && req.body.password == 'admin')
        return res.redirect('/admin')
    next()
}

async function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }

    res.redirect('/')
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/dashboard')
    }

    next()
}

app.listen(8080, '0.0.0.0')