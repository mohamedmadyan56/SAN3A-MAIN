const dotevn = require('dotenv');
dotevn.config({path:'./.env'});

const app = require('./app');
const prisma = require('./src/utils/prisma')




async function startServer (){
  try{
    await prisma.$connect();
    console.log('Datavase connected successfully (PostgresSQL+Prisma)!');
    const port = process.env.PORT ||5000;
    app.listen(port,()=>{
      console.log(`Server is running on port ${port} ....`);

    })
  }catch(err){
   console.log('Database connection error:', err.message);
  process.exit(1);
  }
}


startServer();



process.on('SIGINT',async()=>{
  await prisma.$disconnect();
  process.exit(0);
  
})