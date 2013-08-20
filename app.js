
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , api  = require('./routes/api') 
  , front  = require('./routes/index') 
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , multipart = require('connect-multipart-gridform');

var app = express();

if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb-1.8'][0]['credentials'];
}
else{
    var mongo = {
    "hostname":"localhost",
    "port":27017,
    "username":"",
    "password":"",
    "name":"bbox",
    "db":"db"
    }
}
var generate_mongo_url = function(obj){
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
    else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}
var mongourl = generate_mongo_url(mongo);

//var dbURL = 'mongodb://localhost:27017/bbox';
var db = mongoose.connect(mongourl);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));

app.use(express.methodOverride());
app.use(multipart({
      db : db.connection.db,
      mongo : db.mongo
    }));
// app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'super-duper-secret-secret' }));

app.use(express.json());
app.use(express.urlencoded());	
app.use(app.router);	
app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var files = require('./routes/files')(db.connection.db);
var users = require('./users/userapi')(db.connection.db);
var IsLoggedIn = require('./users/modules/IsloggedIn');

app.get('/pc', IsLoggedIn,routes.index);
app.get('/list', IsLoggedIn,front.showall);
app.get('/api/new', front.newitem);
app.post('/api/insert', files.showUploadFiles,api.insert);
app.get('/api/list', IsLoggedIn,api.showall);
app.get('/api/calendarlist',IsLoggedIn, api.calendar);
app.get('/api/files', IsLoggedIn,files.getFiles, files.filesList);
app.post('/api/files',IsLoggedIn,files.showUploadFiles, files.getFiles, files.filesList);
app.get('/download/:fileId',IsLoggedIn,files.download);
app.get('/remove/:fileId',IsLoggedIn,files.remove, files.getFiles, files.filesList);
app.get('/api/del/:token',IsLoggedIn,api.delitem,files.remove,files.getFiles, files.filesList);
app.post('/api/upd',IsLoggedIn,api.upditem);

app.get('/login',users.login); 
app.post('/api/login',users.login_onpost);
app.get('/signup',users.signup); 
app.post('/api/signup',users.signup_onpost);

app.get('/', IsLoggedIn ,api.mobile);
//app.get('/',IsLoggedIn ,routes.index);
app.get('/logout', IsLoggedIn ,users.logout);
app.post('/logout', IsLoggedIn ,users.logout_onpost);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
