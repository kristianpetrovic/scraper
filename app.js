const express = require('express')
const app = express()
const cors = require('cors')
const {Pool} = require("pg")
const dotenv = require('dotenv')
//Require the scrapers
const { igScraper } = require('./igScraper')
const { tiktokScraper } = require('./tiktokScraper')

dotenv.config()

const pool = new Pool({
        "user": process.env.PGUSER,
        "password" : process.env.PGPASSWORD,
        "host" : process.env.PGHOST,
        "port" : process.env.PGPORT,
        "database" : process.env.PGDATABASE
})


//Middlewares
app.use(express.json()) //Used to parse JSON bodies
app.use(cors())



// ROUTES
// For those two routes we can keep them here
// For more we should move them to the Routes folder
app.get('/instagram', async function (req, res) {

        const data = await igScraper()
        
        res.setHeader('Content-type', 'application/json')
        res.send( data )

        // save to the db

})

app.get('/tiktok', async function (req, res) {

        const data = await tiktokScraper()
        
        res.setHeader('Content-type', 'application/json')
        console.log(data)
        res.send( data )

})

//Listening to the server
app.listen( process.env.PORT || 3000, ()=>console.log(`Your port is ${process.env.PORT || '3000'}`))



//MOVE DB TO SEPARATE MODULE/FILE
//POSTGRESS

start()

async function start() {
    await connect();
    await createTables();
}

//TRY TO RETRY TO CONNECT TO DB IF FAIL
// let retries = 5;

// while(retries == 0 ){

//     try{
//         async () => {
//             await connect();
//             break;
//         }
        
//     }
//     catch(e){
//         retries -= 1;
//         return new Promise( (res, rej) => setTimeout( ()=>{ console.log() }, 5000 ))
//         console.log(e)
//     }

// }

async function createTables(){
        //create tables
        const queryTK = `
                CREATE TABLE tiktok (
                profileImg varchar,
                fullname varchar,
                username varchar,
                likes int,
                desc varchar,
                following int,
                followers int
                );
        `;
        pool.query(queryTK, (err, res) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('Table tiktok is successfully created');
        });

        const queryIG = `
                CREATE TABLE instagram (
                profileImg varchar,
                fullname varchar,
                username varchar,
                posts int,
                followerCount int,
                FollowingCount int,
                notFollowingYouCount int,
                notFollowingThemCount int,
                );
        `;

        pool.query(queryIG, (err, res) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('Table instagram is successfully created');
        });
}

async function connect() {
    try {
        await pool.connect(); 
    }
    catch(e) {
        console.error(`Failed to connect ${e}`)
    }
}

async function readIGdata() {
    try {
    const results = await pool.query("select * from instagram");
    return results.rows;
    }
    catch(e){
        return [];
    }
}

async function readTKdata() {
        try {
        const results = await pool.query("select * from tiktok");
        return results.rows;
        }
        catch(e){
            return [];
        }
    }

async function createIGdata(data){

    try {
        await pool.query("insert into instagram (text) values ($1)", [data]);
        return true
        }
        catch(e){
            return false;
        }
}

async function createTKdata(data){

        try {
            await pool.query("insert into tiktok (text) values ($1)", [data]);
            return true
            }
            catch(e){
                return false;
            }
    }