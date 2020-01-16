# TRAVNESIA RESTful API
Required:
- 
> Install NPM (https://www.npmjs.com/get-npm) <br>
> Install MongoDB (https://docs.mongodb.com/manual/installation/) <br>
> Install Latest Nodejs version (https://nodejs.org/en/download/) <br>
> Postman API Tools (https://www.getpostman.com/) <br>
> Studio 3T as MongoDB GUI (https://studio3t.com/download/)

Preparing Setup Local App Enviroment:
-
> Go to project directory <br>
> execute command `npm install` <br>
> start server by execute command `nodemon` or `nodemon start`<br>
> open `http://localhost:3000/` in your browser<br>

Existing API Routes:
-
> `base_url/api/v1/user/signin` API routes for user login (user:user) <br>
> `base_url/api/v1/user/logout` API routes for user logout. there's no session destroy. <br>
> `base_url/api/v1/user/signup` API for User registration <br>

User Registration Parameter
- u_group (integer)
- username (String)
- password (String)
- status (integer)
